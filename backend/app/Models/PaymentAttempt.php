<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['subscription_id', 'amount', 'currency', 'status', 'provider_reference', 'attempted_at', 'succeeded_at', 'failure_reason'])]
class PaymentAttempt extends Model
{
    protected function casts(): array
    {
        return [
            'attempted_at' => 'datetime',
            'succeeded_at' => 'datetime',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
