<?php

namespace App\Services\LanguageAssessment;

/**
 * Heuristic CEFR estimator from transcript + timing alone: words-per-minute,
 * filler-word ratio, and vocabulary variety (type-token ratio). This is an
 * MVP approximation of fluency, not real pronunciation/grammar assessment —
 * see the Phase 0 plan notes on why (no ML model, free/local constraint).
 */
class CefrScorer
{
    private const FILLERS = [
        'fr' => ['euh', 'ben', 'donc', 'voilà', 'genre', 'quoi'],
        'ar' => ['يعني', 'اه', 'امم', 'طيب'],
        'en' => ['um', 'uh', 'like', 'you know', 'so', 'basically'],
        'de' => ['äh', 'ähm', 'also', 'halt', 'ne'],
    ];

    /**
     * @return array{words_per_minute: int, filler_word_ratio: float, cefr: string}
     */
    public function score(string $language, string $transcript, int $wordCount, float $durationSeconds): array
    {
        $wpm = $durationSeconds > 0 ? (int) round($wordCount / ($durationSeconds / 60)) : 0;

        $words = preg_split('/\s+/u', mb_strtolower(trim($transcript)), -1, PREG_SPLIT_NO_EMPTY);
        $words = $words ?: [];
        $fillerCount = 0;
        foreach ($words as $word) {
            if (in_array($word, self::FILLERS[$language] ?? [], true)) {
                $fillerCount++;
            }
        }
        $fillerRatio = count($words) > 0 ? round($fillerCount / count($words), 3) : 0.0;

        $uniqueRatio = count($words) > 0 ? count(array_unique($words)) / count($words) : 0;

        return [
            'words_per_minute' => $wpm,
            'filler_word_ratio' => $fillerRatio,
            'cefr' => $this->mapToCefr($wpm, $fillerRatio, $uniqueRatio),
        ];
    }

    private function mapToCefr(int $wpm, float $fillerRatio, float $uniqueRatio): string
    {
        // A composite score in [0, 4]: fluency (wpm), disfluency penalty, vocabulary variety.
        $fluency = min($wpm / 150, 1) * 2;
        $penalty = min($fillerRatio * 4, 1.5);
        $variety = min($uniqueRatio, 1) * 1.5;

        $score = max(0, $fluency - $penalty + $variety);

        return match (true) {
            $score < 0.6 => 'A1',
            $score < 1.2 => 'A2',
            $score < 1.8 => 'B1',
            $score < 2.4 => 'B2',
            $score < 3.0 => 'C1',
            default => 'C2',
        };
    }
}
