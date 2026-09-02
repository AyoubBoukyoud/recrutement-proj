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

    /**
     * E.164 from a number that may have been written nationally.
     *
     * Deliberately separate from normalize(): that one must never guess a
     * country for a number a stranger typed into the sign-in form, because
     * guessing wrong sends the code to somebody else. Here the number comes
     * from our own .env, where a Moroccan number is written down the way it is
     * printed on a business card — "0632594914" — so the country is known and
     * assuming it is the point. Mirrors the frontend's toInternationalPhone().
     */
    public static function toE164(string $phone, string $defaultCountryCode = '+212'): string
    {
        $normalized = self::normalize($phone);

        if (str_starts_with($normalized, '+')) {
            return '+'.self::digits($normalized);
        }

        $digits = self::digits($normalized);

        if ($digits === '') {
            return '';
        }

        // Already carries the country code, just without the plus.
        $countryDigits = self::digits($defaultCountryCode);
        if ($countryDigits !== '' && str_starts_with($digits, $countryDigits)) {
            return '+'.$digits;
        }

        // The national trunk prefix is not part of the international form.
        return $defaultCountryCode.ltrim($digits, '0');
    }

    /** Digits only, no leading +, which is the form WhatsApp's API wants. */
    public static function digits(string $phone): string
    {
        return preg_replace('/\D/', '', $phone) ?? '';
    }
}
