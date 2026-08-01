<?php

namespace App\Services;

use App\Models\OtpCode;
use App\Models\User;
use App\Services\Otp\Exceptions\OtpDeliveryException;
use App\Services\Otp\Exceptions\OtpThrottleException;
use App\Services\Otp\Exceptions\OtpVerificationException;
use App\Services\Otp\OtpChannelManager;
use App\Services\Otp\OtpDispatch;
use App\Support\PhoneNumber;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Hash;

/**
 * Generates codes, enforces the limits around them, and hands delivery to
 * whichever channel config/otp.php names. Which provider actually sends is not
 * this class's business — see OtpChannelManager.
 *
 * Three limits, all per phone number:
 *   - a cooldown between sends, so resend cannot be held down;
 *   - a ceiling on sends per window, so nobody can run up an SMS bill;
 *   - a ceiling on verify attempts, without which a 6-digit code is guessable.
 */
class OtpService
{
    public function __construct(private readonly OtpChannelManager $channels) {}

    /**
     * @throws OtpThrottleException when asked too soon or too often
     * @throws OtpDeliveryException when no channel could deliver
     */
    public function send(string $phone, string $purpose = OtpCode::PURPOSE_LOGIN, ?User $user = null): OtpDispatch
    {
        $phone = PhoneNumber::normalize($phone);
        $now = CarbonImmutable::now();

        $record = OtpCode::firstOrNew(['phone' => $phone, 'purpose' => $purpose]);

        $this->guardSendLimits($record, $now);

        $ttlMinutes = (int) config('otp.ttl_minutes', 10);
        $code = $this->generateCode();

        // Deliver before persisting: a code the candidate never received is
        // worse than none, because it would start the cooldown regardless. The
        // route-level throttle is what stops a failing provider being hammered,
        // so nothing is lost by not counting the attempt here.
        $channel = $this->channels->send($phone, $code, $ttlMinutes);

        $windowExpired = ! $record->window_started_at
            || $record->window_started_at->addMinutes((int) config('otp.throttle.send_window_minutes', 60))->isPast();

        $record->fill([
            'user_id' => $user?->id ?? $record->user_id,
            // Hashed: a leak of this table must not expose live codes.
            'code_hash' => Hash::make($code),
            'channel' => $channel,
            'expires_at' => $now->addMinutes($ttlMinutes),
            'attempts' => 0,
            'consumed_at' => null,
            'last_sent_at' => $now,
            'sends' => $windowExpired ? 1 : $record->sends + 1,
            'window_started_at' => $windowExpired ? $now : $record->window_started_at,
        ])->save();

        return new OtpDispatch(
            channel: $channel,
            expiresAt: $record->expires_at,
            resendAvailableIn: (int) config('otp.throttle.resend_cooldown_seconds', 60),
            debugCode: $this->exposedCode($channel, $code),
        );
    }

    /**
     * Consume a code. Returns the record so the caller can read `user_id` —
     * the phone-change flow needs to know who asked for it.
     *
     * @throws OtpVerificationException
     */
    public function verify(string $phone, string $code, string $purpose = OtpCode::PURPOSE_LOGIN): OtpCode
    {
        $phone = PhoneNumber::normalize($phone);

        $record = OtpCode::where('phone', $phone)->where('purpose', $purpose)->first();

        if (! $record || $record->consumed_at) {
            throw OtpVerificationException::notRequested();
        }

        if ($record->expires_at->isPast()) {
            throw OtpVerificationException::expired();
        }

        $maxAttempts = (int) config('otp.throttle.max_verify_attempts', 5);

        // Checked before this attempt is counted, so an exhausted code stays
        // locked until a new one is sent rather than freeing a guess per call.
        if ($record->attempts >= $maxAttempts) {
            throw OtpVerificationException::tooManyAttempts();
        }

        $record->increment('attempts');

        if (! Hash::check($code, $record->code_hash)) {
            $remaining = max(0, $maxAttempts - $record->attempts);

            throw $remaining === 0
                ? OtpVerificationException::tooManyAttempts()
                : OtpVerificationException::invalid($remaining);
        }

        $record->forceFill(['consumed_at' => CarbonImmutable::now()])->save();

        return $record;
    }

    /** Seconds until this phone may request another code; 0 if it may now. */
    public function cooldownRemaining(string $phone, string $purpose = OtpCode::PURPOSE_LOGIN): int
    {
        $record = OtpCode::where('phone', PhoneNumber::normalize($phone))
            ->where('purpose', $purpose)
            ->first();

        if (! $record?->last_sent_at) {
            return 0;
        }

        $readyAt = $record->last_sent_at->addSeconds((int) config('otp.throttle.resend_cooldown_seconds', 60));

        return max(0, (int) ceil(CarbonImmutable::now()->diffInSeconds($readyAt, false)));
    }

    private function guardSendLimits(OtpCode $record, CarbonImmutable $now): void
    {
        $windowMinutes = (int) config('otp.throttle.send_window_minutes', 60);
        $maxSends = (int) config('otp.throttle.max_sends_per_window', 5);
        $cooldown = (int) config('otp.throttle.resend_cooldown_seconds', 60);

        if ($record->window_started_at) {
            $windowEndsAt = $record->window_started_at->addMinutes($windowMinutes);

            if ($windowEndsAt->isFuture() && $record->sends >= $maxSends) {
                throw OtpThrottleException::tooManySends(
                    (int) ceil($now->diffInSeconds($windowEndsAt, false))
                );
            }
        }

        if ($record->last_sent_at) {
            $readyAt = $record->last_sent_at->addSeconds($cooldown);

            if ($readyAt->isFuture()) {
                throw OtpThrottleException::cooldown((int) ceil($now->diffInSeconds($readyAt, false)));
            }
        }
    }

    private function generateCode(): string
    {
        $length = (int) config('otp.code_length', 6);

        return str_pad((string) random_int(0, (10 ** $length) - 1), $length, '0', STR_PAD_LEFT);
    }

    /**
     * Only the log channel's codes are ever echoed back, so switching on a real
     * provider closes this off even if the config flag is left on.
     */
    private function exposedCode(string $channel, string $code): ?string
    {
        return $channel === 'log' && config('otp.expose_code_in_response') ? $code : null;
    }
}
