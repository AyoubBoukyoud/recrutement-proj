<?php

use App\Support\PhoneNumber;

$defaultCountryCode = (string) env('ADMIN_PHONE_COUNTRY', '+212');

return [

    /*
    |--------------------------------------------------------------------------
    | Administrator allowlist
    |--------------------------------------------------------------------------
    |
    | Phone numbers that always hold the Administrator role. Sign-in is by OTP
    | and there are no passwords anywhere, so this list is what makes a fresh
    | deployment reachable: the number is granted the role on its first OTP
    | request, and from there the console at /admin can promote everybody else.
    |
    | Comma-separated, and read the way a Moroccan number is written down —
    | ADMIN_PHONES="0632594914" and ADMIN_PHONES="+212632594914" are the same
    | list. Set ADMIN_PHONE_COUNTRY to change what a national number defaults
    | to.
    |
    | The number is not a secret and does not need to be one: it identifies the
    | account, the OTP sent to that handset is what proves possession of it.
    | Removing an entry does NOT revoke the role — the allowlist only ever adds.
    | Take the role away in the console, or the number keeps it on next login.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Impersonation
    |--------------------------------------------------------------------------
    |
    | How long a "sign in as this user" token stays valid. Short on purpose:
    | it is meant to last a support call, not a working day, and it is the only
    | thing standing between a closed browser tab and a live session on
    | somebody else's account.
    |
    */

    'impersonation_minutes' => (int) env('ADMIN_IMPERSONATION_MINUTES', 60),

    'phones' => array_values(array_unique(array_filter(array_map(
        fn (string $entry) => PhoneNumber::toE164($entry, $defaultCountryCode),
        preg_split('/[,\s]+/', (string) env('ADMIN_PHONES', '')) ?: []
    )))),

];
