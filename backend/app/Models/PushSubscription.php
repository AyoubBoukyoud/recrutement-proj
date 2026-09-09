<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'endpoint', 'endpoint_hash', 'p256dh', 'auth'])]
class PushSubscription extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** MySQL can't put a unique index on a bare `text` column — a device's endpoint URL has no fixed length ceiling. */
    public static function hash(string $endpoint): string
    {
        return hash('sha256', $endpoint);
    }
}
