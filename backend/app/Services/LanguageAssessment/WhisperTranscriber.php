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
     * @return array{transcript: string, words: int, duration: float}|null
     */
    public function transcribe(string $absoluteAudioPath): ?array
    {
        $script = base_path('scripts/transcribe.py');
        $result = Process::timeout(180)->run(['python3', $script, $absoluteAudioPath]);

        $payload = json_decode($result->output(), true);

        if (! $result->successful() || ! is_array($payload) || isset($payload['error'])) {
            Log::warning('Whisper transcription unavailable: '.($payload['error'] ?? $result->errorOutput()));

            return null;
        }

        return [
            'transcript' => $payload['transcript'],
            'words' => (int) $payload['words'],
            'duration' => (float) $payload['duration'],
        ];
    }
}
