<?php

namespace App\Services\Otp\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * The caller asked for a code sooner, or more often, than the limits allow.
 * Carries the wait in seconds so the client can show a countdown rather than
 * an opaque refusal.
 */
class OtpThrottleException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $retryAfter,
        public readonly string $reason,
    ) {
        parent::__construct($message);
    }

    public static function cooldown(int $retryAfter): self
    {
        return new self(
            "Please wait {$retryAfter} seconds before requesting another code.",
            $retryAfter,
            'cooldown',
        );
    }

    public static function tooManySends(int $retryAfter): self
    {
        return new self(
            'Too many codes requested for this number. Try again later.',
            $retryAfter,
            'send_limit',
        );
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'reason' => $this->reason,
            'retry_after' => $this->retryAfter,
        ], 429)->header('Retry-After', (string) $this->retryAfter);
    }
}
