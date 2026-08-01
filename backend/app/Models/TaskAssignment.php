<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One candidate's copy of one activity, for one day. */
#[Fillable([
    'candidate_profile_id',
    'task_id',
    'assigned_by_id',
    'assigned_for',
    'status',
    'completed_at',
    'minutes_spent',
    'candidate_note',
    'admin_feedback',
])]
#[Appends(['is_overdue'])]
class TaskAssignment extends Model
{
    public const STATUSES = ['assigned', 'completed', 'skipped'];

    protected function casts(): array
    {
        return [
            'assigned_for' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_id');
    }

    /** Still open, and its day has passed. Drives the app's "catch up" list. */
    protected function isOverdue(): Attribute
    {
        return Attribute::get(fn (): bool => $this->status === 'assigned'
            && $this->assigned_for !== null
            && $this->assigned_for->isBefore(today()));
    }
}
