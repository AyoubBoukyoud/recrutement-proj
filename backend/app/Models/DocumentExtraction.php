<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['extracted_fields', 'confidence', 'reviewed_at'])]
class DocumentExtraction extends Model
{
    protected function casts(): array
    {
        return [
            'extracted_fields' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
