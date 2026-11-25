<?php

namespace App\Services\LanguageTest;

use App\Models\LanguageTestItem;
use App\Services\Gemini\GeminiClient;
use InvalidArgumentException;
use RuntimeException;

/**
 * Writes draft exam items for one level with Gemini.
 *
 * Items are generated ahead of time into the bank and only reach candidates
 * after an administrator approves them — never generated live for a sitting.
 * Each draft is checked by ItemShape before it is saved; a draft that fails
 * is reported back, not stored, so the review queue only holds items worth
 * reading.
 */
class ItemGenerator
{
    private const OPTION = [
        'type' => 'object',
        'properties' => ['id' => ['type' => 'string'], 'label' => ['type' => 'string']],
        'required' => ['id', 'label'],
    ];

    public function __construct(
        private readonly GeminiClient $gemini,
        private readonly ExamBlueprint $blueprint,
        private readonly ItemShape $shape,
    ) {}

    public function isConfigured(): bool
    {
        return $this->gemini->isConfigured();
    }

    /**
     * @return array{item: LanguageTestItem|null, problems: list<string>}
     */
    public function generate(string $language, string $level, string $skill, string $taskType, string $sector = 'general'): array
    {
        $task = $this->blueprint->task($level, $skill, $taskType);
        if (! $task) {
            throw new InvalidArgumentException("The {$level} exam has no {$skill} task of type {$taskType}.");
        }
        if (! in_array($sector, $this->blueprint->sectors(), true)) {
            throw new InvalidArgumentException("Unknown sector {$sector}.");
        }
        if (! $this->gemini->isConfigured()) {
            throw new RuntimeException('GEMINI_API_KEY is not set; items cannot be generated.');
        }

        $raw = $this->gemini->generateJson(
            [GeminiClient::textPart($this->prompt($language, $level, $taskType, $task, $sector))],
            $this->schema($taskType, $task),
            'Gemini exam item generation',
        );

        if ($raw === null) {
            return ['item' => null, 'problems' => ['Gemini returned no usable answer (see the log).']];
        }

        $shaped = $this->shape->fromGenerated($taskType, $task, $raw);
        $problems = $this->shape->problems($taskType, $task, $shaped['content'], $shaped['answer_key']);
        if ($problems !== []) {
            return ['item' => null, 'problems' => $problems];
        }

        if ($skill === 'listening' && $task['plays']) {
            $shaped['content']['plays'] = $task['plays'];
        }

        $item = LanguageTestItem::create([
            'language' => $language,
            'cefr_level' => $level,
            'skill' => $skill,
            'task_type' => $taskType,
            'sector' => $sector,
            'title' => mb_substr($shaped['title'] ?: ucfirst(str_replace('_', ' ', $taskType)), 0, 255),
            'content' => $shaped['content'],
            'answer_key' => $shaped['answer_key'],
            'status' => 'draft',
            'generated_by' => (string) config('services.gemini.model'),
        ]);

        return ['item' => $item, 'problems' => []];
    }

    /** @param  array<string, mixed>  $task */
    private function prompt(string $language, string $level, string $taskType, array $task, string $sector): string
    {
        $type = $this->blueprint->taskType($taskType);
        $languageName = ['de' => 'German', 'fr' => 'French', 'en' => 'English'][$language] ?? $language;
        $words = isset($task['words']) ? "{$task['words'][0]}–{$task['words'][1]} words" : null;
        $sectorLine = $sector === 'general'
            ? 'Everyday and general working-life topics.'
            : "Set the content in the {$sector} sector (a candidate seeking work in Germany in that field), without needing specialist knowledge to answer.";

        $lines = [
            "You write original items for a {$languageName} language exam at CEFR level {$level}, in the style of the Goethe-Institut and telc exams of that level.",
            "Level {$level}: ".$this->blueprint->descriptor($level),
            "Section: {$task['skill']}. Task type: {$taskType} — {$type['brief']}",
            isset($task['stimulus']) ? "What this task contains at {$level}: {$task['stimulus']}" : null,
            $words ? ($type['family'] === 'writing'
                ? "Expected answer length from the candidate: {$words}."
                : "Length of the text: {$words}.") : null,
            isset($task['questions']) ? "Number of questions/fields: exactly {$task['questions']}." : null,
            "Theme: {$sectorLine}",
            '',
            'Rules — follow exactly:',
            "- Everything the candidate reads or hears is in {$languageName}. `explanation` fields are in English (for the reviewer).",
            '- The content is original. Never copy or paraphrase a published exam. Use invented names of people, companies and places, no real brands.',
            "- Vocabulary and grammar are pitched exactly at {$level}: not easier, not harder.",
            '- Culturally neutral and respectful; no politics, religion, violence or stereotypes.',
            '- Separate paragraphs of any text with a blank line.',
        ];

        $lines = [...$lines, ...match ($type['family']) {
            'questions' => [
                '- Every question is answerable only from the text, with exactly one correct answer; distractors are plausible but clearly wrong on reading the text.',
                '- Questions follow the order of the text. Do not reuse the text\'s exact wording in the correct option at levels B1 and above.',
                $taskType === 'true_false' ? '- `answer` is "r" (richtig) or "f" (falsch); balance both. Leave `options` empty.' : null,
                $taskType === 'matching' ? '- Put the shared list in `options` (ids a, b, c …), with more options than questions; each question\'s `answer` is an option id; leave each question\'s `options` empty.' : null,
                in_array($taskType, ['multiple_choice', 'gap_text'], true) ? '- Each question has three options with ids a, b, c; `answer` is the correct id.' : null,
                $taskType === 'gap_text' ? '- Mark gaps in the text as [1], [2] … and make question n the gap [n]; its `prompt` is "Lücke n".' : null,
                $task['skill'] === 'listening'
                    ? '- This is a listening item: write `script` as natural spoken language (fillers, contractions where natural), with at most two speakers labelled by first name or role. Leave `stimulus` empty.'
                    : '- Write the reading text in `stimulus`; leave `script` empty.',
            ],
            'form' => [
                '- `stimulus` is a short text about a person; `fields` are the form fields, each with every acceptable spelling of the answer in `accepted` (e.g. "12" and "zwölf").',
            ],
            'read_aloud' => [
                '- `text` is the passage to read aloud: well-formed, without abbreviations the candidate could not pronounce, numbers written as the level expects.',
            ],
            'writing' => [
                '- `situation` describes what the candidate is reacting to (a message received, a notice, a statement); `instructions` say who they write to and in which register; `points` are 3 content points the answer must cover.',
            ],
            'oral' => [
                "- This is shown on screen the moment the camera starts: `situation` sets the scene in 1–3 sentences, `instructions` say what to do out loud, `points` are 2–4 points to cover. The candidate has {$task['prep_seconds']}s to prepare and {$task['answer_seconds']}s to speak.",
            ],
        }];

        $lines[] = '- `title` is a short German title for the reviewer list.';

        return implode("\n", array_filter($lines, fn ($l) => $l !== null));
    }

    /** @param  array<string, mixed>  $task */
    private function schema(string $taskType, array $task): array
    {
        return match ($this->blueprint->family($taskType)) {
            'questions' => [
                'type' => 'object',
                'properties' => [
                    'title' => ['type' => 'string'],
                    'stimulus' => ['type' => 'string'],
                    'script' => ['type' => 'array', 'items' => [
                        'type' => 'object',
                        'properties' => ['speaker' => ['type' => 'string'], 'text' => ['type' => 'string']],
                        'required' => ['speaker', 'text'],
                    ]],
                    'options' => ['type' => 'array', 'items' => self::OPTION],
                    'questions' => ['type' => 'array', 'items' => [
                        'type' => 'object',
                        'properties' => [
                            'prompt' => ['type' => 'string'],
                            'options' => ['type' => 'array', 'items' => self::OPTION],
                            'answer' => ['type' => 'string'],
                            'explanation' => ['type' => 'string'],
                        ],
                        'required' => ['prompt', 'options', 'answer', 'explanation'],
                    ]],
                ],
                'required' => ['title', 'stimulus', 'script', 'options', 'questions'],
            ],
            'form' => [
                'type' => 'object',
                'properties' => [
                    'title' => ['type' => 'string'],
                    'stimulus' => ['type' => 'string'],
                    'fields' => ['type' => 'array', 'items' => [
                        'type' => 'object',
                        'properties' => [
                            'label' => ['type' => 'string'],
                            'accepted' => ['type' => 'array', 'items' => ['type' => 'string']],
                        ],
                        'required' => ['label', 'accepted'],
                    ]],
                ],
                'required' => ['title', 'stimulus', 'fields'],
            ],
            'read_aloud' => [
                'type' => 'object',
                'properties' => ['title' => ['type' => 'string'], 'text' => ['type' => 'string']],
                'required' => ['title', 'text'],
            ],
            'writing', 'oral' => [
                'type' => 'object',
                'properties' => [
                    'title' => ['type' => 'string'],
                    'situation' => ['type' => 'string'],
                    'instructions' => ['type' => 'string'],
                    'points' => ['type' => 'array', 'items' => ['type' => 'string']],
                ],
                'required' => ['title', 'situation', 'instructions', 'points'],
            ],
        };
    }
}
