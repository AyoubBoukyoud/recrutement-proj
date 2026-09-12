<?php

namespace App\Models;

use App\Services\FileAccess;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Appends(['audio_url'])]
#[Fillable([
    'language',
    'audio_path',
    'transcript',
    'duration_seconds',
    'words_per_minute',
    'filler_word_ratio',
    'pronunciation_score',
    'predicted_cefr',
    'score_breakdown',
    'status',
    'failure_reason',
    'badge_awarded_at',
])]
class LanguageAssessment extends Model
{
    protected function casts(): array
    {
        return [
            'badge_awarded_at' => 'datetime',
            // Every component that produced the level, so the estimate can be
            // explained to the candidate instead of asserted at them.
            'score_breakdown' => 'array',
            'filler_word_ratio' => 'float',
            'duration_seconds' => 'float',
        ];
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }

    /**
     * A short-lived signed URL for the recording — never a bare public path.
     * Same dossier-visibility rule as documents; this is already part of the
     * evidence recruiters receive (RecruiterProfileView loads the relation).
     */
    protected function audioUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => FileAccess::dossierUrl($this->audio_path, $this->candidateProfile, auth()->user())
        );
    }
}
