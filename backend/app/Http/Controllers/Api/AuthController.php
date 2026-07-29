<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReferralAgent;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly OtpService $otpService) {}

    public function requestOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'min:8', 'max:20'],
            'referral_token' => ['sometimes', 'nullable', 'string'],
        ]);

        $user = User::firstOrCreate(['phone' => $data['phone']]);

        if (! $user->hasAnyRole(['User', 'Administrator', 'Commercial Agent', 'Company'])) {
            $user->assignRole('User');
        }

        // Only attach a referral if the candidate doesn't have a profile yet —
        // consumed in CandidateProfileResolver at profile-creation time.
        if (! empty($data['referral_token']) && ! $user->candidateProfile) {
            $agent = ReferralAgent::where('qr_code_token', $data['referral_token'])->first();
            if ($agent) {
                $user->forceFill(['pending_referral_agent_id' => $agent->id])->save();
            }
        }

        $code = $this->otpService->generateAndSend($user);

        return response()->json([
            'message' => 'OTP sent.',
            // Only ever returned locally, so the flow is testable without a paid SMS/WhatsApp provider.
            'debug_otp_code' => app()->environment('local') ? $code : null,
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('phone', $data['phone'])->first();

        if (! $user || ! $this->otpService->verify($user, $data['code'])) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
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
