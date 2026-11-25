<?php

namespace App\Jobs;

use App\Services\Gemini\GeminiTransientFailure;
use App\Services\LanguageTest\ItemGenerator;
use App\Services\LanguageTest\SpeechSynthesizer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * The admin "generate drafts" button. Queued because each Gemini call can
 * take tens of seconds — far too long to hold an HTTP request open.
 */
class GenerateLanguageTestItems implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 900;

    public function __construct(
        private readonly string $language,
        private readonly string $level,
        private readonly string $skill,
        private readonly string $taskType,
        private readonly string $sector,
        private readonly int $count,
    ) {}

    public function handle(ItemGenerator $generator, SpeechSynthesizer $speech): void
    {
        for ($i = 0; $i < $this->count; $i++) {
            try {
                $result = $generator->generate($this->language, $this->level, $this->skill, $this->taskType, $this->sector);
            } catch (GeminiTransientFailure $e) {
                $this->release(60);

                return;
            }

            if (! $result['item']) {
                Log::info("Exam item draft rejected ({$this->level} {$this->skill}/{$this->taskType}): ".implode(' ', $result['problems']));

                continue;
            }

            if ($this->skill === 'listening') {
                $speech->synthesize($result['item']);
            }
        }
    }
}
