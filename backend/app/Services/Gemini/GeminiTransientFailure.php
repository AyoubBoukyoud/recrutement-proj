<?php

namespace App\Services\Gemini;

use RuntimeException;

/**
 * The call did not fail on its merits — it did not get to happen (429, 408,
 * 5xx, dropped connection). Callers rethrow it as their own transient
 * failure so the queue retries instead of recording a wrong result.
 */
class GeminiTransientFailure extends RuntimeException {}
