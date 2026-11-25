<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** A period in a group; ended_on is the last day (inclusive), null while current. */
#[Fillable(['center_id', 'group_id', 'student_id', 'module_id', 'joined_on', 'ended_on'])]
class TrainingMembership extends Model
{
    protected $table = 'training_group_students';

    protected function casts(): array
    {
        return ['joined_on' => 'date:Y-m-d', 'ended_on' => 'date:Y-m-d', 'group_id' => 'integer', 'module_id' => 'integer', 'student_id' => 'integer'];
    }

    public function toApi(): array
    {
        return ['id' => $this->id, 'group_id' => $this->group_id, 'module_id' => $this->module_id, 'joined_on' => $this->joined_on->format('Y-m-d'), 'ended_on' => $this->ended_on?->format('Y-m-d')];
    }
}
