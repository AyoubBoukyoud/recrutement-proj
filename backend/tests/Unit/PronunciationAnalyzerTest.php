<?php

namespace Tests\Unit;

use App\Services\LanguageAssessment\PronunciationAnalyzer;
use PHPUnit\Framework\TestCase;

class PronunciationAnalyzerTest extends TestCase
{
    private PronunciationAnalyzer $analyzer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->analyzer = new PronunciationAnalyzer;
    }

    /**
     * @param  list<float>  $probabilities
     * @return list<array{word: string, probability: float, start: float, end: float}>
     */
    private function words(array $probabilities, float $gap = 0.1): array
    {
        $words = [];
        $cursor = 0.0;

        foreach ($probabilities as $i => $probability) {
            $words[] = [
                'word' => "wort{$i}",
                'probability' => $probability,
                'start' => round($cursor, 3),
                'end' => round($cursor + 0.4, 3),
            ];
            $cursor += 0.4 + $gap;
        }

        return $words;
    }

    public function test_confidently_recognised_speech_scores_high(): void
    {
        $result = $this->analyzer->analyze($this->words(array_fill(0, 40, 0.95)), 30);

        $this->assertGreaterThanOrEqual(90, $result['score']);
        $this->assertSame([], $result['unclear_words']);
    }

    public function test_mumbled_speech_scores_low_and_names_the_worst_words(): void
    {
        $words = $this->words([0.9, 0.2, 0.85, 0.15, 0.3, 0.88]);
        $words[1]['word'] = 'Krankenpflege';
        $words[3]['word'] = 'Versicherung';

        $result = $this->analyzer->analyze($words, 10);

        $this->assertLessThan(60, $result['score']);
        $this->assertSame(['Versicherung', 'Krankenpflege', 'wort4'], array_column($result['unclear_words'], 'word'));
        $this->assertEqualsWithDelta(0.5, $result['unclear_word_ratio'], 0.001);
    }

    public function test_long_silences_count_against_the_score(): void
    {
        $confident = array_fill(0, 20, 0.9);

        $fluent = $this->analyzer->analyze($this->words($confident, 0.1), 20);
        $hesitant = $this->analyzer->analyze($this->words($confident, 2.0), 60);

        $this->assertGreaterThan($hesitant['score'], $fluent['score']);
        $this->assertSame(0, $fluent['pause_count']);
        $this->assertSame(19, $hesitant['pause_count']);
    }

    public function test_articulation_rate_ignores_the_pauses(): void
    {
        // 20 words, ~8s of speech inside a 60s clip: slow overall, but not slow
        // while actually speaking. The two are different findings.
        $result = $this->analyzer->analyze($this->words(array_fill(0, 20, 0.9), 2.0), 60);

        $this->assertGreaterThan(60, $result['articulation_rate']);
    }

    public function test_no_word_timings_means_no_pronunciation_verdict(): void
    {
        // Better than inventing a neutral score the scorer would treat as real.
        $this->assertNull($this->analyzer->analyze([], 60));
        $this->assertNull($this->analyzer->analyze([['word' => 'hi']], 60));
    }
}
