<?php

namespace App\Services\LanguageTest;

use App\Models\LanguageTestResponse;
use App\Services\LanguageAssessment\PronunciationAnalyzer;
use App\Services\LanguageAssessment\WhisperTranscriber;
use App\Support\LocalFile;
use App\Support\UnreadableStoredFile;

/**
 * Scores the read-aloud task. Unlike free speech, the candidate reads a
 * known text, so the transcript can be aligned word by word against it:
 * how much of the reference came out recognisably is a real accuracy
 * measure, not a guess. Whisper's per-word confidence (PronunciationAnalyzer)
 * adds how clearly it was said.
 *
 *   score = 70% accuracy (words of the text recognised, in order)
 *         + 30% clarity  (ASR confidence, hesitations)
 */
class ReadAloudScorer
{
    private const ACCURACY_WEIGHT = 0.7;

    public function __construct(
        private readonly WhisperTranscriber $transcriber,
        private readonly PronunciationAnalyzer $pronunciation,
    ) {}

    /**
     * @return array{score: int, evaluation: array<string, mixed>}|null null when the recording could not be transcribed
     */
    public function score(LanguageTestResponse $response, string $language): ?array
    {
        if (! $response->audio_path) {
            return ['score' => 0, 'evaluation' => ['guard' => 'no_recording']];
        }

        try {
            $result = LocalFile::use('local', $response->audio_path, fn (string $path) => $this->transcriber->transcribe($path, $language));
        } catch (UnreadableStoredFile) {
            $result = null;
        }

        if (! $result) {
            return null;
        }

        $reference = self::words((string) ($response->item->content['text'] ?? ''));
        $spoken = self::words($result['transcript']);

        $matched = self::alignedCount($reference, $spoken);
        $accuracy = $reference === [] ? 0 : (int) round($matched['count'] / count($reference) * 100);

        $clarity = $this->pronunciation->analyze($result['word_details'], $result['duration']);
        $score = $clarity === null
            ? $accuracy
            : (int) round(self::ACCURACY_WEIGHT * $accuracy + (1 - self::ACCURACY_WEIGHT) * $clarity['score']);

        return [
            'score' => max(0, min(100, $score)),
            'evaluation' => [
                'transcript' => $result['transcript'],
                'duration_seconds' => round($result['duration'], 1),
                'accuracy' => $accuracy,
                'clarity' => $clarity['score'] ?? null,
                'missed_words' => array_slice($matched['missed'], 0, 20),
                'unclear_words' => $clarity['unclear_words'] ?? [],
            ],
        ];
    }

    /** @return list<string> lower-cased words, punctuation stripped, umlauts kept */
    public static function words(string $text): array
    {
        // "12-18" is read "zwölf bis achtzehn"; digits become the words spoken.
        $text = (string) preg_replace('/(\d)\s*[-–]\s*(\d)/u', '$1 bis $2', $text);
        $text = (string) preg_replace_callback('/\d+/', fn ($m) => ' '.GermanNumbers::words((int) $m[0]).' ', $text);
        $text = mb_strtolower($text);
        $text = preg_replace('/[^\p{L}\p{N}\s-]+/u', ' ', $text);

        return preg_split('/[\s-]+/u', trim((string) $text), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    }

    /**
     * Longest common subsequence of the two word lists: how many words of the
     * reference were read, in order. Skipped or garbled words drop out;
     * a repeated word or a self-correction costs nothing.
     *
     * @param  list<string>  $reference
     * @param  list<string>  $spoken
     * @return array{count: int, missed: list<string>}
     */
    public static function alignedCount(array $reference, array $spoken): array
    {
        $n = count($reference);
        $m = count($spoken);
        $table = array_fill(0, $n + 1, array_fill(0, $m + 1, 0));

        for ($i = 1; $i <= $n; $i++) {
            for ($j = 1; $j <= $m; $j++) {
                $table[$i][$j] = $reference[$i - 1] === $spoken[$j - 1]
                    ? $table[$i - 1][$j - 1] + 1
                    : max($table[$i - 1][$j], $table[$i][$j - 1]);
            }
        }

        // Walk back to list the reference words that were not matched.
        $missed = [];
        for ($i = $n, $j = $m; $i > 0;) {
            if ($j > 0 && $reference[$i - 1] === $spoken[$j - 1]) {
                $i--;
                $j--;
            } elseif ($j > 0 && $table[$i][$j - 1] >= $table[$i - 1][$j]) {
                $j--;
            } else {
                $missed[] = $reference[$i - 1];
                $i--;
            }
        }

        return ['count' => $table[$n][$m], 'missed' => array_reverse($missed)];
    }
}
