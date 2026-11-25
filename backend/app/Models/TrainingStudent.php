<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['center_id', 'first_name', 'last_name', 'phone', 'email', 'city', 'level', 'status', 'notes', 'registered_on', 'deactivated_on'])]
class TrainingStudent extends Model
{
    public const STATUSES = ['active', 'inactive'];

    public const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    protected function casts(): array
    {
        return ['registered_on' => 'date:Y-m-d', 'deactivated_on' => 'date:Y-m-d'];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(TrainingMembership::class, 'student_id')->orderBy('joined_on')->orderBy('id');
    }

    public function periods(): HasMany
    {
        return $this->hasMany(TrainingStudentPeriod::class, 'student_id')->orderBy('started_on');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(TrainingPayment::class, 'student_id');
    }

    /** API shape. `group_ids` keeps its meaning: the groups the student is in today. */
    public function toApi(): array
    {
        $memberships = $this->memberships;

        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'city' => $this->city,
            'level' => $this->level,
            'status' => $this->status,
            'notes' => $this->notes,
            'registered_on' => $this->registered_on?->format('Y-m-d'),
            'deactivated_on' => $this->deactivated_on?->format('Y-m-d'),
            'group_ids' => $memberships->whereNull('ended_on')->pluck('group_id')->unique()->sort()->values()->all(),
            'memberships' => $memberships->map->toApi()->values()->all(),
            'periods' => $this->periods->map->toApi()->values()->all(),
        ];
    }
}
