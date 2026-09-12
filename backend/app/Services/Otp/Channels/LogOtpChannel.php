<?php

namespace App\Services\Otp\Channels;

use App\Contracts\OtpChannel;
use Illuminate\Support\Facades\Log;

/**
 * The free default: writes the code to the log instead of paying a provider.
 * Keeps the whole sign-in flow testable on a fresh checkout with no accounts,
 * and is the only channel whose code the API will echo back to the client.
 */
class LogOtpChannel implements OtpChannel
{
    /** @param  array<string, mixed>  $config */
    public function __construct(private readonly array $config = []) {}

    public function name(): string
    {
        return 'log';
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function send(string $phone, string $code, int $ttlMinutes): void
    {
        // The raw code only ever hits the log in local/testing. This channel
        // should never be reachable in production (see config/otp.php), but a
        // deploy that forgets to override OTP_CHANNELS must not write every
        // real candidate's code to storage/logs/laravel.log as a result.
        $message = app()->environment('local', 'testing')
            ? "OTP for {$phone}: {$code} (expires in {$ttlMinutes}min)"
            : "OTP for {$phone}: [redacted] (expires in {$ttlMinutes}min)";

        Log::channel($this->config['log_channel'] ?? null)->info($message);
    }
}
