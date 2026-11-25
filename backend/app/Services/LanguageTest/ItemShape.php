<?php

namespace App\Services\LanguageTest;

/**
 * The stored shape of a bank item, per task family, and the checks an item
 * must pass before it can be approved — whether Gemini wrote it or an
 * administrator edited it.
 *
 * Stored content by family:
 *  - questions: {stimulus | script[{speaker,text}], options?[{id,label}] (shared,
 *               matching only), questions[{id,prompt,options?}], explanations{qid:text}}
 *               answer_key {qid: option id}
 *  - form:      {stimulus, fields[{id,label}]}            answer_key {field id: [accepted]}
 *  - read_aloud:{text}
 *  - writing:   {situation, instructions, points[], min_words, max_words}
 *  - oral:      {situation, instructions, points[], prep_seconds, answer_seconds}
 */
class ItemShape
{
    public const TRUE_FALSE_OPTIONS = [
        ['id' => 'r', 'label' => 'Richtig'],
        ['id' => 'f', 'label' => 'Falsch'],
    ];

    /** Stimulus length outside [min × this, max × MAX_SLACK] is a defect, not a style choice. */
    private const MIN_SLACK = 0.6;

    private const MAX_SLACK = 1.4;

    public function __construct(private readonly ExamBlueprint $blueprint) {}

    /**
     * Turn the generator's JSON (answers inline, the way a model writes them)
     * into stored content + a separate answer key.
     *
     * @param  array<string, mixed>  $raw
     * @param  array<string, mixed>  $task  ExamBlueprint::task()
     * @return array{title: string, content: array<string, mixed>, answer_key: array<string, mixed>|null}
     */
    public function fromGenerated(string $taskType, array $task, array $raw): array
    {
        $family = $this->blueprint->family($taskType);
        $title = trim((string) ($raw['title'] ?? ''));

        return match ($family) {
            'questions' => ['title' => $title, ...$this->questionsFrom($taskType, $task, $raw)],
            'form' => ['title' => $title, ...$this->formFrom($raw)],
            'read_aloud' => ['title' => $title, 'content' => ['text' => self::tidy((string) ($raw['text'] ?? ''))], 'answer_key' => null],
            'writing' => ['title' => $title, 'content' => [
                ...$this->taskFrom($raw),
                'min_words' => $task['words'][0] ?? null,
                'max_words' => $task['words'][1] ?? null,
            ], 'answer_key' => null],
            'oral' => ['title' => $title, 'content' => [
                ...$this->taskFrom($raw),
                'prep_seconds' => $task['prep_seconds'] ?? 30,
                'answer_seconds' => $task['answer_seconds'] ?? 60,
            ], 'answer_key' => null],
        };
    }

    /**
     * Everything wrong with an item, as sentences an administrator can act on.
     * Empty means it may be approved.
     *
     * @param  array<string, mixed>  $content
     * @param  array<string, mixed>|null  $answerKey
     * @param  array<string, mixed>  $task  ExamBlueprint::task()
     * @return list<string>
     */
    public function problems(string $taskType, array $task, array $content, ?array $answerKey): array
    {
        return match ($this->blueprint->family($taskType)) {
            'questions' => $this->questionProblems($taskType, $task, $content, $answerKey ?? []),
            'form' => $this->formProblems($task, $content, $answerKey ?? []),
            'read_aloud' => $this->lengthProblems('Text', (string) ($content['text'] ?? ''), $task),
            'writing', 'oral' => $this->taskProblems($content),
        };
    }

    /**
     * Models sometimes drop the line break between paragraphs and return
     * "…zusammen!Mein Name…". A sentence end glued to a capital letter never
     * happens in real text, so it is restored as a paragraph break.
     */
    public static function tidy(string $text): string
    {
        $text = str_replace(["\r\n", "\r"], "\n", trim($text));

        return (string) preg_replace('/([.!?…])(?=\p{Lu})/u', "$1\n\n", $text);
    }

    public static function wordCount(string $text): int
    {
        return count(preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY) ?: []);
    }

    /** @param  array<string, mixed>  $content */
    public static function stimulusText(array $content): string
    {
        if (! empty($content['script']) && is_array($content['script'])) {
            return implode(' ', array_map(fn ($line) => (string) ($line['text'] ?? ''), $content['script']));
        }

        return (string) ($content['stimulus'] ?? '');
    }

    // ── normalisation ────────────────────────────────────────────────────

    private function questionsFrom(string $taskType, array $task, array $raw): array
    {
        $content = [];
        if ($task['skill'] === 'listening') {
            $content['script'] = array_values(array_filter(array_map(
                fn ($line) => ['speaker' => trim((string) ($line['speaker'] ?? '')), 'text' => trim((string) ($line['text'] ?? ''))],
                $raw['script'] ?? [],
            ), fn ($line) => $line['text'] !== ''));
        } else {
            $content['stimulus'] = self::tidy((string) ($raw['stimulus'] ?? ''));
        }

        if ($taskType === 'matching') {
            $content['options'] = $this->options($raw['options'] ?? []);
        }

        $questions = [];
        $key = [];
        $explanations = [];
        foreach (array_values($raw['questions'] ?? []) as $i => $q) {
            $id = 'q'.($i + 1);
            $question = ['id' => $id, 'prompt' => trim((string) ($q['prompt'] ?? ''))];

            if ($taskType === 'true_false') {
                $question['options'] = self::TRUE_FALSE_OPTIONS;
                $answer = $this->trueFalse($q['answer'] ?? null);
            } elseif ($taskType === 'matching') {
                $answer = trim((string) ($q['answer'] ?? ''));
            } else {
                $question['options'] = $this->options($q['options'] ?? []);
                $answer = trim((string) ($q['answer'] ?? ''));
            }

            $questions[] = $question;
            $key[$id] = $answer;
            if (filled($q['explanation'] ?? null)) {
                $explanations[$id] = trim((string) $q['explanation']);
            }
        }

        $content['questions'] = $questions;
        $content['explanations'] = $explanations;

        return ['content' => $content, 'answer_key' => $key];
    }

    private function formFrom(array $raw): array
    {
        $fields = [];
        $key = [];
        foreach (array_values($raw['fields'] ?? []) as $i => $field) {
            $id = 'f'.($i + 1);
            $fields[] = ['id' => $id, 'label' => trim((string) ($field['label'] ?? ''))];
            $key[$id] = array_values(array_filter(array_map(
                fn ($v) => trim((string) $v),
                (array) ($field['accepted'] ?? []),
            ), fn ($v) => $v !== ''));
        }

        return [
            'content' => ['stimulus' => self::tidy((string) ($raw['stimulus'] ?? '')), 'fields' => $fields],
            'answer_key' => $key,
        ];
    }

    private function taskFrom(array $raw): array
    {
        return [
            'situation' => self::tidy((string) ($raw['situation'] ?? '')),
            'instructions' => trim((string) ($raw['instructions'] ?? '')),
            'points' => array_values(array_filter(array_map(
                fn ($p) => trim((string) $p),
                (array) ($raw['points'] ?? []),
            ), fn ($p) => $p !== '')),
        ];
    }

    /** @return list<array{id: string, label: string}> */
    private function options(array $raw): array
    {
        $out = [];
        foreach (array_values($raw) as $i => $option) {
            $out[] = [
                'id' => trim((string) ($option['id'] ?? '')) ?: chr(ord('a') + $i),
                'label' => trim((string) ($option['label'] ?? '')),
            ];
        }

        return $out;
    }

    private function trueFalse(mixed $answer): string
    {
        $value = mb_strtolower(trim((string) (is_bool($answer) ? ($answer ? 'r' : 'f') : $answer)));

        return in_array($value, ['r', 'richtig', 'true', 'wahr', 'ja'], true) ? 'r' : 'f';
    }

    // ── validation ───────────────────────────────────────────────────────

    private function questionProblems(string $taskType, array $task, array $content, array $key): array
    {
        $problems = [];

        if ($task['skill'] === 'listening') {
            $script = $content['script'] ?? [];
            if (! is_array($script) || $script === []) {
                $problems[] = 'The listening script is empty.';
            } else {
                $speakers = array_unique(array_map(fn ($l) => $l['speaker'] ?? '', $script));
                if (count($speakers) > 2) {
                    $problems[] = 'A listening script may have at most two speakers (speech synthesis limit).';
                }
            }
        } elseif (trim((string) ($content['stimulus'] ?? '')) === '') {
            $problems[] = 'The reading text is empty.';
        }

        // For matching, what the candidate reads is mostly the ads and the
        // situations, not the one-line instruction above them.
        $measured = $taskType === 'matching'
            ? implode(' ', [self::stimulusText($content), ...array_column($content['options'] ?? [], 'label'), ...array_column($content['questions'] ?? [], 'prompt')])
            : self::stimulusText($content);
        $problems = [...$problems, ...$this->lengthProblems('Text', $measured, $task)];

        $questions = $content['questions'] ?? [];
        $expected = (int) ($task['questions'] ?? 0);
        if (count($questions) !== $expected) {
            $problems[] = sprintf('Expected %d questions, found %d.', $expected, count($questions));
        }

        $shared = $taskType === 'matching' ? ($content['options'] ?? []) : null;
        if ($shared !== null && count($shared) < count($questions)) {
            $problems[] = 'Matching needs at least as many options as situations.';
        }

        $ids = [];
        foreach ($questions as $q) {
            $id = $q['id'] ?? '';
            if ($id === '' || isset($ids[$id])) {
                $problems[] = 'Every question needs a unique id.';

                continue;
            }
            $ids[$id] = true;

            if (trim((string) ($q['prompt'] ?? '')) === '') {
                $problems[] = "Question {$id} has no text.";
            }

            $options = $shared ?? ($q['options'] ?? []);
            if (count($options) < 2) {
                $problems[] = "Question {$id} needs at least two options.";
            }
            foreach ($options as $option) {
                if (trim((string) ($option['label'] ?? '')) === '') {
                    $problems[] = "Question {$id} has an empty option.";
                    break;
                }
            }

            $optionIds = array_map(fn ($o) => $o['id'] ?? null, $options);
            if (! in_array($key[$id] ?? null, $optionIds, true)) {
                $problems[] = "Question {$id}: the answer key does not point to one of its options.";
            }
        }

        return $problems;
    }

    private function formProblems(array $task, array $content, array $key): array
    {
        $problems = [];
        if (trim((string) ($content['stimulus'] ?? '')) === '') {
            $problems[] = 'The text for the form is empty.';
        }
        $problems = [...$problems, ...$this->lengthProblems('Text', (string) ($content['stimulus'] ?? ''), $task)];

        $fields = $content['fields'] ?? [];
        if (count($fields) !== (int) ($task['questions'] ?? 0)) {
            $problems[] = sprintf('Expected %d form fields, found %d.', $task['questions'] ?? 0, count($fields));
        }
        foreach ($fields as $field) {
            $id = $field['id'] ?? '';
            if (trim((string) ($field['label'] ?? '')) === '') {
                $problems[] = "Field {$id} has no label.";
            }
            if (empty($key[$id])) {
                $problems[] = "Field {$id} has no accepted answer.";
            }
        }

        return $problems;
    }

    private function taskProblems(array $content): array
    {
        $problems = [];
        if (trim((string) ($content['situation'] ?? '')) === '') {
            $problems[] = 'The task has no situation.';
        }
        if (empty($content['points'])) {
            $problems[] = 'The task lists no content points.';
        }

        return $problems;
    }

    private function lengthProblems(string $what, string $text, array $task): array
    {
        [$min, $max] = $task['words'] ?? [null, null];
        if (! $min || ! $max) {
            return [];
        }

        $words = self::wordCount($text);
        if ($words < $min * self::MIN_SLACK || $words > $max * self::MAX_SLACK) {
            return [sprintf('%s is %d words; this level expects %d–%d.', $what, $words, $min, $max)];
        }

        return [];
    }
}
