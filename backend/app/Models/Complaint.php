<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

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

    /** Clients need to play a voice note, not to know its storage key. */
    protected function audioUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->audio_path
            ? Storage::disk('public')->url($this->audio_path)
            : null);
    }

    /** Drives the badge on the candidate's "Report a problem" strip. */
    protected function hasUnreadResponse(): Attribute
    {
        return Attribute::get(fn (): bool => $this->responded_at !== null && $this->response_seen_at === null);
    }
}
