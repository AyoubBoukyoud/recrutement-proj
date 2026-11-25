<?php

namespace App\Services\LanguageTest;

use App\Models\LanguageTestItem;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Turns a listening item's script into the clip candidates hear, once, at
 * bank time — with Gemini's text-to-speech (one voice, or two for a
 * dialogue). The audio is stored on the private `local` disk and served to
 * candidates through short-lived signed URLs.
 *
 * An administrator can always upload a recorded clip instead; this is the
 * convenience path, and it fails soft (returns false, logged).
 */
class SpeechSynthesizer
{
    /** Gemini TTS returns raw 16-bit little-endian mono PCM at this rate. */
    private const SAMPLE_RATE = 24000;

    private const VOICES = ['Kore', 'Puck'];

    public function isConfigured(): bool
    {
        return filled(config('services.gemini.key')) && filled(config('services.gemini.tts_model'));
    }

    public function synthesize(LanguageTestItem $item): bool
    {
        $script = $item->content['script'] ?? [];
        if (! $this->isConfigured() || ! is_array($script) || $script === []) {
            return false;
        }

        $speakers = array_values(array_unique(array_map(fn ($l) => (string) $l['speaker'], $script)));
        $dialogue = count($speakers) === 2;

        $text = "Lies den folgenden Text natürlich und deutlich vor, in normalem Sprechtempo für Deutschlernende auf Niveau {$item->cefr_level}:\n\n"
            .implode("\n", array_map(
                fn ($l) => $dialogue ? "{$l['speaker']}: {$l['text']}" : $l['text'],
                $script,
            ));

        $speechConfig = $dialogue
            ? ['multiSpeakerVoiceConfig' => ['speakerVoiceConfigs' => array_map(
                fn ($speaker, $i) => ['speaker' => $speaker, 'voiceConfig' => ['prebuiltVoiceConfig' => ['voiceName' => self::VOICES[$i]]]],
                $speakers,
                array_keys($speakers),
            )]]
            : ['voiceConfig' => ['prebuiltVoiceConfig' => ['voiceName' => self::VOICES[0]]]];

        $url = rtrim((string) config('services.gemini.tts_endpoint'), '/').'/'.config('services.gemini.tts_model').':generateContent';

        try {
            $response = Http::withHeaders(['x-goog-api-key' => config('services.gemini.key')])
                ->timeout(config('services.gemini.timeout'))
                ->post($url, [
                    'contents' => [['parts' => [['text' => $text]]]],
                    'generationConfig' => [
                        'responseModalities' => ['AUDIO'],
                        'speechConfig' => $speechConfig,
                    ],
                ]);
        } catch (ConnectionException $e) {
            Log::warning("Exam item {$item->id}: speech synthesis unreachable: {$e->getMessage()}");

            return false;
        }

        $pcm = base64_decode((string) data_get($response->json(), 'candidates.0.content.parts.0.inlineData.data'), true);
        if ($response->failed() || ! $pcm) {
            Log::warning("Exam item {$item->id}: speech synthesis returned {$response->status()}.");

            return false;
        }

        $path = "language-test/audio/item-{$item->id}-".now()->format('YmdHis').'.wav';
        Storage::disk('local')->put($path, self::wav($pcm));

        if ($item->audio_path && $item->audio_path !== $path) {
            Storage::disk('local')->delete($item->audio_path);
        }
        $item->update(['audio_path' => $path]);

        return true;
    }

    /** Wrap raw PCM in a WAV header so every browser can play it. */
    public static function wav(string $pcm, int $rate = self::SAMPLE_RATE): string
    {
        $channels = 1;
        $bits = 16;
        $byteRate = $rate * $channels * $bits / 8;
        $blockAlign = $channels * $bits / 8;

        return 'RIFF'.pack('V', 36 + strlen($pcm)).'WAVE'
            .'fmt '.pack('VvvVVvv', 16, 1, $channels, $rate, $byteRate, $blockAlign, $bits)
            .'data'.pack('V', strlen($pcm)).$pcm;
    }
}
