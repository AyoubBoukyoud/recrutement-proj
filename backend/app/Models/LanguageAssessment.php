<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'language',
    'audio_path',
    'transcript',
    'words_per_minute',
    'filler_word_ratio',
    'predicted_cefr',
    'status',
    'badge_awarded_at',
])]
class LanguageAssessment extends Model
{
    protected function casts(): array
    {
        return [
            'badge_awarded_at' => 'datetime',
        ];
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }
}
