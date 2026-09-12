<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only: rows are never updated, so there is no updated_at to track.
 * `subject_type`/`subject_id` are a hand-rolled polymorphic pointer rather
 * than a package — the only consumer is the admin surface, and it only ever
 * needs "every event for one subject", never a reverse/global feed.
 */
#[Fillable(['actor_id', 'subject_type', 'subject_id', 'action', 'meta'])]
class AdminActivityLog extends Model
{
    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Record one event. The single place every admin mutation on a candidate
     * or recruiter funnels through, so "Historique" never drifts from what
     * actually happened.
     *
     * @param  array<string, mixed>  $meta
     */
    public static function record(User $actor, Model $subject, string $action, array $meta = []): self
    {
        return self::create([
            'actor_id' => $actor->id,
            'subject_type' => $subject::class,
            'subject_id' => $subject->getKey(),
            'action' => $action,
            'meta' => $meta,
        ]);
    }

    /** Every logged event for one subject, most recent first. */
    public static function forSubject(Model $subject)
    {
        return self::with('actor:id,name,phone')
            ->where('subject_type', $subject::class)
            ->where('subject_id', $subject->getKey())
            ->latest('created_at')
            ->get();
    }
}
