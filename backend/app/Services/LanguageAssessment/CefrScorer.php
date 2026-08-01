<?php

namespace App\Services\LanguageAssessment;

/**
 * Heuristic CEFR estimator over four observable signals: speaking rate,
 * disfluency (filler words), vocabulary variety, and how clearly the speech
 * was articulated (PronunciationAnalyzer, from Whisper's word confidences).
 *
 * Still an approximation — it does not assess grammar, and its clarity signal
 * is intelligibility to an ASR model rather than phoneme-level scoring. What
 * it now does do is show its work: every estimate comes back with the
 * contribution of each component, so the candidate can be told why they were
 * placed at a level instead of being handed a letter.
 */
class CefrScorer
{
    private const FILLERS = [
        'fr' => ['euh', 'ben', 'donc', 'voilà', 'genre', 'quoi', 'en fait', 'tu vois'],
        'ar' => ['يعني', 'اه', 'امم', 'طيب'],
        'en' => ['um', 'uh', 'like', 'you know', 'so', 'basically', 'i mean'],
        'de' => ['äh', 'ähm', 'also', 'halt', 'ne', 'weißt du'],
    ];

    /** Maximum contribution of each component; they sum to 4.0. */
    private const WEIGHTS = [
        'speech_rate' => 1.5,
        'vocabulary' => 1.0,
        'clarity' => 1.5,
    ];

    /** Deducted, not earned — hence not part of WEIGHTS. */
    private const FILLER_PENALTY_MAX = 1.0;

    /** A comfortable conversational pace; faster earns no extra credit. */
    private const TARGET_WPM = 140;

    /** Type-token ratio at which vocabulary variety is considered full marks. */
    private const TARGET_VARIETY = 0.6;

    private const BANDS = [
        ['A1', 0.8],
        ['A2', 1.5],
        ['B1', 2.2],
        ['B2', 2.9],
        ['C1', 3.5],
    ];

    /**
     * @param  array|null  $pronunciation  PronunciationAnalyzer output, or null when the
     *                                     transcriber returned no word-level timings
     * @return array{
     *     words_per_minute: int,
     *     filler_word_ratio: float,
     *     cefr: string,
     *     score: float,
     *     breakdown: array
     * }
     */
    public function score(
        string $language,
        string $transcript,
        int $wordCount,
        float $durationSeconds,
        ?array $pronunciation = null,
    ): array {
        $wpm = $durationSeconds > 0 ? (int) round($wordCount / ($durationSeconds / 60)) : 0;

        $words = preg_split('/\s+/u', $this->normalise($transcript), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $fillerRatio = $this->fillerRatio($language, $transcript, $words);
        $uniqueRatio = count($words) > 0 ? count(array_unique($words)) / count($words) : 0.0;

        $components = $this->components($wpm, $uniqueRatio, $pronunciation);
        $penalty = min($fillerRatio * 8, self::FILLER_PENALTY_MAX);

        $total = max(0.0, array_sum(array_column($components, 'contribution')) - $penalty);

        // Without clarity data only 2.5 of the 4 points are reachable, which
        // would cap every such candidate at B1. Rescale so the bands keep
        // meaning the same thing on both paths.
        if ($pronunciation === null) {
            $total = $total * (array_sum(self::WEIGHTS) / (self::WEIGHTS['speech_rate'] + self::WEIGHTS['vocabulary']));
        }

        $total = round(min(4.0, $total), 3);

        return [
            'words_per_minute' => $wpm,
            'filler_word_ratio' => round($fillerRatio, 4),
            'cefr' => $this->band($total),
            'score' => $total,
            'breakdown' => [
                'components' => $components,
                'penalty' => [
                    'key' => 'fillers',
                    'label' => 'Filler words',
                    'detail' => $this->percent($fillerRatio).' of what you said',
                    'contribution' => -round($penalty, 3),
                    'max' => -self::FILLER_PENALTY_MAX,
                ],
                'total' => $total,
                'max_total' => array_sum(self::WEIGHTS),
                'estimated_from_clarity' => $pronunciation !== null,
            ],
        ];
    }

    /**
     * One entry per earned component, each carrying what was measured and what
     * it was worth — this is what the candidate is shown.
     */
    private function components(int $wpm, float $uniqueRatio, ?array $pronunciation): array
    {
        $components = [
            [
                'key' => 'speech_rate',
                'label' => 'Speaking pace',
                'detail' => "{$wpm} words per minute",
                'contribution' => round(min($wpm / self::TARGET_WPM, 1) * self::WEIGHTS['speech_rate'], 3),
                'max' => self::WEIGHTS['speech_rate'],
            ],
            [
                'key' => 'vocabulary',
                'label' => 'Vocabulary range',
                'detail' => $this->percent($uniqueRatio).' of your words were different',
                'contribution' => round(min($uniqueRatio / self::TARGET_VARIETY, 1) * self::WEIGHTS['vocabulary'], 3),
                'max' => self::WEIGHTS['vocabulary'],
            ],
        ];

        if ($pronunciation !== null) {
            $components[] = [
                'key' => 'clarity',
                'label' => 'Pronunciation clarity',
                'detail' => $pronunciation['score'].'/100 — '.$this->clarityWording($pronunciation),
                'contribution' => round(($pronunciation['score'] / 100) * self::WEIGHTS['clarity'], 3),
                'max' => self::WEIGHTS['clarity'],
            ];
        }

        return $components;
    }

    private function clarityWording(array $pronunciation): string
    {
        $unclear = count($pronunciation['unclear_words'] ?? []);

        return match (true) {
            $pronunciation['score'] >= 75 => 'clearly articulated throughout',
            $pronunciation['score'] >= 55 => $unclear > 0
                ? 'mostly clear, a few words were hard to make out'
                : 'mostly clear, with some hesitation',
            default => 'several words were difficult to make out',
        };
    }

    /**
     * Single-word fillers are matched against the token list; multi-word ones
     * ("you know", "en fait") are matched as phrases against the normalised
     * transcript, since splitting on whitespace first made them unmatchable.
     *
     * @param  list<string>  $words
     */
    private function fillerRatio(string $language, string $transcript, array $words): float
    {
        if ($words === []) {
            return 0.0;
        }

        $fillers = self::FILLERS[$language] ?? [];
        $normalised = ' '.$this->normalise($transcript).' ';
        $count = 0;

        foreach ($fillers as $filler) {
            if (str_contains($filler, ' ')) {
                // Counts the words the phrase occupies, so "you know" weighs
                // the same as the two tokens it is made of.
                $occurrences = substr_count($normalised, ' '.$filler.' ');
                $count += $occurrences * (substr_count($filler, ' ') + 1);

                continue;
            }

            $count += count(array_keys($words, $filler, true));
        }

        return min(1.0, $count / count($words));
    }

    /** Lower-cased and stripped of punctuation, so "Also," matches "also". */
    private function normalise(string $transcript): string
    {
        $lowered = mb_strtolower(trim($transcript));

        return trim(preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $lowered) ?? '');
    }

    private function band(float $score): string
    {
        foreach (self::BANDS as [$level, $ceiling]) {
            if ($score < $ceiling) {
                return $level;
            }
        }

        return 'C2';
    }

    private function percent(float $ratio): string
    {
        return round($ratio * 100).'%';
    }
}
