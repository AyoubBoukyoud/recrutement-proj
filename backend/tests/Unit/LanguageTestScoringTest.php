<?php

namespace Tests\Unit;

use App\Models\LanguageTestItem;
use App\Services\LanguageTest\GermanNumbers;
use App\Services\LanguageTest\ItemShape;
use App\Services\LanguageTest\KeyScorer;
use App\Services\LanguageTest\OutcomeResolver;
use App\Services\LanguageTest\ProductiveGrader;
use App\Services\LanguageTest\ReadAloudScorer;
use Tests\TestCase;

class LanguageTestScoringTest extends TestCase
{
    private function outcome(string $level, array $scores): array
    {
        return app(OutcomeResolver::class)->resolve($level, $scores);
    }

    public function test_passing_every_skill_confirms_the_level(): void
    {
        $r = $this->outcome('B1', ['reading' => 70, 'listening' => 62, 'writing' => 80, 'speaking' => 60]);

        $this->assertSame('confirmed', $r['outcome']);
        $this->assertSame('B1', $r['cefr']);
    }

    public function test_one_weak_skill_does_not_establish_an_untested_lower_level(): void
    {
        $r = $this->outcome('B1', ['reading' => 90, 'listening' => 50, 'writing' => 80, 'speaking' => 75]);
        $this->assertSame('not_demonstrated', $r['outcome']);
        $this->assertNull($r['cefr']);
        $this->assertNull($r['skill_results']['listening']);
        $this->assertSame('B1', $r['skill_results']['reading']);
    }

    public function test_zero_never_earns_a_level_including_a1(): void
    {
        foreach (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as $level) {
            $result = $this->outcome($level, array_fill_keys(['reading', 'listening', 'writing', 'speaking'], 0));
            $this->assertNull($result['cefr']);
            $this->assertSame('not_demonstrated', $result['outcome']);
        }
    }

    public function test_excellent_scores_suggest_the_next_exam_without_upgrading(): void
    {
        $r = $this->outcome('B1', ['reading' => 90, 'listening' => 88, 'writing' => 86, 'speaking' => 95]);

        $this->assertSame('may_be_higher', $r['outcome']);
        $this->assertSame('B1', $r['cefr']);
        $this->assertSame('confirmed', $this->outcome('C2', array_fill_keys(['reading', 'listening', 'writing', 'speaking'], 99))['outcome']);
    }

    public function test_missing_or_unscored_skills_prevent_an_overall_level(): void
    {
        $r = $this->outcome('B1', ['reading' => 70, 'writing' => null]);

        $this->assertNull($r['outcome']);
        $this->assertNull($r['cefr']);
        $this->assertNull($r['skill_results']['writing']);
        $this->assertNull($this->outcome('B1', ['reading' => null])['outcome']);
    }

    public function test_pass_boundary_and_mixed_exam_levels(): void
    {
        $scores = array_fill_keys(['reading', 'listening', 'writing', 'speaking'], 60);
        $this->assertSame('A1', $this->outcome('A1', $scores)['cefr']);
        $scores['speaking'] = 59;
        $this->assertNull($this->outcome('A1', $scores)['cefr']);
        $skills = array_map(fn ($s) => ['score' => 90, 'level' => 'B1'], $scores);
        $skills['speaking']['level'] = 'A2';
        $this->assertNull(app(OutcomeResolver::class)->resolveAt('B1', $skills)['cefr']);
    }

    public function test_read_aloud_alignment_counts_words_read_in_order(): void
    {
        $reference = ReadAloudScorer::words('Ich arbeite seit drei Jahren im Krankenhaus.');
        $spoken = ReadAloudScorer::words('ich arbeite äh seit drei jahren im kranken haus');

        $aligned = ReadAloudScorer::alignedCount($reference, $spoken);

        $this->assertSame(6, $aligned['count']);
        $this->assertSame(['krankenhaus'], $aligned['missed']);
    }

    public function test_digits_from_speech_recognition_match_spelled_out_numbers(): void
    {
        // Whisper prints "12-18" and "38"; the text says "zwölf bis achtzehn" and "achtunddreißig".
        $reference = ReadAloudScorer::words('Zimmer zwölf bis achtzehn, über achtunddreißig Grad.');
        $spoken = ReadAloudScorer::words('Zimmer 12-18, über 38 Grad');

        $this->assertSame(count($reference), ReadAloudScorer::alignedCount($reference, $spoken)['count']);
        $this->assertSame('einundzwanzig', GermanNumbers::words(21));
        $this->assertSame('zweitausendvierzehn', GermanNumbers::words(2014));
        $this->assertSame('eins', GermanNumbers::words(1));
    }

    public function test_paragraphs_glued_by_the_model_are_separated_again(): void
    {
        $this->assertSame("Hallo zusammen!\n\nMein Name ist Lena.", ItemShape::tidy('Hallo zusammen!Mein Name ist Lena.'));
        $this->assertSame('Ich bin z. B. hier.', ItemShape::tidy('Ich bin z. B. hier.'));
    }

    public function test_key_scoring_for_questions_and_forms(): void
    {
        $questions = new LanguageTestItem(['task_type' => 'multiple_choice', 'answer_key' => ['q1' => 'a', 'q2' => 'c']]);
        $this->assertSame(50, app(KeyScorer::class)->score($questions, ['answers' => ['q1' => 'a', 'q2' => 'b']])['score']);
        $this->assertSame(0, app(KeyScorer::class)->score($questions, null)['score']);

        $form = new LanguageTestItem(['task_type' => 'form_fill', 'answer_key' => ['f1' => ['Berlin'], 'f2' => ['12', 'zwölf']]]);
        $result = app(KeyScorer::class)->score($form, ['fields' => ['f1' => '  berlin. ', 'f2' => 'Zwölf']]);
        $this->assertSame(100, $result['score']);
    }

    public function test_a_criterion_level_maps_to_its_band_on_the_exam(): void
    {
        $this->assertSame([60, 84], ProductiveGrader::band('B1', 'B1'));
        $this->assertSame([40, 59], ProductiveGrader::band('A2', 'B1'));
        $this->assertSame([0, 39], ProductiveGrader::band('A1', 'B1'));
        $this->assertSame([85, 100], ProductiveGrader::band('C2', 'B1'));
        $this->assertSame([0, 59], ProductiveGrader::band('below_A1', 'A1'));
        $this->assertSame([0, 39], ProductiveGrader::band('below_A1', 'A2'));
        $this->assertSame([60, 100], ProductiveGrader::band('C2', 'C2'));
    }

    /** @param  array<string, string>  $levels */
    private function gradingRun(array $levels, int $score, int $task = 80): ?array
    {
        $raw = [
            'language_ok' => true, 'on_topic' => true,
            'task_achievement' => ['score' => $task, 'evidence' => [], 'comment' => ''],
            'criteria' => array_map(fn ($c, $l) => ['criterion' => $c, 'level' => $l, 'score' => $score, 'evidence' => [], 'comment' => ''], array_keys($levels), $levels),
            'strengths' => [], 'weaknesses' => [],
        ];
        $grader = app(ProductiveGrader::class);

        return (new \ReflectionMethod($grader, 'readRun'))->invoke($grader, $raw, ProductiveGrader::WRITING_CRITERIA, false, 'B1');
    }

    public function test_a_score_cannot_contradict_the_level_the_grader_gave(): void
    {
        // Rated B1 on a B1 exam but scored 45: held at the bottom of the B1 band, so it passes.
        $run = $this->gradingRun(['coherence' => 'B1', 'vocabulary' => 'B1', 'grammar' => 'B1'], 45);
        $this->assertSame(60, $run['criteria']['grammar']['score']);
        $this->assertSame('B1', $run['criteria']['grammar']['level']);
        $this->assertSame(60, $run['score']); // language mean 60, under the task cap of 80

        // Rated A2 but scored 75: held at the top of the A2 band, below the pass mark.
        $run = $this->gradingRun(['coherence' => 'A2', 'vocabulary' => 'A2', 'grammar' => 'A2'], 75);
        $this->assertSame(59, $run['criteria']['vocabulary']['score']);
        // Content (80) must not lift language a whole level below over the pass mark.
        $this->assertSame(59, $run['score']);
    }

    public function test_task_achievement_still_caps_a_well_written_answer(): void
    {
        $run = $this->gradingRun(['coherence' => 'B2', 'vocabulary' => 'B2', 'grammar' => 'B2'], 90, task: 30);
        $this->assertSame(30, $run['score']);
    }

    public function test_a_grading_without_levels_is_incomplete(): void
    {
        $this->assertNull($this->gradingRun(['coherence' => 'B1', 'vocabulary' => 'B1', 'grammar' => 'fluent'], 70));
    }
}
