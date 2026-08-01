<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
