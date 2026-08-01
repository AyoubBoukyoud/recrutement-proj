<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * The last resort when a candidate has lost the number *and* every signed-in
 * device, so PhoneChangeController is out of reach. An administrator confirms
 * identity off-platform — the dossier holds a CV, a photo ID and a
 * presentation video to check against — and moves the account across.
 *
 * Deliberately not self-service: with only a phone number as an identifier,
 * an unattended version of this endpoint is an account-takeover button.
 */
class AdminAccountRecoveryController extends Controller
{
    public function reassignPhone(Request $request, User $user): JsonResponse
    {
        $request->merge(['phone' => PhoneNumber::normalize((string) $request->input('phone', ''))]);

        $data = $request->validate([
            'phone' => [
                'required', 'string', 'max:20', PhoneNumber::E164_RULE,
                Rule::unique('users', 'phone')->ignore($user->id),
            ],
            // Required, and logged: an account handover has to leave a trace of
            // who authorised it and on what evidence.
            'reason' => ['required', 'string', 'min:10', 'max:500'],
        ], [
            'phone.regex' => 'Enter the number in international format, for example +212600000000.',
            'phone.unique' => 'That number already belongs to another account.',
        ]);

        $previous = $user->phone;

        $user->forceFill([
            'phone' => $data['phone'],
            // The new number has not proved itself; the candidate signs in with
            // an OTP as usual, which is what verifies it.
            'phone_verified_at' => null,
        ])->save();

        // Every existing session belonged to the identity being replaced.
        $revoked = $user->tokens()->delete();

        Log::warning('Administrator reassigned a candidate phone number.', [
            'admin_id' => $request->user()->id,
            'user_id' => $user->id,
            'from' => $previous,
            'to' => $user->phone,
            'reason' => $data['reason'],
            'sessions_revoked' => $revoked,
        ]);

        return response()->json([
            'message' => 'Phone number reassigned. The candidate can now sign in with the new number.',
            'user' => ['id' => $user->id, 'phone' => $user->phone],
            'sessions_revoked' => $revoked,
        ]);
    }
}
