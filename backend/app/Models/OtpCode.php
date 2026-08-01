<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One live code per phone number per purpose.
 *
 * This lives beside `users` rather than on it because a code is not always
 * about a number the account already owns: the phone-change flow sends one to
 * a number nobody holds yet. Keying on the phone also means the throttling
 * counters survive a user row that does not exist yet.
 *
 * @property string $phone
 * @property string $purpose
 * @property string $code_hash
 */
class OtpCode extends Model
{
    public const PURPOSE_LOGIN = 'login';

    public const PURPOSE_PHONE_CHANGE = 'phone_change';

    protected $fillable = [
        'phone', 'purpose', 'user_id', 'code_hash', 'channel',
        'expires_at', 'attempts', 'consumed_at', 'last_sent_at',
        'sends', 'window_started_at',
    ];

    protected $hidden = ['code_hash'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
            'last_sent_at' => 'datetime',
            'window_started_at' => 'datetime',
            'attempts' => 'integer',
            'sends' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
