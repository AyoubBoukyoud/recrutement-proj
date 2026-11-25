<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** The candidate's answer to one exam item, and how it was scored. */
#[Fillable([
    'item_id',
    'section',
    'position',
    'plays',
    'revealed_at',
    'answer',
    'audio_path',
    'video_path',
    'is_correct',
    'score',
    'time_ms',
    'evaluation',
    'status',
    'grading_token',
    'grading_due_at',
])]
#[Hidden(['audio_path', 'video_path', 'grading_token', 'grading_due_at'])]
class LanguageTestResponse extends Model
{
    protected function casts(): array
    {
        return [
            'answer' => 'array',
            'evaluation' => 'array',
            'is_correct' => 'boolean',
            'revealed_at' => 'datetime',
            'grading_due_at' => 'datetime',
        ];
    }

    public function languageTest(): BelongsTo
    {
        return $this->belongsTo(LanguageTest::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(LanguageTestItem::class, 'item_id');
    }
}
