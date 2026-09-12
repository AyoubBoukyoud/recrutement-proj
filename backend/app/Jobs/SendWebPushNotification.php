<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\WebPushSender;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * `WebPushSender::sendToUser` makes one HTTP call per subscribed device to
 * that browser's push service — queued so creating an `AppNotification`
 * (which happens inline in a dozen request paths) never waits on that.
 */
class SendWebPushNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        private readonly int $userId,
        private readonly string $title,
        private readonly string $body,
        private readonly ?string $link,
    ) {}

    public function backoff(): array
    {
        return [10, 60];
    }

    public function handle(WebPushSender $webPush): void
    {
        $user = User::find($this->userId);
        if (! $user) {
            return;
        }

        $webPush->sendToUser($user, $this->title, $this->body, $this->link);
    }
}
