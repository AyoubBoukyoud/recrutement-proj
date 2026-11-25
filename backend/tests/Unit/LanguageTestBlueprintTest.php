<?php

namespace Tests\Unit;

use App\Services\LanguageTest\ExamBlueprint;
use App\Services\LanguageTest\ItemShape;
use Tests\TestCase;

class LanguageTestBlueprintTest extends TestCase
{
    private function blueprint(): ExamBlueprint
    {
        return app(ExamBlueprint::class);
    }

    public function test_every_level_has_a_complete_consistent_exam(): void
    {
        $this->assertSame([], $this->blueprint()->problems());
        $this->assertSame(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], $this->blueprint()->levels());
    }

    public function test_the_exams_differ_by_level(): void
    {
        $types = fn (string $level) => array_map(fn ($r) => $r['skill'].'/'.$r['task_type'], $this->blueprint()->requirements($level));

        // A1 writing is a form and a short message; B2 is an opinion text; C2 adds a reformulation.
        $this->assertContains('writing/form_fill', $types('A1'));
        $this->assertNotContains('writing/form_fill', $types('B2'));
        $this->assertContains('writing/opinion_text', $types('B2'));
        $this->assertContains('writing/reformulation', $types('C2'));

        // Longer texts and fewer plays as the level rises.
        $a1 = $this->blueprint()->task('A1', 'read_aloud', 'read_aloud');
        $c1 = $this->blueprint()->task('C1', 'read_aloud', 'read_aloud');
        $this->assertLessThan($c1['words'][0], $a1['words'][1]);
        $this->assertSame(2, $this->blueprint()->task('A1', 'listening', 'true_false')['plays']);
        $this->assertSame(1, $this->blueprint()->task('B2', 'listening', 'true_false')['plays']);
    }

    public function test_requirements_count_items_per_exam(): void
    {
        $b1 = collect($this->blueprint()->requirements('B1'))->keyBy(fn ($r) => $r['skill'].'/'.$r['task_type']);

        $this->assertSame(1, $b1['reading/true_false']['per_exam']);
        $this->assertSame(1, $b1['writing/informal_email']['per_exam']);
        $this->assertNull($this->blueprint()->task('B1', 'writing', 'form_fill'));
    }

    public function test_generated_true_false_is_split_into_content_and_a_hidden_key(): void
    {
        $shape = app(ItemShape::class);
        $task = $this->blueprint()->task('A1', 'reading', 'true_false');

        $shaped = $shape->fromGenerated('true_false', $task, [
            'title' => 'Im Supermarkt',
            'stimulus' => $this->words(80),
            'questions' => array_map(fn ($i) => [
                'prompt' => "Aussage {$i}",
                'options' => [],
                'answer' => $i % 2 ? 'richtig' : 'falsch',
                'explanation' => 'Because the text says so.',
            ], range(1, 5)),
        ]);

        $this->assertSame(['q1' => 'r', 'q2' => 'f', 'q3' => 'r', 'q4' => 'f', 'q5' => 'r'], $shaped['answer_key']);
        $this->assertSame(ItemShape::TRUE_FALSE_OPTIONS, $shaped['content']['questions'][0]['options']);
        $this->assertArrayNotHasKey('answer', $shaped['content']['questions'][0]);
        $this->assertSame([], $shape->problems('true_false', $task, $shaped['content'], $shaped['answer_key']));
    }

    public function test_defects_are_reported_in_plain_sentences(): void
    {
        $shape = app(ItemShape::class);
        $task = $this->blueprint()->task('B1', 'reading', 'multiple_choice');

        $content = [
            'stimulus' => $this->words(40), // B1 wants 250–350
            'questions' => [
                ['id' => 'q1', 'prompt' => 'Was …?', 'options' => [['id' => 'a', 'label' => 'x'], ['id' => 'b', 'label' => 'y']]],
            ],
        ];

        $problems = $shape->problems('multiple_choice', $task, $content, ['q1' => 'c']);

        $this->assertContains('Text is 40 words; this level expects 250–350.', $problems);
        $this->assertContains('Expected 5 questions, found 1.', $problems);
        $this->assertContains('Question q1: the answer key does not point to one of its options.', $problems);
    }

    public function test_matching_uses_one_shared_option_list(): void
    {
        $shape = app(ItemShape::class);
        $task = $this->blueprint()->task('A1', 'reading', 'matching');

        $shaped = $shape->fromGenerated('matching', $task, [
            'title' => 'Anzeigen',
            // A one-line instruction: the length lives in the ads and situations.
            'stimulus' => 'Welche Anzeige passt?',
            'options' => array_map(fn ($id) => ['id' => $id, 'label' => "Anzeige {$id} ".$this->words(8)], ['a', 'b', 'c', 'd', 'e', 'f', 'x']),
            'questions' => array_map(fn ($i) => ['prompt' => "Person {$i} ".$this->words(4), 'options' => [], 'answer' => chr(96 + $i), 'explanation' => ''], range(1, 5)),
        ]);

        $this->assertCount(7, $shaped['content']['options']);
        $this->assertArrayNotHasKey('options', $shaped['content']['questions'][0]);
        $this->assertSame([], $shape->problems('matching', $task, $shaped['content'], $shaped['answer_key']));
    }

    public function test_writing_and_oral_tasks_carry_their_level_limits(): void
    {
        $shape = app(ItemShape::class);

        $writing = $shape->fromGenerated('opinion_text', $this->blueprint()->task('B2', 'writing', 'opinion_text'), [
            'title' => 'Homeoffice', 'situation' => 'Im Forum …', 'instructions' => 'Schreiben Sie …', 'points' => ['a', 'b', 'c'],
        ]);
        $this->assertSame(150, $writing['content']['min_words']);
        $this->assertSame(200, $writing['content']['max_words']);

        $oral = $shape->fromGenerated('oral_introduction', $this->blueprint()->task('A1', 'oral', 'oral_introduction'), [
            'title' => 'Vorstellung', 'situation' => 'Sie sind neu …', 'instructions' => 'Stellen Sie sich vor.', 'points' => ['Name', 'Land'],
        ]);
        $this->assertSame(45, $oral['content']['answer_seconds']);
        $this->assertNull($oral['answer_key']);
    }

    private function words(int $n): string
    {
        return implode(' ', array_fill(0, $n, 'Wort'));
    }
}
