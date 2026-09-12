<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable([
    'user_id',
    'qr_code_token',
    'commission_rate',
    'previous_qr_code_token',
    'previous_token_expires_at',
])]
class ReferralAgent extends Model
{
    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'previous_token_expires_at' => 'datetime',
        ];
    }

    /**
     * Resolve a scanned token to its agent.
     *
     * Accepts the token an agent is currently handing out *and* the one it
     * replaced, until that one expires. Rotation used to kill every printed QR
     * code in circulation the moment the button was pressed, and a poster on a
     * clinic wall cannot be recalled that fast.
     */
    public static function findByToken(string $token): ?self
    {
        return static::query()
            ->where('qr_code_token', $token)
            ->orWhere(fn ($query) => $query
                ->where('previous_qr_code_token', $token)
                ->where('previous_token_expires_at', '>', Carbon::now()))
            ->first();
    }

    /** What this agent earns per qualifying referral. */
    public function commissionAmount(): float
    {
        return (float) ($this->commission_rate ?? config('referrals.commission.default_amount'));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(ReferralRegistration::class);
    }
}
