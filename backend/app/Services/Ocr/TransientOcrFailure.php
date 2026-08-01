<?php

namespace App\Services\Ocr;

use RuntimeException;

/**
 * The extraction did not fail — it did not get to happen. A 429, a 503 or a
 * dropped connection says nothing about the document, so it must reach the
 * queue as a thrown exception and be retried, rather than being swallowed into
 * "confidence 0" and marking a perfectly readable CV as unreadable forever.
 */
class TransientOcrFailure extends RuntimeException {}
