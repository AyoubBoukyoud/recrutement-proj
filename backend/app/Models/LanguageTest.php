<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One sitting of the AMUD level exam. `exam_level` is the level being
 * checked (normally the certificate's); the outcome says whether the
 * candidate holds it, and `final_cefr` is the published result (possibly corrected).
 */
#[Fillable([
    'language',
    'exam_level',
    'level_source',
    'blueprint',
    'status',
    'current_section',
    'sections',
    'skill_scores',
    'skill_results',
    'outcome',
    'provisional_cefr',
    'ai_cefr',
    'final_cefr',
    'summary',
    'integrity',
    'needs_attention',
    'reviewed_by_id',
    'reviewed_at',
    'review_note',
    'consented_at',
    'started_at',
    'completed_at',
    'published_at',
])]
class LanguageTest extends Model
{
    protected function casts(): array
    {
        return [
            'blueprint' => 'array',
            'sections' => 'array',
            'skill_scores' => 'array',
            'skill_results' => 'array',
            'summary' => 'array',
            'integrity' => 'array',
            'needs_attention' => 'boolean',
            'reviewed_at' => 'datetime',
            'consented_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function phaseOneComplete(): bool
    {
        return ($this->summary['phase_one_completed'] ?? false) || $this->provisional_cefr !== null;
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(LanguageTestResponse::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_id');
    }
}
