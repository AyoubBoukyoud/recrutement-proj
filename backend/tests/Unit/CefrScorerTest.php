<?php

namespace Tests\Unit;

use App\Services\LanguageAssessment\CefrScorer;
use PHPUnit\Framework\TestCase;

/**
 * The scorer drives a level that appears on a candidate's dossier and that a
 * recruiter filters on, so its arithmetic is worth pinning down.
 */
class CefrScorerTest extends TestCase
{
    private CefrScorer $scorer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->scorer = new CefrScorer;
    }

    /** @return array{score: int, unclear_words: list<array{word: string, probability: float}>} */
    private function clarity(int $score): array
    {
        return ['score' => $score, 'unclear_words' => []];
    }

    public function test_a_fluent_varied_clearly_spoken_answer_lands_high(): void
    {
        $transcript = implode(' ', array_map(
            fn (int $i) => "wort{$i} zusammenhang{$i}",
            range(1, 60),
        ));

        $result = $this->scorer->score('de', $transcript, 120, 60, $this->clarity(90));

        $this->assertContains($result['cefr'], ['C1', 'C2']);
        $this->assertSame(120, $result['words_per_minute']);
    }

    public function test_slow_repetitive_unclear_speech_lands_low(): void
    {
        $transcript = str_repeat('ich arbeite ', 15);

        $result = $this->scorer->score('de', $transcript, 30, 60, $this->clarity(30));

        $this->assertContains($result['cefr'], ['A1', 'A2']);
        $this->assertSame(30, $result['words_per_minute']);
    }

    public function test_clarity_moves_the_level_for_otherwise_identical_speech(): void
    {
        $transcript = implode(' ', array_map(fn (int $i) => "wort{$i}", range(1, 100)));

        $clear = $this->scorer->score('de', $transcript, 100, 60, $this->clarity(95));
        $mumbled = $this->scorer->score('de', $transcript, 100, 60, $this->clarity(20));

        $this->assertGreaterThan($mumbled['score'], $clear['score']);
    }

    public function test_multi_word_fillers_are_counted(): void
    {
        // Splitting on whitespace before comparing made these unmatchable —
        // every multi-word entry in the filler list was dead.
        $transcript = 'I worked there, you know, for five years, you know, in total.';

        $result = $this->scorer->score('en', $transcript, 13, 60);

        $this->assertGreaterThan(0, $result['filler_word_ratio']);
    }

    public function test_fillers_are_matched_past_punctuation_and_case(): void
    {
        $withFillers = $this->scorer->score('de', 'Also, ähm, ich Halt arbeite dort.', 6, 30);
        $without = $this->scorer->score('de', 'Ich arbeite seit fünf Jahren dort.', 6, 30);

        $this->assertGreaterThan($without['filler_word_ratio'], $withFillers['filler_word_ratio']);
    }

    public function test_a_small_filler_ratio_survives_rounding(): void
    {
        // decimal(5,2) used to flatten anything under 0.005 to zero, which is
        // most realistic ratios on a one-minute answer.
        $transcript = 'um '.implode(' ', array_map(fn (int $i) => "wort{$i}", range(1, 299)));

        $result = $this->scorer->score('en', $transcript, 300, 60);

        $this->assertGreaterThan(0, $result['filler_word_ratio']);
        $this->assertLessThan(0.005, $result['filler_word_ratio']);
    }

    public function test_the_breakdown_explains_every_point_awarded(): void
    {
        $result = $this->scorer->score('en', 'one two three four five six', 6, 30, $this->clarity(70));

        $keys = array_column($result['breakdown']['components'], 'key');
        $this->assertSame(['speech_rate', 'vocabulary', 'clarity'], $keys);

        foreach ($result['breakdown']['components'] as $component) {
            $this->assertNotEmpty($component['label']);
            $this->assertNotEmpty($component['detail']);
            $this->assertLessThanOrEqual($component['max'], $component['contribution']);
        }

        $this->assertTrue($result['breakdown']['estimated_from_clarity']);
    }

    public function test_a_missing_clarity_signal_does_not_cap_the_level(): void
    {
        $transcript = implode(' ', array_map(fn (int $i) => "wort{$i}", range(1, 140)));

        // No word timings (older whisper build): the remaining components are
        // rescaled, so a strong answer can still reach the top bands.
        $result = $this->scorer->score('de', $transcript, 140, 60, null);

        $this->assertFalse($result['breakdown']['estimated_from_clarity']);
        $this->assertContains($result['cefr'], ['C1', 'C2']);
        $this->assertLessThanOrEqual(4.0, $result['score']);
    }

    public function test_silence_scores_the_bottom_band_rather_than_dividing_by_zero(): void
    {
        $result = $this->scorer->score('fr', '', 0, 0);

        $this->assertSame('A1', $result['cefr']);
        $this->assertSame(0, $result['words_per_minute']);
        $this->assertSame(0.0, $result['filler_word_ratio']);
    }
}
