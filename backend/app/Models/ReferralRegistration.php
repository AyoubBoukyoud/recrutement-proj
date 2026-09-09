<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'referral_agent_id',
    'candidate_profile_id',
    'registered_at',
    'commission_status',
    'commission_amount',
    'commission_currency',
    'qualified_at',
    'approved_at',
    'paid_at',
    'payout_reference',
    'payout_note',
])]
class ReferralRegistration extends Model
{
    /** Statuses an administrator can move a registration to by hand. */
    public const RESOLVABLE_STATUSES = ['approved', 'paid', 'rejected'];

    /** Earned, but not yet in the agent's hands. */
    public const OWED_STATUSES = ['qualified', 'approved'];

    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
            'qualified_at' => 'datetime',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
            'commission_amount' => 'decimal:2',
        ];
    }

    public function referralAgent(): BelongsTo
    {
        return $this->belongsTo(ReferralAgent::class);
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class);
    }
}
