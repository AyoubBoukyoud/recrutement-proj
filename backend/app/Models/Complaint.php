<?php

namespace App\Models;

use App\Services\FileAccess;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'type',
    'body',
    'audio_path',
    'status',
    'admin_response',
    'responded_at',
    'responded_by_id',
    'response_seen_at',
    'admin_notified_at',
])]
#[Appends(['audio_url', 'has_unread_response'])]
class Complaint extends Model
{
    protected function casts(): array
    {
        return [
            'admin_notified_at' => 'datetime',
            'responded_at' => 'datetime',
            'response_seen_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Whoever answered it — null while nobody has. */
    public function respondedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by_id');
    }

    /**
     * A short-lived signed URL — never a bare public path. Only the
     * candidate who filed this complaint or an administrator ever gets a
     * non-null value; a recruiter never does, complaints are not dossier
     * evidence.
     */
    protected function audioUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => FileAccess::complaintUrl($this->audio_path, $this->user_id, auth()->user())
        );
    }

    /** Drives the badge on the candidate's "Report a problem" strip. */
    protected function hasUnreadResponse(): Attribute
    {
        return Attribute::get(fn (): bool => $this->responded_at !== null && $this->response_seen_at === null);
    }
}
