<?php

namespace App\Services;

use App\Models\User;

/**
 * Opens a signed-in session: one Sanctum personal access token, the same
 * whichever way the person proved who they are (phone code or Google). Every
 * sign-in method returns this exact payload, so the client, the device list,
 * logout and revocation have one kind of session to deal with.
 */
class AuthSession
{
    /**
     * @return array<string, mixed>
     */
    public function issue(User $user, ?string $deviceName): array
    {
        $token = $user->createToken($deviceName ?: 'Mobile app');

        return [
            'token' => $token->plainTextToken,
            'session' => [
                'id' => $token->accessToken->getKey(),
                'device_name' => $token->accessToken->name,
            ],
            'user' => [
                'id' => $user->id,
                'phone' => $user->phone,
                'roles' => $user->getRoleNames(),
            ],
            'deletion_pending' => $user->deletion_requested_at !== null,
        ];
    }

    /**
     * The sign-in rule shared by every method: blocked and deactivated
     * accounts stay out, except one awaiting deletion, which must be able to
     * get in to cancel it.
     */
    public function canSignIn(User $user): bool
    {
        return $user->isActive() || $user->deletion_requested_at !== null;
    }
}
