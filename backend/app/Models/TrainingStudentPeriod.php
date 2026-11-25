<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** An activity period; ended_on is the last active day (inclusive), null while active. */
#[Fillable(['center_id', 'student_id', 'started_on', 'ended_on'])]
class TrainingStudentPeriod extends Model
{
    protected function casts(): array
    {
        return ['started_on' => 'date:Y-m-d', 'ended_on' => 'date:Y-m-d', 'student_id' => 'integer'];
    }

    public function toApi(): array
    {
        return ['started_on' => $this->started_on->format('Y-m-d'), 'ended_on' => $this->ended_on?->format('Y-m-d')];
    }
}
