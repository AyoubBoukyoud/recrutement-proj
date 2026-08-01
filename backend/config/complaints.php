<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Administrator alerts
    |--------------------------------------------------------------------------
    |
    | The spec asks for instant notification of administrators. Polling the
    | dashboard is not that — it only works while somebody has the tab open,
    | which is exactly when they did not need telling.
    |
    | Recipients are every user holding the Administrator role that has an
    | email address, plus the ops mailbox below. Accounts here are phone-first,
    | so an administrator with no email on file is normal, and the fallback is
    | what stops a deployment from having no recipients at all.
    |
    | MAIL_MAILER defaults to `log`, so a fresh checkout writes the alert to
    | storage/logs/laravel.log rather than appearing to send something.
    |
    */

    'alert_email' => env('COMPLAINT_ALERT_EMAIL'),

    /*
    |--------------------------------------------------------------------------
    | Slack incoming webhook
    |--------------------------------------------------------------------------
    |
    | Optional, and the one that actually reaches somebody within a minute.
    | A plain incoming-webhook POST rather than laravel/slack-notification-
    | channel: it is fifteen lines and avoids a dependency for one message.
    | Unset means skipped, the same way an unconfigured OTP channel is.
    |
    */

    'slack_webhook' => env('COMPLAINT_SLACK_WEBHOOK'),

    /*
    |--------------------------------------------------------------------------
    | Dashboard link
    |--------------------------------------------------------------------------
    |
    | Where an alert should send the administrator. The API and the admin SPA
    | are different origins, so this cannot be derived from APP_URL.
    |
    */

    'dashboard_url' => env('ADMIN_DASHBOARD_URL', env('APP_URL')),

];
