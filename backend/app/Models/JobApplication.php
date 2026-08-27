<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A submitted application; its candidate link may be cleared by CNDP purge. */
#[Fillable(['candidate_profile_id', 'job_offer_id', 'status', 'applied_at', 'status_changed_at', 'withdrawn_at', 'anonymized_at'])]
class JobApplication extends Model
{
    protected function casts(): array
    {
        return [
            'applied_at' => 'datetime',
            'status_changed_at' => 'datetime',
            'withdrawn_at' => 'datetime',
            'anonymized_at' => 'datetime',
        ];
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(JobOffer::class, 'job_offer_id');
    }
}
