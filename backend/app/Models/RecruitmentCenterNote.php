<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One dated comment on a RecruitmentCenter. Append-only, see the migration. */
#[Fillable(['recruitment_center_id', 'author_id', 'body'])]
class RecruitmentCenterNote extends Model
{
    const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function center(): BelongsTo
    {
        return $this->belongsTo(RecruitmentCenter::class, 'recruitment_center_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
