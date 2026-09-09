<?php

namespace App\Services\Otp\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * A channel could not hand the code to its provider. Thrown by drivers for a
 * single failure, and by OtpChannelManager once the whole chain is exhausted.
 */
class OtpDeliveryException extends RuntimeException
{
    /** @param  array<string, string>  $failures  channel name => reason */
    public function __construct(string $message, public readonly array $failures = [])
    {
        parent::__construct($message);
    }

    /** @param  array<string, string>  $failures */
    public static function chainExhausted(array $failures): self
    {
        return new self('No OTP channel could deliver the code.', $failures);
    }

    public function render(Request $request): JsonResponse
    {
        // 502, not 500: the request was fine, an upstream provider was not.
        return response()->json([
            'message' => 'We could not send your code right now. Please try again in a moment.',
        ], 502);
    }
}
