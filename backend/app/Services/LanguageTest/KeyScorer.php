<?php

namespace App\Services\LanguageTest;

use App\Models\LanguageTestItem;

/**
 * Scores the tasks that have one right answer — reading, listening and the
 * A1 form — by code, against the item's answer key. No AI involved: it is
 * free, instant and gives the same result every time.
 *
 * Answers: questions items → {"answers": {"q1": "b", …}};
 *          form items      → {"fields": {"f1": "Berlin", …}}.
 */
class KeyScorer
{
    /**
     * @param  array<string, mixed>|null  $answer
     * @return array{score: int, correct: int, total: int, detail: array<string, bool>}
     */
    public function score(LanguageTestItem $item, ?array $answer): array
    {
        $key = $item->answer_key ?? [];
        $given = $item->task_type === 'form_fill' ? ($answer['fields'] ?? []) : ($answer['answers'] ?? []);

        $detail = [];
        foreach ($key as $id => $expected) {
            $value = $given[$id] ?? null;
            $detail[$id] = $item->task_type === 'form_fill'
                ? $this->fieldMatches(is_scalar($value) ? (string) $value : '', (array) $expected)
                : is_string($value) && $value === $expected;
        }

        $total = count($detail);
        $correct = count(array_filter($detail));

        return [
            'score' => $total > 0 ? (int) round($correct / $total * 100) : 0,
            'correct' => $correct,
            'total' => $total,
            'detail' => $detail,
        ];
    }

    /** Case, spacing and trailing punctuation never cost a form answer. */
    private function fieldMatches(string $value, array $accepted): bool
    {
        $normal = self::normalize($value);
        if ($normal === '') {
            return false;
        }

        foreach ($accepted as $option) {
            if (self::normalize((string) $option) === $normal) {
                return true;
            }
        }

        return false;
    }

    public static function normalize(string $value): string
    {
        $value = mb_strtolower(trim($value));
        $value = preg_replace('/[\s]+/u', ' ', $value);

        return trim((string) preg_replace('/[.,;:!?"\'()]+/u', '', $value));
    }
}
