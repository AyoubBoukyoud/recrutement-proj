<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CandidateProfileResolver;
use App\Services\ProfileCompleteness;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Candidate controls for recruiter visibility and revocable CNDP consent. */
class CandidateVisibilityController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return $this->respond($request);
    }

    public function pause(Request $request): JsonResponse
    {
        CandidateProfileResolver::resolve($request->user())->update(['visibility_paused_at' => now()]);

        return $this->respond($request);
    }

    public function resume(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());
        abort_if($profile->cndp_withdrawn_at, 409, 'CNDP consent must be granted again before resuming visibility.');
        $profile->update(['visibility_paused_at' => null]);

        return $this->respond($request);
    }

    public function withdraw(Request $request): JsonResponse
    {
        CandidateProfileResolver::resolve($request->user())->update([
            'cndp_withdrawn_at' => now(),
            'visibility_paused_at' => now(),
        ]);

        return $this->respond($request);
    }

    public function grant(Request $request): JsonResponse
    {
        CandidateProfileResolver::resolve($request->user())->update([
            'cndp_consent_at' => now(),
            'cndp_withdrawn_at' => null,
            'visibility_paused_at' => null,
        ]);

        return $this->respond($request);
    }

    private function respond(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user())->fresh();

        return response()->json([
            'visible' => (bool) ($profile->terms_consent_at
                && $profile->cndp_consent_at
                && ! $profile->cndp_withdrawn_at
                && ! $profile->visibility_paused_at),
            'paused' => (bool) $profile->visibility_paused_at,
            'withdrawn' => (bool) $profile->cndp_withdrawn_at,
            'completeness' => ProfileCompleteness::for($profile),
        ]);
    }
}
