<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['level', 'field', 'institution', 'started_at', 'ended_at'])]
class Education extends Model
{
    // Laravel's pluralizer treats "Education" as uncountable and guesses
    // the table name "education", not "educations" — override explicitly.
    protected $table = 'educations';

    protected function casts(): array
    {
        return [
            'started_at' => 'date',
            'ended_at' => 'date',
        ];
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }
}
