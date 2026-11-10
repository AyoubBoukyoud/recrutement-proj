<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Sleep;
use Throwable;

/**
 * Watches the WhatsApp pairing that every sign-in code depends on.
 *
 * Evolution Go sends from a linked device, and when that link drops nothing
 * fails loudly: the gateway stays up, the API answers 502 to each candidate,
 * and the first anyone hears of it is a candidate who could not sign in. This
 * asks the gateway directly and tells an administrator instead.
 *
 * On a dropped session it first tries the documented remedy (POST
 * /instance/connect — the stored session reconnects without a QR while
 * WhatsApp still knows the device), and only alerts if that did not help.
 *
 * Alerts are sent on the second consecutive failure, so a gateway restarting
 * during a deploy stays quiet, then repeated every few hours while the outage
 * lasts, and followed by one "working again" message.
 */
class CheckWhatsAppPairing extends Command
{
    private const STATE_KEY = 'otp:whatsapp-pairing-health';

    protected $signature = 'otp:check-whatsapp
        {--no-reconnect : Only report; do not try to reconnect a dropped session}
        {--failures=2 : Consecutive failed checks before alerting}
        {--repeat-hours=6 : Hours between reminders while the outage lasts}';

    protected $description = 'Check the WhatsApp (Evolution Go) pairing used for sign-in codes and alert when it is down';

    public function handle(): int
    {
        if (! in_array('evolution', (array) config('otp.channels', []), true)) {
            $this->info('Evolution Go is not in OTP_CHANNELS; nothing to check.');

            return self::SUCCESS;
        }

        if (blank(config('otp.connections.evolution.base_url')) || blank(config('otp.connections.evolution.token'))) {
            $this->warn('Evolution Go is in OTP_CHANNELS but has no base URL or instance token.');

            return self::SUCCESS;
        }

        $problem = $this->probe();

        if ($problem !== null && ! $this->option('no-reconnect')) {
            $this->line("Pairing is down ({$problem}); trying to reconnect.");
            $this->reconnect();
            // The session comes back asynchronously after /instance/connect.
            Sleep::for(5)->seconds();
            $problem = $this->probe();
        }

        return $problem === null ? $this->recordHealthy() : $this->recordFailure($problem);
    }

    /** Null when the pairing can send; otherwise why it cannot. */
    private function probe(): ?string
    {
        try {
            $response = $this->gateway()->get($this->url('/instance/status'));
        } catch (ConnectionException $e) {
            return "the gateway is unreachable ({$e->getMessage()})";
        }

        if ($response->failed()) {
            return "the gateway answered {$response->status()} to the status check";
        }

        // No json tags on the Go structs, so the keys come back PascalCase.
        $connected = $response->json('data.Connected') ?? $response->json('data.connected');
        $loggedIn = $response->json('data.LoggedIn') ?? $response->json('data.loggedIn');

        if ($loggedIn === false) {
            return 'WhatsApp logged the device out — the QR code must be scanned again';
        }

        if ($connected === false) {
            return 'the WhatsApp session is disconnected';
        }

        if ($connected !== true) {
            return 'the status answer was not recognised: '.mb_substr($response->body(), 0, 200);
        }

        return null;
    }

    private function reconnect(): void
    {
        try {
            $this->gateway()->post($this->url('/instance/connect'), ['subscribe' => ['MESSAGE']]);
        } catch (Throwable $e) {
            // The probe that follows reports the outcome either way.
            $this->line("Reconnect request failed: {$e->getMessage()}");
        }
    }

    private function recordHealthy(): int
    {
        $state = Cache::get(self::STATE_KEY);
        Cache::forget(self::STATE_KEY);

        if (is_array($state) && ! empty($state['alerted_at'])) {
            $since = Carbon::parse($state['down_since'])->toDayDateTimeString();
            $this->notifyAdministrators(
                'WhatsApp sign-in codes are working again',
                "✅ *WhatsApp sign-in codes are working again.* The pairing had been down since {$since}."
            );
        }

        $this->info('WhatsApp pairing is connected.');

        return self::SUCCESS;
    }

    private function recordFailure(string $problem): int
    {
        $now = Carbon::now();
        $state = Cache::get(self::STATE_KEY);
        $state = is_array($state) ? $state : ['failures' => 0, 'down_since' => $now->toIso8601String(), 'alerted_at' => null];
        $state['failures']++;

        Log::warning("WhatsApp pairing check failed: {$problem}.", ['consecutive_failures' => $state['failures']]);
        $this->error("WhatsApp pairing is down: {$problem}.");

        $reminderDue = empty($state['alerted_at'])
            || Carbon::parse($state['alerted_at'])->addHours((int) $this->option('repeat-hours'))->isPast();

        if ($state['failures'] >= (int) $this->option('failures') && $reminderDue) {
            $since = Carbon::parse($state['down_since'])->toDayDateTimeString();
            $delivered = $this->notifyAdministrators(
                'WhatsApp sign-in codes are DOWN',
                "🔴 *WhatsApp sign-in codes are down* — {$problem}.\n"
                ."Nobody can sign in by phone until this is fixed (down since {$since}). "
                .'See "WhatsApp pairing" in deploy/README.md.'
            );

            // Left unset when nothing was delivered, so the next run tries again.
            if ($delivered) {
                $state['alerted_at'] = $now->toIso8601String();
            }
        }

        Cache::put(self::STATE_KEY, $state, $now->addDays(7));

        return self::FAILURE;
    }

    /** Slack and the ops mailbox, the same recipients a complaint alert uses. */
    private function notifyAdministrators(string $subject, string $text): bool
    {
        $delivered = false;

        $webhook = config('complaints.slack_webhook');
        if (filled($webhook)) {
            try {
                $delivered = Http::timeout(10)->post($webhook, ['text' => $text])->successful();
            } catch (Throwable $e) {
                Log::error('WhatsApp pairing Slack alert failed: '.$e->getMessage());
            }
        }

        $mailbox = config('complaints.alert_email');
        if (filled($mailbox)) {
            try {
                Mail::raw(str_replace('*', '', $text), fn ($message) => $message->to($mailbox)->subject($subject));
                $delivered = true;
            } catch (Throwable $e) {
                Log::error('WhatsApp pairing email alert failed: '.$e->getMessage());
            }
        }

        if (! $delivered) {
            Log::error("{$subject}, and nobody could be told: set COMPLAINT_SLACK_WEBHOOK or COMPLAINT_ALERT_EMAIL.");
        }

        return $delivered;
    }

    private function gateway(): PendingRequest
    {
        return Http::withHeaders(['apikey' => (string) config('otp.connections.evolution.token')])
            ->timeout((int) config('otp.connections.evolution.timeout', 15))
            ->asJson();
    }

    private function url(string $path): string
    {
        return rtrim((string) config('otp.connections.evolution.base_url'), '/').$path;
    }
}
