<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// A safety net, not the main path: uploads are scanned by the queue worker.
// This catches documents left behind when no worker was running, which is
// otherwise invisible — the candidate just sees "Queued for scanning…" forever.
Schedule::command('documents:scan-pending')->everyTenMinutes()->withoutOverlapping();

// Expired sign-in sessions (config/sanctum.php) are already refused; this only
// stops them piling up in personal_access_tokens.
Schedule::command('sanctum:prune-expired --hours=24')->daily();

// CNDP erasure requests become final after their 30-day cancellation window.
Schedule::command('candidates:purge-deleted')->daily()->withoutOverlapping();
