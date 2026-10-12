<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** A quote request from the public company page. No account behind it. */
#[Fillable(['name', 'email', 'service', 'message', 'status'])]
class QuoteRequest extends Model
{
    const STATUSES = ['new', 'contacted', 'closed'];

    /** The services offered on `/notre-entreprise`, as the form submits them. */
    const SERVICES = ['mobile-apps', 'engineering', 'games', 'training'];
}
