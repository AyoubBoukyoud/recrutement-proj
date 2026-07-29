<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Local/free MVP OTP delivery: generates a code, stores it on the user,
 * and writes it to the log instead of calling a paid SMS/WhatsApp provider.
 * Swap this class for a real Twilio/WhatsApp Business API sender later.
 */
class OtpService
{
    private const TTL_MINUTES = 10;

    public function generateAndSend(User $user): string
    {
        $code = (string) random_int(100000, 999999);

        $user->forceFill([
            'otp_code' => $code,
            'otp_expires_at' => Carbon::now()->addMinutes(self::TTL_MINUTES),
        ])->save();

        Log::info("OTP for {$user->phone}: {$code} (expires in ".self::TTL_MINUTES.'min)');

        return $code;
    }

    public function verify(User $user, string $code): bool
    {
        if (! $user->otp_code || ! $user->otp_expires_at) {
            return false;
        }

        if (Carbon::now()->greaterThan($user->otp_expires_at)) {
            return false;
        }

        if (! hash_equals($user->otp_code, $code)) {
            return false;
        }

        $user->forceFill([
            'otp_code' => null,
            'otp_expires_at' => null,
            'phone_verified_at' => Carbon::now(),
        ])->save();

        return true;
    }
}
