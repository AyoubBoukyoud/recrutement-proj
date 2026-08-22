<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'first_name',
    'last_name',
    'profession',
    'specialization',
    'years_of_experience',
    'city',
    'date_of_birth',
    'availability_status',
    'terms_consent_at',
    'cndp_consent_at',
    'presentation_video_path',
    'submitted_at',
    'verified_at',
    'verified_by_id',
    'admin_notes',
])]
class CandidateProfile extends Model
{
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'terms_consent_at' => 'datetime',
            'cndp_consent_at' => 'datetime',
            'submitted_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function educations(): HasMany
    {
        return $this->hasMany(Education::class);
    }

    public function languages(): HasMany
    {
        return $this->hasMany(CandidateLanguage::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(CandidateSkill::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function languageAssessments(): HasMany
    {
        return $this->hasMany(LanguageAssessment::class);
    }

    /** Every recruiter who has saved this candidate; scoped per recruiter in queries. */
    public function shortlistEntries(): HasMany
    {
        return $this->hasMany(RecruiterShortlist::class);
    }

    public function taskAssignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class);
    }

    /** The administrator who vouched for this dossier, if one has. */
    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_id');
    }

    public function referralRegistration(): HasOne
    {
        return $this->hasOne(ReferralRegistration::class);
    }
}
