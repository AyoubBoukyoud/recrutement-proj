<?php

namespace App\Notifications;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * What an administrator receives the moment a candidate reports a problem.
 *
 * Deliberately quotes the complaint rather than only linking to it: the
 * point of an alert is to let someone judge urgency without opening a laptop.
 * A voice note has nothing to quote, so it says so and links instead.
 */
class ComplaintSubmitted extends Notification
{
    use Queueable;

    public function __construct(public readonly Complaint $complaint) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $from = $this->complaint->user?->name ?? $this->complaint->user?->phone ?? 'a candidate';

        $message = (new MailMessage)
            ->subject("New {$this->complaint->type} complaint from {$from}")
            ->greeting('A candidate reported a problem.')
            ->line("From: {$from}")
            ->line('Received: '.$this->complaint->created_at->toDayDateTimeString());

        if ($this->complaint->type === 'text' && filled($this->complaint->body)) {
            // Quoted, not paraphrased — the wording is the content.
            $message->line('---')->line($this->complaint->body)->line('---');
        } else {
            $message->line('This is a voice note; open the dashboard to listen to it.');
        }

        $dashboard = config('complaints.dashboard_url');

        return $dashboard
            ? $message->action('Open the dashboard', $dashboard)
            : $message;
    }
}
