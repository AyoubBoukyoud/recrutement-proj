<?php

namespace App\Models;

use App\Services\FileAccess;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['type', 'file_path', 'ocr_status', 'approval_status', 'reviewed_by_id', 'reviewed_at', 'rejection_reason'])]
class Document extends Model
{
    /** Clients need to *open* a certificate, not just know its storage key. */
    protected $appends = ['url'];

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    /** The administrator who accepted or rejected it. */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_id');
    }

    public function extraction(): HasOne
    {
        return $this->hasOne(DocumentExtraction::class);
    }

    /**
     * A short-lived signed URL, generated fresh for whoever is asking — never
     * a bare public path. Returns null (not the path) for a viewer who is not
     * authorized to see this dossier at all, same as if the file did not exist.
     */
    protected function url(): Attribute
    {
        return Attribute::get(
            fn (): ?string => FileAccess::dossierUrl($this->file_path, $this->candidateProfile, auth()->user())
        );
    }
}
