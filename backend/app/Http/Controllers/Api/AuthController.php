<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\ReferralAgent;
use App\Models\User;
use App\Services\OtpService;
use App\Support\PhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AuthController extends Controller
{
    public function __construct(private readonly OtpService $otpService) {}

    public function requestOtp(Request $request): JsonResponse
    {
        // Normalise before validating so "+212 600-000-000" and "00212600000000"
        // reach the same account, the same OTP record and the same throttle
        // bucket as "+212600000000".
        $request->merge(['phone' => PhoneNumber::normalize((string) $request->input('phone', ''))]);

        $data = $request->validate([
            'phone' => ['required', 'string', 'max:20', PhoneNumber::E164_RULE],
            'referral_token' => ['sometimes', 'nullable', 'string'],
        ], [
            'phone.regex' => 'Enter your number in international format, for example +212600000000.',
        ]);

        $user = User::firstOrCreate(['phone' => $data['phone']]);

        if (! $user->hasAnyRole(['User', 'Administrator', 'Commercial Agent', 'Company'])) {
            $user->assignRole('User');
        }

        // Only attach a referral if the candidate doesn't have a profile yet —
        // consumed in CandidateProfileResolver at profile-creation time.
        if (! empty($data['referral_token']) && ! $user->candidateProfile) {
            // Accepts a token an agent has since rotated away from, until the
            // grace period on it runs out — printed QR codes outlive buttons.
            $agent = ReferralAgent::findByToken($data['referral_token']);
            if ($agent) {
                $user->forceFill(['pending_referral_agent_id' => $agent->id])->save();
            }
        }

        // Throttling, delivery failure and channel choice are all raised as
        // exceptions that render themselves — see App\Services\Otp\Exceptions.
        $dispatch = $this->otpService->send($data['phone'], OtpCode::PURPOSE_LOGIN, $user);

        return response()->json([
            'message' => 'OTP sent.',
            ...$dispatch->toArray(),
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $request->merge(['phone' => PhoneNumber::normalize((string) $request->input('phone', ''))]);

        $data = $request->validate([
            'phone' => ['required', 'string', PhoneNumber::E164_RULE],
            'code' => ['required', 'string', 'size:'.config('otp.code_length', 6)],
            // Named so the candidate can recognise it in their device list.
            'device_name' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $this->otpService->verify($data['phone'], $data['code']);

        $user = User::where('phone', $data['phone'])->first();

        if (! $user) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        $user->forceFill(['phone_verified_at' => Carbon::now()])->save();

        $token = $user->createToken($data['device_name'] ?? null ?: 'Mobile app');

        return response()->json([
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
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * Revoke only the token that made this call, so logging out on a phone
     * leaves the same candidate's other devices signed in. The client clears
     * its own storage whether or not this succeeds — a logout that depends on
     * the network would strand a user on a device they want to hand back.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
