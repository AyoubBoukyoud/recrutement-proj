<?php

namespace App\Services\LanguageTest;

use RuntimeException;

/** A request the exam rules do not allow; the message is shown to the candidate. */
class ExamRefusal extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 409, public readonly ?string $reason = null)
    {
        parent::__construct($message);
    }
}
