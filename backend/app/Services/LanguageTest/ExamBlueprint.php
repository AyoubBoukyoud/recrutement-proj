<?php

namespace App\Services\LanguageTest;

use InvalidArgumentException;

/**
 * Read access to the level exams defined in config/language_test.php.
 *
 * One exam per CEFR level: the blueprint says which sections the B1 exam
 * has, which task type each task is, how many questions and how many words.
 * Nothing else in the exam code hard-codes a level's shape.
 */
class ExamBlueprint
{
    public const SKILLS = ['reading', 'listening', 'read_aloud', 'writing', 'oral'];

    /** @return list<string> */
    public function levels(): array
    {
        return config('language_test.levels');
    }

    /** @return list<string> */
    public function languages(): array
    {
        return config('language_test.languages');
    }

    /** @return array<string, array<string, mixed>> section => spec */
    public function forLevel(string $level): array
    {
        $blueprint = config("language_test.blueprints.{$level}");
        if (! is_array($blueprint)) {
            throw new InvalidArgumentException("No exam blueprint for level {$level}.");
        }

        return $blueprint;
    }

    /** @return array<string, mixed> */
    public function taskType(string $taskType): array
    {
        $spec = config("language_test.task_types.{$taskType}");
        if (! is_array($spec)) {
            throw new InvalidArgumentException("Unknown task type {$taskType}.");
        }

        return $spec;
    }

    /** @return list<string> */
    public function taskTypeNames(): array
    {
        return array_keys(config('language_test.task_types'));
    }

    public function family(string $taskType): string
    {
        return $this->taskType($taskType)['family'];
    }

    public function descriptor(string $level): string
    {
        return (string) config("language_test.descriptors.{$level}");
    }

    /** @return list<string> */
    public function sectors(): array
    {
        return config('language_test.sectors');
    }

    /**
     * The task spec (questions, words, stimulus, timers) a bank item of this
     * kind must satisfy at this level, with the section-wide settings that
     * matter to it (listening plays) folded in. Null when the level's exam
     * has no such task — the generator refuses to make items nobody will sit.
     *
     * @return array<string, mixed>|null
     */
    public function task(string $level, string $skill, string $taskType): ?array
    {
        $section = $this->forLevel($level)[$skill] ?? null;
        if (! $section) {
            return null;
        }

        foreach ($section['tasks'] as $task) {
            if ($task['task_type'] === $taskType) {
                return [
                    ...$task,
                    'skill' => $skill,
                    'level' => $level,
                    'plays' => $section['plays'] ?? null,
                ];
            }
        }

        return null;
    }

    /**
     * How many approved items of each (skill, task_type) one exam of this
     * level consumes. Drives the bank coverage table.
     *
     * @return list<array{skill: string, task_type: string, per_exam: int}>
     */
    public function requirements(string $level): array
    {
        $needed = [];
        foreach ($this->forLevel($level) as $skill => $section) {
            foreach ($section['tasks'] as $task) {
                $key = $skill.'|'.$task['task_type'];
                $needed[$key] ??= ['skill' => $skill, 'task_type' => $task['task_type'], 'per_exam' => 0];
                $needed[$key]['per_exam']++;
            }
        }

        return array_values($needed);
    }

    /**
     * Internal consistency of the config: every level has every skill, every
     * task names a known task type that is allowed in that skill. Returned as
     * messages rather than thrown so a test can list them all at once.
     *
     * @return list<string>
     */
    public function problems(): array
    {
        $problems = [];
        foreach ($this->levels() as $level) {
            $blueprint = config("language_test.blueprints.{$level}");
            if (! is_array($blueprint)) {
                $problems[] = "{$level}: missing blueprint";

                continue;
            }

            foreach (self::SKILLS as $skill) {
                if (empty($blueprint[$skill]['tasks'])) {
                    $problems[] = "{$level}: no {$skill} tasks";
                }
            }

            foreach ($blueprint as $skill => $section) {
                foreach ($section['tasks'] ?? [] as $i => $task) {
                    $type = config('language_test.task_types.'.($task['task_type'] ?? ''));
                    if (! $type) {
                        $problems[] = "{$level}.{$skill}[{$i}]: unknown task type";

                        continue;
                    }
                    if (! in_array($skill, $type['skills'], true)) {
                        $problems[] = "{$level}.{$skill}[{$i}]: {$task['task_type']} not allowed in {$skill}";
                    }
                    if (in_array($type['family'], ['questions', 'form'], true) && empty($task['questions'])) {
                        $problems[] = "{$level}.{$skill}[{$i}]: needs a question count";
                    }
                    if (in_array($type['family'], ['questions', 'form', 'read_aloud', 'writing'], true) && empty($task['words'])) {
                        $problems[] = "{$level}.{$skill}[{$i}]: needs a word range";
                    }
                    if ($type['family'] === 'oral' && (empty($task['prep_seconds']) || empty($task['answer_seconds']))) {
                        $problems[] = "{$level}.{$skill}[{$i}]: needs prep and answer timers";
                    }
                }
            }
        }

        return $problems;
    }
}
