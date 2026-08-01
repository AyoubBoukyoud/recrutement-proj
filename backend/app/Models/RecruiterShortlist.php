<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One recruiter's working relationship with one candidate: whether they saved
 * them, where the conversation has got to, their private notes, and whether
 * they have taken the contact details.
 */
#[Fillable(['user_id', 'candidate_profile_id', 'stage', 'notes', 'contact_revealed_at'])]
class RecruiterShortlist extends Model
{
    public const STAGES = ['saved', 'contacted', 'interviewing', 'placed', 'rejected'];

    protected function casts(): array
    {
        return [
            'contact_revealed_at' => 'datetime',
        ];
    }

    /** The recruiter, not the candidate. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }
}
