<?php

namespace App\Services;

use App\Models\CandidateProfile;
use App\Models\ReferralRegistration;
use App\Models\User;

/**
 * Get-or-create the caller's candidate profile. Centralized (rather than
 * `$user->candidateProfile()->firstOrCreate([])` inline in every controller)
 * because profile *creation* is also the moment a pending QR referral
 * (see AuthController::requestOtp) gets attributed to the referring agent.
 */
class CandidateProfileResolver
{
    public static function resolve(User $user): CandidateProfile
    {
        $profile = $user->candidateProfile()->firstOrCreate([]);

        if ($profile->wasRecentlyCreated && $user->pending_referral_agent_id) {
            ReferralRegistration::create([
                'referral_agent_id' => $user->pending_referral_agent_id,
                'candidate_profile_id' => $profile->id,
                'registered_at' => now(),
            ]);

            $user->forceFill(['pending_referral_agent_id' => null])->save();
        }

        return $profile;
    }
}
