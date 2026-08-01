<?php

namespace App\Contracts;

use App\Services\Otp\Exceptions\OtpDeliveryException;

/**
 * One way of getting a code onto a candidate's phone.
 *
 * Implementations are deliberately dumb: they are handed an already-generated
 * code and know nothing about expiry, throttling or storage — that all lives
 * in OtpService. Adding a provider means writing one of these and naming it in
 * config/otp.php; no existing code changes.
 */
interface OtpChannel
{
    /** Key this channel is referred to by in config and in logs. */
    public function name(): string;

    /**
     * Whether the credentials this channel needs are actually present.
     *
     * The dispatcher skips unconfigured channels instead of counting them as
     * failures, so a half-filled .env degrades to the next channel in the
     * chain rather than costing every candidate a failed send first.
     */
    public function isConfigured(): bool;

    /**
     * @param  string  $phone  E.164, normalised by PhoneNumber::normalize()
     *
     * @throws OtpDeliveryException when the provider rejected or did not answer
     */
    public function send(string $phone, string $code, int $ttlMinutes): void;
}
