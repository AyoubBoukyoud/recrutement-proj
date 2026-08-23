<?php

namespace App\Models;

use App\Services\FileAccess;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Appends(['video_url'])]
#[Fillable([
    'first_name',
    'last_name',
    'profession',
    'specialization',
    'years_of_experience',
    'city',
    'date_of_birth',
    'availability_status',
    'matching_preferences',
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
    use HasFactory;

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'matching_preferences' => 'array',
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

    /** Employer success-fee events — see Placement's own docblock for why this isn't just a shortlist stage. */
    public function placements(): HasMany
    {
        return $this->hasMany(Placement::class);
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

    /**
     * A short-lived signed URL for the presentation video — never a bare
     * public path. Same dossier-visibility rule as documents (owner,
     * admin, or a recruiter this profile is discoverable to).
     */
    protected function videoUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => FileAccess::dossierUrl($this->presentation_video_path, $this, auth()->user())
        );
    }
}
