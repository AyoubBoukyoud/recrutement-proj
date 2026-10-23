<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * The Google side of the Administrator allowlist (config/admin.php), the
 * counterpart of AdminPhones. Only ever asked about an address Google has
 * verified — see GoogleSignIn.
 */
final class AdminEmails
{
    /** @return array<int, string> */
    public static function all(): array
    {
        /** @var array<int, string> $emails */
        $emails = config('admin.emails', []);

        return $emails;
    }

    public static function contains(string $email): bool
    {
        return in_array(Str::lower(trim($email)), self::all(), true);
    }
}
