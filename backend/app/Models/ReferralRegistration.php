<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['referral_agent_id', 'candidate_profile_id', 'registered_at'])]
class ReferralRegistration extends Model
{
    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
        ];
    }

    public function referralAgent(): BelongsTo
    {
        return $this->belongsTo(ReferralAgent::class);
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }
}
