<?php

namespace App\Services\Otp\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * A code was rejected. `reason` distinguishes the cases the client can act on
 * differently — an expired code means "resend", a wrong one means "retype",
 * and an exhausted one means the code is dead until a new one is requested.
 *
 * The message stays the same shape whether or not the phone has ever been
 * seen, so this cannot be used to enumerate registered numbers.
 */
class OtpVerificationException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $reason,
        public readonly ?int $attemptsRemaining = null,
    ) {
        parent::__construct($message);
    }

    public static function notRequested(): self
    {
        return new self('That code is invalid or has expired. Request a new one.', 'not_requested');
    }

    public static function expired(): self
    {
        return new self('That code has expired. Request a new one.', 'expired');
    }

    public static function invalid(int $attemptsRemaining): self
    {
        return new self('That code is not correct.', 'invalid', $attemptsRemaining);
    }

    public static function tooManyAttempts(): self
    {
        return new self('Too many incorrect attempts. Request a new code.', 'too_many_attempts', 0);
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json(array_filter([
            'message' => $this->getMessage(),
            'reason' => $this->reason,
            'attempts_remaining' => $this->attemptsRemaining,
        ], fn ($value) => $value !== null), $this->reason === 'too_many_attempts' ? 429 : 422);
    }
}
