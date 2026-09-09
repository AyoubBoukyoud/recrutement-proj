<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReferralAgent;
use App\Services\ReferralCommissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/** Candidate view of the shared referral and commission programme. */
class CandidateReferralController extends Controller
{
    public function __construct(private readonly ReferralCommissions $commissions) {}

    public function show(Request $request): JsonResponse
    {
        $agent = ReferralAgent::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['qr_code_token' => Str::random(24)],
        );
        $registrations = $agent->registrations()
            ->with('candidateProfile:id,first_name,last_name,submitted_at')
            ->latest('registered_at')
            ->get()
            ->map(fn ($registration) => [
                'id' => $registration->id,
                'candidate_name' => trim(
                    ($registration->candidateProfile?->first_name ?? '').' '.
                    ($registration->candidateProfile?->last_name ?? '')
                ) ?: null,
                'status' => $registration->commission_status,
                'registered_at' => $registration->registered_at,
            ]);

        return response()->json([
            'code' => $agent->qr_code_token,
            'registrations_count' => $registrations->count(),
            'registrations' => $registrations,
            'earnings' => $this->commissions->summaryFor($agent->id),
        ]);
    }
}
