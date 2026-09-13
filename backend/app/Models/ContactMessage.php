<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** A "contact us" submission from the public site. No account behind it. */
#[Fillable(['name', 'email', 'message', 'status'])]
class ContactMessage extends Model
{
    const STATUSES = ['new', 'read', 'archived'];
}
