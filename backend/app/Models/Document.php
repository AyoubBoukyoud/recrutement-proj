<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

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

    protected function url(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->file_path
            ? Storage::disk('public')->url($this->file_path)
            : null);
    }
}
