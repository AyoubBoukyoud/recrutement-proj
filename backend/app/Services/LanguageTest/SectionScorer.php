<?php

namespace App\Services\LanguageTest;

use App\Models\LanguageTestResponse;
use Illuminate\Support\Collection;

class SectionScorer
{
    /** Every productive task must pass; a rehearsed introduction cannot mask a failed situation. */
    public function score(Collection $responses, string $section): ?int
    {
        $rows = $responses->where('section', $section);
        if ($rows->isEmpty() || $rows->contains(fn ($r) => $r->status !== 'graded' || $r->score === null)) {
            return null;
        }
        if (in_array($section, ['reading', 'listening'], true)) {
            $total = $rows->sum(fn ($r) => (int) ($r->evaluation['total'] ?? 0));

            return $total > 0 ? (int) round($rows->sum(fn ($r) => (int) ($r->evaluation['correct'] ?? 0)) / $total * 100) : null;
        }

        return (int) $rows->min(function ($r) {
            $runs = $r->evaluation['runs'] ?? [];
            // Apply the task-achievement cap to legacy marks too.
            if ($runs !== []) {
                $taskScores = array_map(fn ($run) => min($run['score'], $run['criteria']['task_achievement']['score'] ?? $run['score']), $runs);

                return min($r->score, (int) round(array_sum($taskScores) / count($taskScores)));
            }

            return $r->score;
        });
    }

    public function reliable(LanguageTestResponse $response): bool
    {
        if (($response->evaluation['disagreement'] ?? false) === true) {
            return false;
        }
        if (config("language_test.task_types.{$response->item->task_type}.scoring") !== 'rubric') {
            return true;
        }
        if (isset($response->evaluation['guard'])) {
            return $response->score === 0;
        }

        return ProductiveGrader::consistentRuns($response->evaluation['runs'] ?? []);
    }
}
