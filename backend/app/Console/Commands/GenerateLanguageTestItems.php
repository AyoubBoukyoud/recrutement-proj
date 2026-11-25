<?php

namespace App\Console\Commands;

use App\Models\LanguageTestItem;
use App\Services\Gemini\GeminiTransientFailure;
use App\Services\LanguageTest\ExamBlueprint;
use App\Services\LanguageTest\ItemGenerator;
use App\Services\LanguageTest\SpeechSynthesizer;
use Illuminate\Console\Command;

/**
 * Fills the level-exam bank with AI-written DRAFTS for administrators to
 * review. Nothing generated here reaches a candidate until it is approved
 * on /admin/tests-langue/banque.
 *
 *   language-test:generate B1                     top up every B1 task to the target
 *   language-test:generate B1 --skill=reading --type=true_false --count=3
 *   language-test:generate B1 --sector=care --audio
 */
class GenerateLanguageTestItems extends Command
{
    protected $signature = 'language-test:generate
        {level : CEFR level of the exam (A1–C2)}
        {--skill= : Only this section (reading, listening, read_aloud, writing, oral)}
        {--type= : Only this task type (needs --skill)}
        {--count= : Exactly this many drafts per task, instead of topping up to the target}
        {--sector=general : Theme the content leans towards}
        {--language=de : Exam language}
        {--audio : Synthesise listening clips right away}';

    protected $description = 'Generate draft items for a level exam with Gemini (admin approval required)';

    public function handle(ExamBlueprint $blueprint, ItemGenerator $generator, SpeechSynthesizer $speech): int
    {
        $level = strtoupper((string) $this->argument('level'));
        $language = (string) $this->option('language');

        if (! in_array($level, $blueprint->levels(), true)) {
            $this->error("Unknown level {$level}.");

            return self::INVALID;
        }
        if (! in_array($language, $blueprint->languages(), true)) {
            $this->error("Language {$language} is not offered.");

            return self::INVALID;
        }
        if (! $generator->isConfigured()) {
            $this->error('GEMINI_API_KEY is not set.');

            return self::FAILURE;
        }

        $tasks = array_filter($blueprint->requirements($level), fn ($r) => (! $this->option('skill') || $r['skill'] === $this->option('skill'))
            && (! $this->option('type') || $r['task_type'] === $this->option('type')));

        if ($tasks === []) {
            $this->error("The {$level} exam has no matching task.");

            return self::INVALID;
        }

        $target = (int) config('language_test.target_exams_per_level');
        $created = 0;
        $rejected = 0;

        foreach ($tasks as $req) {
            $have = LanguageTestItem::query()
                ->where(['language' => $language, 'cefr_level' => $level, 'skill' => $req['skill'], 'task_type' => $req['task_type']])
                ->whereIn('status', ['draft', 'approved'])
                ->count();

            $wanted = $this->option('count') !== null
                ? max(0, (int) $this->option('count'))
                : max(0, $req['per_exam'] * $target - $have);

            $this->line("{$level} {$req['skill']}/{$req['task_type']}: {$have} in bank, generating {$wanted}");

            for ($i = 0; $i < $wanted; $i++) {
                try {
                    $result = $generator->generate($language, $level, $req['skill'], $req['task_type'], (string) $this->option('sector'));
                } catch (GeminiTransientFailure $e) {
                    $this->warn('  Gemini busy or unreachable — stopping here; run again later.');

                    return self::FAILURE;
                }

                if (! $result['item']) {
                    $rejected++;
                    $this->warn('  rejected draft: '.implode(' ', $result['problems']));

                    continue;
                }

                $created++;
                $this->info("  draft #{$result['item']->id} {$result['item']->title}");

                if ($this->option('audio') && $req['skill'] === 'listening') {
                    $this->line('    audio: '.($speech->synthesize($result['item']) ? 'ok' : 'failed (upload one in the admin)'));
                }
            }
        }

        $this->info("{$created} draft(s) created, {$rejected} rejected. Review them in the admin before they can be used.");

        return self::SUCCESS;
    }
}
