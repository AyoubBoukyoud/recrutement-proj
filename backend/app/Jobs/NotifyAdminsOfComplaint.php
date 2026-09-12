<?php

namespace App\Jobs;

use App\Models\Complaint;
use App\Models\User;
use App\Notifications\ComplaintSubmitted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Throwable;

/**
 * Actually tells somebody. `complaints.admin_notified_at` used to be stamped
 * at insert while nothing was ever sent — the column asserted a delivery that
 * had not happened, and the only real mechanism was an admin happening to have
 * the dashboard open.
 *
 * The timestamp is now written here, after a channel has accepted the message,
 * so an unnotified complaint is visible as one.
 */
class NotifyAdminsOfComplaint implements ShouldQueue
{
    use Queueable;

    /** A complaint alert is worth persisting through a mail server hiccup. */
    public int $tries = 3;

    public function __construct(private readonly int $complaintId) {}

    public function backoff(): array
    {
        return [30, 120];
    }

    public function handle(): void
    {
        $complaint = Complaint::with('user')->find($this->complaintId);
        if (! $complaint || $complaint->admin_notified_at) {
            return;
        }

        $delivered = $this->mailAdministrators($complaint);
        // Slack is additive: a webhook that fails must not suppress the mail
        // that already went, nor mark an emailed complaint as unnotified.
        $delivered = $this->postToSlack($complaint) || $delivered;

        if (! $delivered) {
            Log::warning(
                "Complaint {$complaint->id} could not be announced: no administrator has an email address, "
                .'COMPLAINT_ALERT_EMAIL is unset and no Slack webhook is configured.'
            );

            return;
        }

        $complaint->forceFill(['admin_notified_at' => now()])->save();
    }

    private function mailAdministrators(Complaint $complaint): bool
    {
        $admins = User::role('Administrator')->whereNotNull('email')->get();
        $fallback = config('complaints.alert_email');

        if ($admins->isEmpty() && blank($fallback)) {
            return false;
        }

        $notification = new ComplaintSubmitted($complaint);

        try {
            if ($admins->isNotEmpty()) {
                Notification::send($admins, $notification);
            }
            if (filled($fallback)) {
                Notification::route('mail', $fallback)->notify($notification);
            }
        } catch (Throwable $e) {
            Log::error("Complaint {$complaint->id} alert email failed: ".$e->getMessage());

            return false;
        }

        return true;
    }

    private function postToSlack(Complaint $complaint): bool
    {
        $webhook = config('complaints.slack_webhook');
        if (blank($webhook)) {
            return false;
        }

        $from = $complaint->user?->name ?? $complaint->user?->phone ?? 'a candidate';
        $detail = $complaint->type === 'text' && filled($complaint->body)
            ? $complaint->body
            : '(voice note — open the dashboard to listen)';

        try {
            $response = Http::timeout(10)->post($webhook, [
                'text' => "*New complaint from {$from}*\n{$detail}",
            ]);
        } catch (Throwable $e) {
            Log::error("Complaint {$complaint->id} Slack alert failed: ".$e->getMessage());

            return false;
        }

        if ($response->failed()) {
            Log::error("Complaint {$complaint->id} Slack alert returned {$response->status()}.");

            return false;
        }

        return true;
    }
}
