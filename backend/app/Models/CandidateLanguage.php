<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['language', 'cefr_level', 'source', 'certificate_document_id'])]
class CandidateLanguage extends Model
{
    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }

    public function certificateDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'certificate_document_id');
    }
}
