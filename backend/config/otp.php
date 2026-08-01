<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Delivery chain
    |--------------------------------------------------------------------------
    |
    | Connections are tried in this order and the first one that is configured
    | and succeeds wins — that is the WhatsApp-with-SMS-fallback the spec asks
    | for. The default is `log` alone so a fresh checkout keeps working with no
    | provider account: the code goes to storage/logs/laravel.log and, in local,
    | back in the API response.
    |
    | Production: OTP_CHANNELS=whatsapp,sms
    |
    */

    'channels' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('OTP_CHANNELS', 'log'))
    ))),

    'code_length' => 6,

    'ttl_minutes' => (int) env('OTP_TTL_MINUTES', 10),

    /*
    |--------------------------------------------------------------------------
    | Abuse limits
    |--------------------------------------------------------------------------
    |
    | Per phone number, enforced in OtpService against the otp_codes row. The
    | throttle:otp-request / throttle:otp-verify limiters in AppServiceProvider
    | sit in front of these and additionally bound things per IP.
    |
    | max_verify_attempts is the one that matters most: without it a 6-digit
    | code is guessable in a few hundred thousand requests.
    |
    */

    'throttle' => [
        'resend_cooldown_seconds' => (int) env('OTP_RESEND_COOLDOWN', 60),
        'max_sends_per_window' => (int) env('OTP_MAX_SENDS', 5),
        'send_window_minutes' => (int) env('OTP_SEND_WINDOW_MINUTES', 60),
        'max_verify_attempts' => (int) env('OTP_MAX_ATTEMPTS', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Echoing the code back to the client
    |--------------------------------------------------------------------------
    |
    | Only ever honoured when the code was delivered by the `log` channel, so
    | turning this on in an environment with a real provider wired up still
    | leaks nothing.
    |
    */

    'expose_code_in_response' => (bool) env('OTP_EXPOSE_CODE', env('APP_ENV') === 'local'),

    /*
    |--------------------------------------------------------------------------
    | Connections
    |--------------------------------------------------------------------------
    |
    | `driver` picks the OtpChannel implementation; the rest is handed to it.
    | A connection whose credentials are missing is skipped by the dispatcher.
    |
    */

    'connections' => [

        'log' => [
            'driver' => 'log',
            'log_channel' => env('OTP_LOG_CHANNEL'),
        ],

        // Meta WhatsApp Business Cloud API. `template` must be an approved
        // template of category AUTHENTICATION — Meta rejects free-form text to
        // a user who has not messaged you in the last 24 hours, which is every
        // sign-in. Authentication templates carry a one-tap copy-code button
        // whose parameter repeats the code; set copy_code_button=false if the
        // approved template has no button.
        'whatsapp' => [
            'driver' => 'whatsapp',
            'token' => env('WHATSAPP_TOKEN'),
            'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
            'template' => env('WHATSAPP_OTP_TEMPLATE', 'otp_code'),
            'template_language' => env('WHATSAPP_OTP_TEMPLATE_LANGUAGE', 'en'),
            'copy_code_button' => (bool) env('WHATSAPP_OTP_COPY_CODE_BUTTON', true),
            'api_version' => env('WHATSAPP_API_VERSION', 'v21.0'),
            'base_url' => env('WHATSAPP_BASE_URL', 'https://graph.facebook.com'),
            'timeout' => (int) env('WHATSAPP_TIMEOUT', 10),
        ],

        // Twilio Programmable SMS. Prefer a Messaging Service SID over a bare
        // `from` number: Morocco requires a registered alphanumeric sender, and
        // the service handles that selection per destination country.
        'sms' => [
            'driver' => 'twilio',
            'account_sid' => env('TWILIO_ACCOUNT_SID'),
            'auth_token' => env('TWILIO_AUTH_TOKEN'),
            'from' => env('TWILIO_FROM'),
            'messaging_service_sid' => env('TWILIO_MESSAGING_SERVICE_SID'),
            'base_url' => env('TWILIO_BASE_URL', 'https://api.twilio.com'),
            'timeout' => (int) env('TWILIO_TIMEOUT', 10),
            // :code and :minutes are substituted.
            'message' => env('TWILIO_OTP_MESSAGE', 'Your verification code is :code. It expires in :minutes minutes.'),
        ],

    ],

];
