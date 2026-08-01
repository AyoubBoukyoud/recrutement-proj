<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One preparation activity in the catalogue. Assigning it to a candidate
 * creates a TaskAssignment; this row is the activity itself.
 */
#[Fillable(['title', 'description', 'category', 'estimated_minutes', 'is_active', 'created_by_id'])]
class Task extends Model
{
    public const CATEGORIES = ['language', 'documents', 'culture', 'admin', 'other'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }
}
