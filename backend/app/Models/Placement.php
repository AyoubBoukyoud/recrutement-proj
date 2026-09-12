<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'candidate_profile_id',
    'employer_profile_id',
    'recruiter_shortlist_id',
    'status',
    'placement_date',
    'employer_confirmed_at',
    'candidate_confirmed_at',
    'fee_amount',
    'fee_currency',
    'invoice_status',
    'created_by',
])]
class Placement extends Model
{
    protected function casts(): array
    {
        return [
            'placement_date' => 'date',
            'employer_confirmed_at' => 'datetime',
            'candidate_confirmed_at' => 'datetime',
        ];
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }

    public function employerProfile(): BelongsTo
    {
        return $this->belongsTo(EmployerProfile::class);
    }

    public function recruiterShortlist(): BelongsTo
    {
        return $this->belongsTo(RecruiterShortlist::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
