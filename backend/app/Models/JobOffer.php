<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'title',
    'description',
    'responsibilities',
    'requirements',
    'benefits',
    'sector',
    'city',
    'country',
    'workplace_type',
    'weekly_hours',
    'experience_level',
    'education_level',
    'required_cefr_level',
    'salary_min',
    'salary_max',
    'currency',
    'contract_type',
    'start_date',
    'application_deadline',
    'positions_count',
    'status',
    'published_at',
])]
class JobOffer extends Model
{
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'application_deadline' => 'date',
            'published_at' => 'datetime',
        ];
    }

    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }
}
