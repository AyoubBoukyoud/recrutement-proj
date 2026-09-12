<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Delivers a real browser/OS notification for a `Notifications::create()`
 * call — see `AppServiceProvider` where it's wired into that method. Every
 * notification type already defined there (application status, interview
 * scheduled, document reviewed...) reaches the browser through this one
 * path, with no per-type plumbing needed.
 */
class WebPushSender
{
    public function enabled(): bool
    {
        return filled(config('webpush.public_key')) && filled(config('webpush.private_key'));
    }

    public function sendToUser(User $user, string $title, string $body, ?string $link = null): void
    {
        if (! $this->enabled()) {
            return;
        }

        $subscriptions = PushSubscription::where('user_id', $user->id)->get();
        if ($subscriptions->isEmpty()) {
            return;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => config('webpush.subject'),
                'publicKey' => config('webpush.public_key'),
                'privateKey' => config('webpush.private_key'),
            ],
        ]);

        $payload = json_encode(['title' => $title, 'body' => $body, 'link' => $link ?? '/']);

        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->p256dh,
                    'authToken' => $subscription->auth,
                ]),
                $payload,
            );
        }

        // Expired/revoked subscriptions (410 Gone, 404 Not Found — the
        // browser dropped it, or the user revoked permission) are pruned as
        // they're reported rather than left to fail silently forever.
        $staleHashes = [];
        foreach ($webPush->flush() as $report) {
            if ($report->isSubscriptionExpired()) {
                $staleHashes[] = PushSubscription::hash($report->getEndpoint());
            }
        }
        if ($staleHashes !== []) {
            PushSubscription::whereIn('endpoint_hash', $staleHashes)->delete();
        }
    }
}
