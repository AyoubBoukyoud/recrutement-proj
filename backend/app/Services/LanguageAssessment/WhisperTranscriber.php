<?php

namespace App\Services\LanguageAssessment;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

/**
 * Shells out to scripts/transcribe.py (faster-whisper). Degrades gracefully
 * — same pattern as TesseractOcrService — if the python package isn't
 * installed on this machine, instead of failing the whole job.
 */
class WhisperTranscriber
{
    /**
     * @param  string|null  $language  which language the candidate was asked to speak;
     *                                 passed to Whisper so it does not have to guess from
     *                                 a short accented clip and get it wrong
     * @return array{
     *     transcript: string,
     *     words: int,
     *     duration: float,
     *     detected_language: string|null,
     *     word_details: list<array{word: string, probability: float, start: float, end: float}>
     * }|null
     */
    public function transcribe(string $absoluteAudioPath, ?string $language = null): ?array
    {
        $script = base_path('scripts/transcribe.py');

        $command = ['python3', $script, $absoluteAudioPath];
        if ($language) {
            $command[] = '--language';
            $command[] = $language;
        }

        $result = Process::timeout(180)->run($command);

        $payload = json_decode($result->output(), true);

        if (! $result->successful() || ! is_array($payload) || isset($payload['error'])) {
            Log::warning('Whisper transcription unavailable: '.($payload['error'] ?? $result->errorOutput()));

            return null;
        }

        return [
            'transcript' => $payload['transcript'],
            'words' => (int) $payload['words'],
            'duration' => (float) $payload['duration'],
            'detected_language' => $payload['language'] ?? null,
            // Absent on builds without word timestamps; downstream treats an
            // empty list as "no pronunciation data" rather than as silence.
            'word_details' => array_values($payload['word_details'] ?? []),
        ];
    }
}
