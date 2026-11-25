<?php

namespace App\Services\LanguageTest;

use App\Models\LanguageTest;
use App\Models\LanguageTestResponse;
use App\Services\LanguageAssessment\LanguageLevelReconciler;
use App\Services\Notifications;
use Illuminate\Support\Facades\DB;

/** Publish complete results (or hold them for review at the levels configured); award only a demonstrated exam level. */
class ExamFinalizer
{
    public function __construct(
        private readonly OutcomeResolver $outcomes,
        private readonly SectionScorer $scorer,
        private readonly LanguageLevelReconciler $reconciler,
        private readonly Notifications $notifications,
    ) {}

    public function maybeFinalize(LanguageTest $test, bool $reassess = false): void
    {
        DB::transaction(function () use ($test, $reassess) {
            $test = LanguageTest::query()->lockForUpdate()->find($test->id);
            if (! $test || (! $reassess && ($test->status !== 'scoring' || ! $test->phaseOneComplete()))
                || ($reassess && ($test->status !== 'validated' || $test->reviewed_by_id !== null))) {
                return;
            }

            $responses = $test->responses()->with('item')->get();
            $oral = $responses->where('section', 'oral');
            if (! $reassess && $oral->contains(fn ($r) => in_array($r->status, ['pending', 'answered', 'grading'], true))) {
                return;
            }

            $level = $test->exam_level;
            $oralLevel = $test->sections['oral']['level'] ?? $level;
            $oralScore = $this->scorer->score($responses, 'oral');
            $readAloud = $this->scorer->score($responses, 'read_aloud');
            $speaking = $oralScore;
            $scores = [
                'reading' => $this->scorer->score($responses, 'reading'),
                'listening' => $this->scorer->score($responses, 'listening'),
                'writing' => $this->scorer->score($responses, 'writing'),
                'speaking' => $speaking,
                'read_aloud' => $readAloud,
            ];

            $verdict = $this->outcomes->resolveAt($level, [
                'reading' => ['score' => $scores['reading'], 'level' => $level],
                'listening' => ['score' => $scores['listening'], 'level' => $level],
                'writing' => ['score' => $scores['writing'], 'level' => $level],
                'speaking' => ['score' => $speaking, 'level' => $oralLevel],
            ]);

            if ($responses->contains(fn ($r) => ($r->evaluation['guard'] ?? null) === 'no_recording')) {
                $verdict['cefr'] = null;
                $verdict['outcome'] = 'not_demonstrated';
            }

            $integrity = $test->integrity ?? [];
            $flags = $integrity['flags'] ?? [];
            $failed = $responses->contains(fn ($r) => $r->status === 'failed');
            $coverage = collect($test->blueprint)->every(function ($section, $name) use ($responses) {
                $expected = array_count_values(array_column($section['tasks'], 'task_type'));
                $actual = $responses->where('section', $name)->countBy(fn ($r) => $r->item->task_type)->all();
                ksort($expected);
                ksort($actual);

                return $expected === $actual;
            });
            $uncertain = $responses->contains(fn ($r) => ! $this->scorer->reliable($r));
            $complete = $coverage && ! $failed && ! $uncertain && ! in_array(null, $scores, true) && $oral->isNotEmpty();
            if (! $complete) {
                $flags[] = 'skill_not_scored';
            }
            if ($oralScore === null) {
                $flags[] = 'oral_not_scored';
            }
            if ($failed) {
                $flags[] = 'grading_failed';
            }
            if ($uncertain) {
                $flags[] = 'grader_disagreement';
            }
            if ($oral->contains(fn (LanguageTestResponse $r) => in_array($r->evaluation['guard'] ?? null, ['no_recording', 'too_short'], true))) {
                $flags[] = 'oral_missing';
            }
            if (($integrity['tab_hidden'] ?? 0) >= 3 || ($integrity['paste_blocked'] ?? 0) >= 3 || ! empty($integrity['too_fast'])) {
                $flags[] = 'integrity';
            }
            $flags = array_values(array_unique($flags));

            $summary = ['strengths' => [], 'weaknesses' => [], ...($test->summary ?? [])];
            foreach ($oral as $r) {
                $summary['strengths'] = [...$summary['strengths'], ...($r->evaluation['strengths'] ?? [])];
                $summary['weaknesses'] = [...$summary['weaknesses'], ...($r->evaluation['weaknesses'] ?? [])];
            }
            $summary['strengths'] = array_values(array_slice(array_unique($summary['strengths']), 0, 6));
            $summary['weaknesses'] = array_values(array_slice(array_unique($summary['weaknesses']), 0, 6));
            $summary['speaking_parts'] = ['read_aloud' => $readAloud, 'oral' => $oralScore, 'oral_level' => $oralLevel];

            $sections = $test->sections;
            $sections['oral'] = [...($sections['oral'] ?? []), 'status' => 'done'];

            $summary['scoring_version'] = 2;
            // Levels the AI cannot yet grade reliably wait for an administrator;
            // the AI's verdict is kept as ai_cefr and nothing reaches the profile.
            $review = $complete && in_array($level, (array) config('language_test.review_levels'), true);
            $publish = $complete && ! $review;
            $test->update([
                'skill_scores' => $scores,
                'skill_results' => $verdict['skill_results'],
                'outcome' => $complete ? $verdict['outcome'] : null,
                'ai_cefr' => $complete ? $verdict['cefr'] : null,
                'final_cefr' => $publish ? $verdict['cefr'] : null,
                'summary' => $summary,
                'integrity' => [...$integrity, 'flags' => $flags],
                'needs_attention' => $test->needs_attention || $flags !== [],
                'sections' => $sections,
                'current_section' => null,
                // `validated` denotes a published exam result; `awaiting_review` one an administrator must approve.
                'status' => $publish ? 'validated' : ($review ? 'awaiting_review' : 'failed'),
                'completed_at' => $reassess ? $test->completed_at : now(),
                'published_at' => $publish ? ($test->published_at ?? now()) : null,
            ]);

            if ($publish) {
                $this->reconciler->applyValidatedTest($test->fresh('candidateProfile'));
            } elseif ($reassess) {
                $this->reconciler->removeTestResult($test->fresh('candidateProfile'));
            }
            // A result under review is announced once an administrator decides.
            if (! $reassess && ! $review) {
                DB::afterCommit(fn () => $this->notifications->languageTestReviewed($test->fresh()));
            }
        });
    }
}
