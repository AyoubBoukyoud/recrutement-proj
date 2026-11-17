<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['center_id', 'teacher_id', 'module_id', 'group_id', 'room_id', 'date', 'start_time', 'end_time', 'version', 'request_key', 'created_by'])]
class TrainingSession extends Model
{
    protected function casts(): array
    {
        return ['version' => 'integer'];
    }

    public function toArray(): array
    {
        $data = parent::toArray();
        $data['start_time'] = substr($this->start_time, 0, 5);
        $data['end_time'] = substr($this->end_time, 0, 5);

        return $data;
    }
}
