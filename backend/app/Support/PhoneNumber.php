<?php

namespace App\Support;

/**
 * Phone numbers arrive from a keyboard, so the same candidate will type
 * "+212 600-000-000", "00212600000000" and "+212600000000" across three
 * sign-ins. They must all resolve to one account, one OTP record and one
 * rate-limit bucket, so every entry point normalises before doing anything.
 */
class PhoneNumber
{
    /** E.164: a leading +, a non-zero country digit, then 7-14 more. */
    public const E164_RULE = 'regex:/^\+[1-9]\d{7,14}$/';

    /**
     * Best-effort E.164. Anything we cannot confidently interpret is returned
     * with only its separators stripped, and validation rejects it downstream —
     * silently rewriting an unrecognised number would send the code elsewhere.
     */
    public static function normalize(string $phone): string
    {
        $trimmed = preg_replace('/[\s\-().]/', '', trim($phone)) ?? '';

        // International prefix dialled the long way round.
        if (str_starts_with($trimmed, '00')) {
            $trimmed = '+'.substr($trimmed, 2);
        }

        return $trimmed;
    }

    /** Digits only, no leading +, which is the form WhatsApp's API wants. */
    public static function digits(string $phone): string
    {
        return preg_replace('/\D/', '', $phone) ?? '';
    }
}
