<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing
|--------------------------------------------------------------------------
|
| The framework default answers `Access-Control-Allow-Origin: *` on every
| `/api/*` route, so any website could drive the public endpoints — the OTP
| request above all — from its visitors' browsers. Production serves the app
| and the API from one origin (Caddy), which needs no CORS at all, and the
| mobile app is not a browser; so only the origins named here are allowed.
|
| CORS_ALLOWED_ORIGINS: comma-separated extra origins. FRONTEND_URL is always
| included. Local development also accepts any localhost port, since the
| Next.js dev server and Expo web run on ports of their own.
|
*/

$origins = array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))));

if (filled(env('FRONTEND_URL'))) {
    $origins[] = rtrim((string) env('FRONTEND_URL'), '/');
}

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique($origins)),

    'allowed_origins_patterns' => env('APP_ENV') === 'local'
        ? ['#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#']
        : [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Authentication is a bearer token in a header, never a cookie.
    'supports_credentials' => false,

];
