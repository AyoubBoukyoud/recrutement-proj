<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A training/recruitment center a commercial or administrator has been in
 * touch with. Shared across every commercial — the point of logging a call
 * here is so a colleague sees it before dialing the same number again.
 */
#[Fillable([
    'name', 'category', 'phone', 'email', 'address', 'city', 'contact_person',
    'call_status', 'offer_status', 'created_by',
])]
class RecruitmentCenter extends Model
{
    const CATEGORIES = ['training_center', 'business_germany'];
    const CALL_STATUSES = ['not_called', 'no_answer', 'called', 'call_back'];
    const OFFER_STATUSES = ['pending', 'negotiating', 'accepted', 'refused'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(RecruitmentCenterNote::class)->latest('created_at');
    }
}
