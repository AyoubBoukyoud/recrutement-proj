<?php

namespace App\Support;

/**
 * The Administrator allowlist from config/admin.php, in the one form the rest
 * of the app stores phone numbers in: E.164.
 *
 * Comparison happens on normalised strings on both sides, so a number written
 * "06 32 59 49 14" in .env still matches the "+212632594914" the users table
 * holds — the two would otherwise never meet and the allowlist would look
 * silently broken.
 */
final class AdminPhones
{
    /** @return array<int, string> */
    public static function all(): array
    {
        /** @var array<int, string> $phones */
        $phones = config('admin.phones', []);

        return $phones;
    }

    public static function contains(string $phone): bool
    {
        return in_array(PhoneNumber::normalize($phone), self::all(), true);
    }
}
