<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * One exam task in the bank: a reading text with its questions, a listening
 * clip, a read-aloud text, a writing or an oral task — always for one level.
 *
 * `answer_key` and `audio_path` are hidden from every serialisation. A
 * candidate gets the item through candidatePayload(), which also drops the
 * listening transcript; admins get them through adminPayload().
 */
#[Fillable([
    'language',
    'cefr_level',
    'skill',
    'task_type',
    'sector',
    'title',
    'content',
    'answer_key',
    'audio_path',
    'status',
    'generated_by',
    'reviewed_by_id',
    'reviewed_at',
    'review_note',
])]
#[Hidden(['answer_key', 'audio_path'])]
class LanguageTestItem extends Model
{
    protected function casts(): array
    {
        return [
            'content' => 'array',
            'answer_key' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_id');
    }

    /** @param  Builder<LanguageTestItem>  $query */
    public function scopeApproved(Builder $query): void
    {
        $query->where('status', 'approved');
    }

    /** Listening items must carry their audio before anyone can be examined on them. */
    public function needsAudio(): bool
    {
        return $this->skill === 'listening';
    }

    public function hasAudio(): bool
    {
        return filled($this->audio_path);
    }

    /**
     * Everything an administrator needs to review the item, including what a
     * candidate must never see.
     *
     * @return array<string, mixed>
     */
    public function adminPayload(): array
    {
        return [
            ...$this->toArray(),
            'answer_key' => $this->answer_key,
            'has_audio' => $this->hasAudio(),
            'audio_url' => $this->hasAudio()
                ? Storage::disk('local')->temporaryUrl($this->audio_path, now()->addMinutes(10))
                : null,
            'reviewer' => $this->reviewer?->only(['id', 'name']),
        ];
    }

    /**
     * What a candidate sitting the exam may see: the task, never its key, and
     * for listening never the script (that would turn it into reading).
     *
     * @return array<string, mixed>
     */
    public function candidatePayload(): array
    {
        $content = $this->content ?? [];
        unset($content['script'], $content['explanations']);

        return [
            'id' => $this->id,
            'skill' => $this->skill,
            'task_type' => $this->task_type,
            'title' => $this->title,
            'content' => $content,
        ];
    }
}
