<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Issues the signed grant that unlocks prototype pages (fictional data) for one
 * browser. Signing in, even as an administrator, never unlocks them by itself:
 * the administrator must ask for a presentation, and the grant expires.
 */
class PresentationAccessController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('Administrator'), 403, 'Réservé aux administrateurs.');
        $secret = (string) config('presentation.secret');
        abort_if(strlen($secret) < 32, 503, 'Le mode présentation n’est pas configuré sur ce serveur.');

        $expires = now()->addMinutes(max(5, min(720, config('presentation.ttl_minutes'))));
        $payload = self::base64url(json_encode(['v' => 1, 'uid' => $user->id, 'exp' => $expires->getTimestamp()], JSON_THROW_ON_ERROR));
        $signature = self::base64url(hash_hmac('sha256', $payload, $secret, true));
        AdminActivityLog::record($user, $user, 'presentation_access_granted', ['expires_at' => $expires->toIso8601String()]);

        return response()->json(['grant' => $payload.'.'.$signature, 'expires_at' => $expires->toIso8601String()]);
    }

    private static function base64url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
