<?php

namespace App\Services\LanguageAssessment;

/**
 * Scores how clearly the candidate was understood, from the per-word
 * probabilities Whisper reports.
 *
 * What this is: a measure of *intelligibility to a multilingual ASR model*.
 * A word the model recognises with 0.95 confidence was articulated close to
 * how that language is normally spoken; a run of 0.3s is what mumbling,
 * clipping and heavily accented or mispronounced words look like from the
 * outside. Long silences count too — a speaker groping for the next word is
 * not speaking clearly, however well each individual word lands.
 *
 * What this is not: phoneme-level pronunciation scoring. Real "phonetic
 * precision" needs forced alignment against a reference transcript with a
 * phoneme acoustic model, and the candidate here is speaking freely, so there
 * is no reference to align to. This proxy is defensible, runs locally and
 * free, and — unlike a score invented from word counts — actually reflects
 * how the speech sounded. It is labelled "clarity" in the UI for that reason.
 */
class PronunciationAnalyzer
{
    /** Below this, the model was guessing at the word. */
    private const UNCLEAR_THRESHOLD = 0.5;

    /** A gap this long between words reads as hesitation, not as phrasing. */
    private const PAUSE_SECONDS = 0.7;

    /** Confidence range mapped onto 0-100. Whisper rarely goes below ~0.35. */
    private const FLOOR = 0.35;

    private const CEILING = 0.95;

    /**
     * @param  list<array{word: string, probability: float, start: float, end: float}>  $words
     * @return array{
     *     score: int,
     *     mean_confidence: float,
     *     unclear_word_ratio: float,
     *     unclear_words: list<array{word: string, probability: float}>,
     *     pause_count: int,
     *     pause_seconds: float,
     *     articulation_rate: float
     * }|null  null when the transcriber returned no word timings at all
     */
    public function analyze(array $words, float $durationSeconds): ?array
    {
        $words = array_values(array_filter(
            $words,
            fn ($word) => isset($word['probability'], $word['start'], $word['end']),
        ));

        if ($words === []) {
            return null;
        }

        $confidences = array_map(static fn ($word) => (float) $word['probability'], $words);
        $meanConfidence = array_sum($confidences) / count($confidences);

        $unclear = array_values(array_filter($words, fn ($word) => (float) $word['probability'] < self::UNCLEAR_THRESHOLD));
        $unclearRatio = count($unclear) / count($words);

        [$pauseCount, $pauseSeconds] = $this->pauses($words);

        // Speaking time only: the span from first word to last, minus the
        // pauses inside it. Leading and trailing silence — dead air before the
        // candidate starts, or after they finish — is not speaking time either.
        // This separates "speaks slowly" from "pauses a lot".
        $span = (float) end($words)['end'] - (float) $words[0]['start'];
        $speakingSeconds = max(0.1, $span - $pauseSeconds);
        $articulationRate = round(count($words) / ($speakingSeconds / 60), 1);

        return [
            'score' => $this->score($meanConfidence, $unclearRatio, $pauseSeconds, $durationSeconds),
            'mean_confidence' => round($meanConfidence, 4),
            'unclear_word_ratio' => round($unclearRatio, 4),
            'unclear_words' => $this->weakest($unclear),
            'pause_count' => $pauseCount,
            'pause_seconds' => round($pauseSeconds, 2),
            'articulation_rate' => $articulationRate,
        ];
    }

    private function score(float $meanConfidence, float $unclearRatio, float $pauseSeconds, float $duration): int
    {
        $base = ($meanConfidence - self::FLOOR) / (self::CEILING - self::FLOOR);
        $base = max(0.0, min(1.0, $base)) * 100;

        // A high mean can still hide a handful of words nobody could make out.
        $unclearPenalty = min($unclearRatio * 40, 20);

        // Share of the recording spent in hesitation, worth up to 10 points.
        $pausePenalty = $duration > 0 ? min(($pauseSeconds / $duration) * 30, 10) : 0;

        return (int) round(max(0, min(100, $base - $unclearPenalty - $pausePenalty)));
    }

    /** @return array{0: int, 1: float} */
    private function pauses(array $words): array
    {
        $count = 0;
        $seconds = 0.0;

        for ($i = 1; $i < count($words); $i++) {
            $gap = (float) $words[$i]['start'] - (float) $words[$i - 1]['end'];

            if ($gap >= self::PAUSE_SECONDS) {
                $count++;
                $seconds += $gap;
            }
        }

        return [$count, $seconds];
    }

    /**
     * The worst offenders, for feedback the candidate can act on — "these are
     * the words we could not make out" beats a bare number.
     *
     * @return list<array{word: string, probability: float}>
     */
    private function weakest(array $unclear): array
    {
        usort($unclear, fn ($a, $b) => $a['probability'] <=> $b['probability']);

        return array_values(array_map(
            static fn ($word) => [
                'word' => $word['word'],
                'probability' => round((float) $word['probability'], 3),
            ],
            array_slice($unclear, 0, 8),
        ));
    }
}
