<?php

namespace App\Services\LanguageTest;

/** A failed level-specific exam cannot establish an untested lower level. */
class OutcomeResolver
{
    private const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    private const SKILLS = ['reading', 'listening', 'writing', 'speaking'];

    /** @param array<string, int|null> $scores */
    public function resolve(string $examLevel, array $scores): array
    {
        return $this->resolveAt($examLevel, array_map(fn ($score) => ['score' => $score, 'level' => $examLevel], $scores));
    }

    /** @param array<string, array{score: int|null, level: string}> $skills */
    public function resolveAt(string $examLevel, array $skills): array
    {
        $results = [];
        foreach (self::SKILLS as $skill) {
            $entry = $skills[$skill] ?? ['score' => null, 'level' => $examLevel];
            $results[$skill] = $entry['score'] === null ? null : $this->skillLevel($entry['level'], $entry['score']);
        }
        $complete = count(array_filter(self::SKILLS, fn ($skill) => ($skills[$skill]['score'] ?? null) !== null)) === count(self::SKILLS);
        if (! $complete) {
            return ['skill_results' => $results, 'outcome' => null, 'cefr' => null];
        }
        $passed = collect(self::SKILLS)->every(fn ($skill) => $results[$skill] === $examLevel);
        if (! $passed) {
            return ['skill_results' => $results, 'outcome' => 'not_demonstrated', 'cefr' => null];
        }
        $allHigh = collect(self::SKILLS)->every(fn ($skill) => $skills[$skill]['score'] >= (int) config('language_test.may_be_higher'));

        return [
            'skill_results' => $results,
            'outcome' => $allHigh && $examLevel !== 'C2' ? 'may_be_higher' : 'confirmed',
            'cefr' => $examLevel,
        ];
    }

    public function skillLevel(string $examLevel, int $score): ?string
    {
        return $score >= (int) config('language_test.pass_mark') ? $examLevel : null;
    }

    public static function below(string $level): ?string
    {
        $index = array_search($level, self::ORDER, true);

        return $index > 0 ? self::ORDER[$index - 1] : null;
    }
}
