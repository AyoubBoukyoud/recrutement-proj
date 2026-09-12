<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Commission
    |--------------------------------------------------------------------------
    |
    | What an agent earns for a referral, in `currency`, stamped onto the
    | registration at the moment it qualifies. Stamped rather than looked up
    | later: an agent's rate can change, and a commission already earned must
    | not move because of it. A per-agent rate overrides this default.
    |
    */

    'commission' => [
        'default_amount' => (float) env('REFERRAL_COMMISSION_AMOUNT', 150),
        'currency' => env('REFERRAL_CURRENCY', 'MAD'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Token rotation
    |--------------------------------------------------------------------------
    |
    | Rotating a token used to invalidate every printed QR code in the field
    | the instant an agent pressed the button. The previous token keeps
    | attributing registrations for this long afterwards, so posters and
    | flyers already handed out are not silently dead.
    |
    | Set to 0 to make rotation immediate again.
    |
    */

    'previous_token_grace_days' => (int) env('REFERRAL_TOKEN_GRACE_DAYS', 30),

];
