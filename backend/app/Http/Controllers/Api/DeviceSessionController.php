<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * One Sanctum token per device, so a candidate who signed in at a cybercafé
 * can see it and cut it off from their own phone. Tokens never expire on their
 * own, which makes being able to list and revoke them the only control there
 * is over an old session.
 */
class DeviceSessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentId = $request->user()->currentAccessToken()->getKey();

        $sessions = $request->user()->tokens()
            ->orderByRaw('last_used_at IS NULL')
            ->orderByDesc('last_used_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PersonalAccessToken $token) => [
                'id' => $token->getKey(),
                'device_name' => $token->name,
                'last_used_at' => $token->last_used_at,
                'created_at' => $token->created_at,
                'current' => $token->getKey() === $currentId,
            ]);

        return response()->json(['sessions' => $sessions]);
    }

    public function destroy(Request $request, string $session): JsonResponse
    {
        // Scoped to the caller's own tokens: the id is a plain integer, so
        // looking it up globally would let anyone sign anyone else out.
        $token = $request->user()->tokens()->whereKey($session)->first();

        if (! $token) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        $isCurrent = $token->getKey() === $request->user()->currentAccessToken()->getKey();
        $token->delete();

        return response()->json([
            'message' => 'Session revoked.',
            // The client must clear its own storage when it just revoked itself.
            'was_current' => $isCurrent,
        ]);
    }

    /** The "I lost a phone" button: everything but the device in hand. */
    public function revokeOthers(Request $request): JsonResponse
    {
        $currentId = $request->user()->currentAccessToken()->getKey();

        $revoked = $request->user()->tokens()->whereKeyNot($currentId)->delete();

        return response()->json([
            'message' => 'Other sessions revoked.',
            'revoked' => $revoked,
        ]);
    }
}
