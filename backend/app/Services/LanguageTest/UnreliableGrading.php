<?php

namespace App\Services\LanguageTest;

use RuntimeException;

/** Retry without turning incomplete or contradictory AI output into a candidate mark. */
class UnreliableGrading extends RuntimeException
{
    public function __construct(public readonly array $evaluation)
    {
        parent::__construct('The AI grading was incomplete or inconsistent.');
    }
}
