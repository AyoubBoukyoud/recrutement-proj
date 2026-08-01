<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Services\OtpService;
use App\Support\PhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Self-service account recovery: moving an account onto a new number.
 *
 * This is the path for the common loss — the SIM is gone but the phone still
 * has a session — and it is why logout does not drop other devices. A
 * candidate with no session left anywhere cannot use this and has to be
 * recovered by an administrator; see AdminAccountRecoveryController.
 *
 * Proof runs one way only: a code to the *new* number. The old number is by
 * assumption unreachable, so asking it to confirm would defeat the purpose;
 * possession of a signed-in device stands in for it.
 */
class PhoneChangeController extends Controller
{
    public function __construct(private readonly OtpService $otpService) {}

    public function request(Request $request): JsonResponse
    {
        $request->merge(['phone' => PhoneNumber::normalize((string) $request->input('phone', ''))]);

        $data = $request->validate([
            'phone' => [
                'required', 'string', 'max:20', PhoneNumber::E164_RULE,
                // Includes shell accounts created by an OTP request that was
                // never completed, which an administrator has to clear.
                Rule::unique('users', 'phone'),
            ],
        ], [
            'phone.regex' => 'Enter your number in international format, for example +212600000000.',
            'phone.unique' => 'That number already belongs to an account.',
        ]);

        $dispatch = $this->otpService->send(
            $data['phone'],
            OtpCode::PURPOSE_PHONE_CHANGE,
            $request->user(),
        );

        return response()->json([
            'message' => 'Verification code sent to the new number.',
            ...$dispatch->toArray(),
        ]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $request->merge(['phone' => PhoneNumber::normalize((string) $request->input('phone', ''))]);

        $data = $request->validate([
            'phone' => ['required', 'string', PhoneNumber::E164_RULE, Rule::unique('users', 'phone')],
            'code' => ['required', 'string', 'size:'.config('otp.code_length', 6)],
        ]);

        $user = $request->user();
        $record = $this->otpService->verify($data['phone'], $data['code'], OtpCode::PURPOSE_PHONE_CHANGE);

        // The code was sent to this number for somebody else's account.
        if ($record->user_id !== $user->id) {
            throw ValidationException::withMessages([
                'code' => 'That code was not issued for this account.',
            ]);
        }

        $previous = $user->phone;

        $user->forceFill([
            'phone' => $data['phone'],
            'phone_verified_at' => Carbon::now(),
        ])->save();

        // Whoever ends up with the old number must not inherit a session, and
        // the device driving this change is the one the candidate is holding.
        $revoked = $user->tokens()
            ->whereKeyNot($request->user()->currentAccessToken()->getKey())
            ->delete();

        Log::info('Candidate changed their phone number.', [
            'user_id' => $user->id,
            'from' => $previous,
            'to' => $user->phone,
            'sessions_revoked' => $revoked,
        ]);

        return response()->json([
            'message' => 'Phone number updated.',
            'user' => [
                'id' => $user->id,
                'phone' => $user->phone,
                'roles' => $user->getRoleNames(),
            ],
            'sessions_revoked' => $revoked,
        ]);
    }
}
