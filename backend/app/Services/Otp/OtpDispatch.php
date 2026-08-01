<?php

namespace App\Services\Otp;

use Carbon\CarbonInterface;

/**
 * What the caller needs to know about a code that was just sent — everything
 * except the code itself, which is only present when the log channel delivered
 * it and config allows echoing it back.
 */
final readonly class OtpDispatch
{
    public function __construct(
        public string $channel,
        public CarbonInterface $expiresAt,
        public int $resendAvailableIn,
        public ?string $debugCode = null,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'channel' => $this->channel,
            'expires_in' => max(0, (int) round(now()->diffInSeconds($this->expiresAt, false))),
            'resend_available_in' => $this->resendAvailableIn,
            // Kept under its original key so the mobile and admin clients that
            // already read it keep working.
            'debug_otp_code' => $this->debugCode,
        ];
    }
}
