<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A contact in the recruiter's own team roster — not a login, see the migration. */
#[Fillable(['company_profile_id', 'name', 'email', 'phone', 'position', 'role', 'status'])]
class CompanyTeamMember extends Model
{
    public function companyProfile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class);
    }
}
