<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A recruiter's ("Company" role) own profile — mirrors CandidateProfile. */
#[Fillable([
    'company_name',
    'sector',
    'city',
    'phone',
    'website',
    'employees_count',
    'verified_at',
    'verified_by_id',
])]
class CompanyProfile extends Model
{
    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** The administrator who vouched for this company, if one has. */
    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_id');
    }
}
