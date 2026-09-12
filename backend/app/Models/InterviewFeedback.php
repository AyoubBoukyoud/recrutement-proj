<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['interview_id', 'author_id', 'overall', 'technical', 'communication', 'motivation', 'culture_fit', 'recommendation', 'notes'])]
class InterviewFeedback extends Model
{
    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
