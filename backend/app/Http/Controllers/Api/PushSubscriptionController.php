<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Registers/removes a browser's `PushSubscription` (from
 * `pushManager.subscribe()`) against the signed-in user — any role, hence
 * this sits in the common authenticated group rather than a role-specific
 * one. See `WebPushSender` for what actually gets sent to it.
 */
class PushSubscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string', 'max:2048', $this->pushServiceEndpoint(...)],
            'keys' => ['required', 'array'],
            'keys.p256dh' => ['required', 'string'],
            'keys.auth' => ['required', 'string'],
        ]);

        // `updateOrCreate` on the hash: the same device re-subscribing (a
        // fresh permission grant after clearing site data, for instance)
        // replaces its old keys rather than colliding on the unique index.
        $subscription = PushSubscription::updateOrCreate(
            ['endpoint_hash' => PushSubscription::hash($data['endpoint'])],
            [
                'user_id' => $request->user()->id,
                'endpoint' => $data['endpoint'],
                'p256dh' => $data['keys']['p256dh'],
                'auth' => $data['keys']['auth'],
            ],
        );

        return response()->json($subscription, 201);
    }

    /**
     * Validation rule: an https URL, with no credentials or custom port, on a
     * known push service. See config/webpush.php for why.
     */
    private function pushServiceEndpoint(string $attribute, mixed $value, \Closure $fail): void
    {
        $parts = is_string($value) ? parse_url($value) : false;
        $host = is_array($parts) ? strtolower((string) ($parts['host'] ?? '')) : '';

        $allowed = $host !== ''
            && ($parts['scheme'] ?? null) === 'https'
            && ! isset($parts['user'], $parts['pass'])
            && (! isset($parts['port']) || $parts['port'] === 443)
            && collect(config('webpush.allowed_hosts', []))->contains(
                fn (string $suffix) => $host === $suffix || str_ends_with($host, '.'.$suffix),
            );

        if (! $allowed) {
            $fail('The push endpoint is not a supported push service.');
        }
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['endpoint' => ['required', 'string', 'max:2048']]);

        PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint_hash', PushSubscription::hash($data['endpoint']))
            ->delete();

        return response()->json(status: 204);
    }
}
