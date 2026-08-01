<?php

namespace App\Models;

use App\Services\LanguageAssessment\LanguageLevelReconciler;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * `cefr_level` is the effective level — what a recruiter sees. The two columns
 * beside it keep the evidence separable: what the candidate said about
 * themselves, and what the assessment predicted. `source` names which one won;
 * the rule lives in LanguageLevelReconciler.
 */
#[Fillable([
    'language',
    'cefr_level',
    'self_declared_cefr',
    'ai_cefr',
    'ai_assessed_at',
    'source',
    'certificate_document_id',
])]
#[Appends(['level_discrepancy'])]
class CandidateLanguage extends Model
{
    protected function casts(): array
    {
        return [
            'ai_assessed_at' => 'datetime',
        ];
    }

    /**
     * True when the candidate's own claim and the assessment sit two bands or
     * more apart. Surfaced rather than resolved: which to believe is a
     * recruiter's call, and hiding the disagreement would be the same mistake
     * as overwriting the level outright.
     */
    protected function levelDiscrepancy(): Attribute
    {
        return Attribute::get(fn () => LanguageLevelReconciler::isDiscrepant(
            $this->self_declared_cefr,
            $this->ai_cefr,
        ));
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }

    public function certificateDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'certificate_document_id');
    }
}
