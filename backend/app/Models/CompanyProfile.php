<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A recruiter's ("Company" role) own profile — mirrors CandidateProfile. */
#[Fillable([
    'company_name',
    'sector',
    'description',
    'city',
    'address',
    'country',
    'phone',
    'website',
    'employees_count',
    'founded_year',
    'company_type',
    'logo_path',
    'social_links',
    'verified_at',
    'verified_by_id',
])]
class CompanyProfile extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
            'social_links' => 'array',
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

    public function teamMembers(): HasMany
    {
        return $this->hasMany(CompanyTeamMember::class);
    }
}
