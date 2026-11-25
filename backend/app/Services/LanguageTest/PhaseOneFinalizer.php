<?php

namespace App\Services\LanguageTest;

use App\Models\LanguageTest;
use Illuminate\Support\Facades\DB;

/**
 * Closes Phase 1 once every answer is scored. Skill feedback is available,
 * but no overall CEFR level is established before spontaneous speech.
 *
 * Called after each graded response and after the last section; it does
 * nothing until the last grading has landed, and the row lock makes two
 * jobs finishing together close it only once.
 */
class PhaseOneFinalizer
{
    public function __construct(private readonly OutcomeResolver $outcomes, private readonly SectionScorer $scorer) {}

    public function maybeFinalize(LanguageTest $test): void
    {
        DB::transaction(function () use ($test) {
            $test = LanguageTest::query()->lockForUpdate()->find($test->id);
            // Phase 1 closes once; after the oral, ExamFinalizer takes over.
            if (! $test || $test->status !== 'scoring' || $test->phaseOneComplete()) {
                return;
            }

            $responses = $test->responses()->with('item')->whereIn('section', config('language_test.phase_one_sections'))->get();
            if ($responses->contains(fn ($r) => in_array($r->status, ['pending', 'answered', 'grading'], true))) {
                return;
            }

            $scores = [
                'reading' => $this->scorer->score($responses, 'reading'),
                'listening' => $this->scorer->score($responses, 'listening'),
                'writing' => $this->scorer->score($responses, 'writing'),
                // Reading aloud is diagnostic; spontaneous speaking is not assessed yet.
                'speaking' => null,
                'read_aloud' => $this->scorer->score($responses, 'read_aloud'),
            ];

            $verdict = $this->outcomes->resolve($test->exam_level, $scores);

            $flags = [];
            if (in_array(null, array_intersect_key($scores, array_flip(['reading', 'listening', 'writing', 'read_aloud'])), true)) {
                $flags[] = 'skill_not_scored';
            }
            if ($responses->contains(fn ($r) => $r->status === 'failed')) {
                $flags[] = 'grading_failed';
            }
            if ($responses->contains(fn ($r) => ($r->evaluation['disagreement'] ?? false) === true)) {
                $flags[] = 'grader_disagreement';
            }
            $integrity = $test->integrity ?? [];
            if (($integrity['tab_hidden'] ?? 0) >= 3 || ($integrity['paste_blocked'] ?? 0) >= 3 || ! empty($integrity['too_fast'])) {
                $flags[] = 'integrity';
            }

            $sections = $test->sections ?? [];
            $sections['oral'] = ['status' => 'pending'];

            $test->update([
                'skill_scores' => $scores,
                'skill_results' => $verdict['skill_results'],
                'outcome' => $verdict['outcome'],
                'provisional_cefr' => null,
                'summary' => [...$this->summary($responses), 'phase_one_completed' => true],
                'needs_attention' => $test->needs_attention || $flags !== [],
                'integrity' => [...$integrity, 'flags' => array_values(array_unique([...($integrity['flags'] ?? []), ...$flags]))],
                'status' => 'in_progress',
                'current_section' => 'oral',
                'sections' => $sections,
            ]);
        });
    }

    /** @return array{strengths: list<string>, weaknesses: list<string>} */
    private function summary($responses): array
    {
        $strengths = [];
        $weaknesses = [];
        foreach ($responses as $r) {
            $strengths = [...$strengths, ...($r->evaluation['strengths'] ?? [])];
            $weaknesses = [...$weaknesses, ...($r->evaluation['weaknesses'] ?? [])];
        }

        return [
            'strengths' => array_values(array_slice(array_unique($strengths), 0, 5)),
            'weaknesses' => array_values(array_slice(array_unique($weaknesses), 0, 5)),
        ];
    }
}
