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
    'date_of_birth',
    'availability_status',
    'terms_consent_at',
    'cndp_consent_at',
    'presentation_video_path',
])]
class CandidateProfile extends Model
{
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'terms_consent_at' => 'datetime',
            'cndp_consent_at' => 'datetime',
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

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function languageAssessments(): HasMany
    {
        return $this->hasMany(LanguageAssessment::class);
    }

    public function referralRegistration(): HasOne
    {
        return $this->hasOne(ReferralRegistration::class);
    }
}
