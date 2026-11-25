<?php

namespace Tests\Concerns;

use App\Models\CandidateProfile;
use App\Models\LanguageTestItem;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use App\Services\LanguageAssessment\WhisperTranscriber;
use App\Services\LanguageTest\ProductiveGrader;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/** A bank, a certified candidate and a scripted Phase 1 for the AMUD exam tests. */
trait LanguageExamFixtures
{
    public static function readAloudText(): string
    {
        return 'Ich arbeite seit drei Jahren als Pflegekraft in einem Krankenhaus in Casablanca.';
    }

    protected function setUpLanguageExam(): void
    {
        $this->seed(RoleSeeder::class);
        Storage::fake('local');
        self::$gradedLevel = 'B1';
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.endpoint' => 'https://generativelanguage.googleapis.com/v1beta/interactions',
        ]);

        // Whisper reads the reference text back perfectly, with clear words.
        $this->app->instance(WhisperTranscriber::class, new class extends WhisperTranscriber
        {
            public function transcribe(string $absoluteAudioPath, ?string $language = null): ?array
            {
                $text = LanguageExamFixtures::readAloudText();
                $words = explode(' ', $text);

                return [
                    'transcript' => $text,
                    'words' => count($words),
                    'duration' => 8.0,
                    'detected_language' => 'de',
                    'word_details' => array_map(fn ($w, $i) => ['word' => $w, 'probability' => 0.95, 'start' => $i * 0.6, 'end' => $i * 0.6 + 0.5], $words, array_keys($words)),
                ];
            }
        });
    }

    /** Walk Phase 1 end to end, answering every keyed question right or wrong. */
    protected function runPhaseOne(int $id, bool $correct): void
    {
        foreach (['reading', 'listening'] as $section) {
            $items = $this->postJson("/api/candidate/language-tests/{$id}/sections/{$section}/start")->assertOk()->json('items');
            foreach ($items as $entry) {
                $key = LanguageTestItem::find($entry['item']['id'])->answer_key;
                $answers = array_map(fn ($v) => $correct ? $v : 'zzz', $key);
                $this->putJson("/api/candidate/language-tests/{$id}/responses/{$entry['response_id']}", [
                    'answer' => ['answers' => $answers],
                    'time_ms' => 1000,
                ])->assertOk();
            }
            $this->postJson("/api/candidate/language-tests/{$id}/sections/{$section}/complete")->assertOk()->assertJsonPath('status', 'in_progress');
        }

        $items = $this->postJson("/api/candidate/language-tests/{$id}/sections/read_aloud/start")->json('items');
        $this->post("/api/candidate/language-tests/{$id}/responses/{$items[0]['response_id']}/recording", [
            'audio' => UploadedFile::fake()->create('read.webm', 120, 'audio/webm'),
        ])->assertCreated();
        $this->postJson("/api/candidate/language-tests/{$id}/sections/read_aloud/complete")->assertOk();

        $items = $this->postJson("/api/candidate/language-tests/{$id}/sections/writing/start")->json('items');
        foreach ($items as $entry) {
            $this->putJson("/api/candidate/language-tests/{$id}/responses/{$entry['response_id']}", [
                'answer' => $entry['item']['task_type'] === 'form_fill'
                    ? ['fields' => array_map(fn ($accepted) => $accepted[0], LanguageTestItem::find($entry['item']['id'])->answer_key)]
                    : ['text' => 'Liebe Lea, vielen Dank für deine Einladung zum Grillfest. '.str_repeat('Ich komme gern und bringe einen Salat mit. ', 12)],
            ])->assertOk();
        }
        $this->postJson("/api/candidate/language-tests/{$id}/sections/writing/complete")->assertOk();
    }

    protected function fakeGrader(int $score): void
    {
        Http::fake(['*' => Http::response(self::grading($score))]);
    }

    /** The exam level the fake grader rates against (the last certificate created). */
    protected static string $gradedLevel = 'B1';

    /**
     * A Gemini interactions response carrying one grading (oral fields included;
     * writing ignores them). Every criterion gets $score, with the CEFR level
     * whose band holds that score on the exam being graded.
     */
    protected static function grading(int $score, bool $oral = false): array
    {
        $criteria = $oral ? ['fluency', 'vocabulary', 'grammar', 'pronunciation'] : ['coherence', 'vocabulary', 'grammar'];
        $level = collect(ProductiveGrader::RATINGS)->first(function ($rating) use ($score) {
            [$low, $high] = ProductiveGrader::band($rating, self::$gradedLevel);

            return $score >= $low && $score <= $high;
        });
        $graded = ['score' => $score, 'evidence' => ['vielen Dank'], 'comment' => 'ok'];

        $payload = [
            'language_ok' => true,
            'on_topic' => true,
            'speech_present' => true,
            'transcript' => 'Also, ich finde, dass Arbeiten im Ausland viele Vorteile hat.',
            'task_achievement' => $graded,
            'criteria' => array_map(fn ($c) => ['criterion' => $c, 'level' => $level, ...$graded], $criteria),
            'strengths' => ['Clear structure'],
            'weaknesses' => ['Limited connectors'],
        ];

        return ['steps' => [['type' => 'model_output', 'content' => [['type' => 'text', 'text' => json_encode($payload)]]]]];
    }

    protected function candidateWithCertificate(string $level): CandidateProfile
    {
        self::$gradedLevel = $level;
        $user = User::factory()->create();
        $profile = CandidateProfileResolver::resolve($user);
        $document = $profile->documents()->create(['type' => 'certificate', 'file_path' => 'c.pdf', 'ocr_status' => 'completed']);
        $profile->languages()->create([
            'language' => 'de', 'cefr_level' => $level, 'self_declared_cefr' => $level,
            'source' => 'certified', 'certificate_document_id' => $document->id,
        ]);
        $this->actingAs($user, 'sanctum');

        return $profile;
    }

    /** One approved item for every task of the level's exam (listening with audio). */
    protected function seedBank(string $level): void
    {
        foreach (config("language_test.blueprints.{$level}") as $skill => $section) {
            foreach ($section['tasks'] as $task) {
                $type = $task['task_type'];
                $family = config("language_test.task_types.{$type}.family");
                [$content, $key] = match ($family) {
                    'questions' => [[
                        ($skill === 'listening' ? 'script' : 'stimulus') => $skill === 'listening' ? [['speaker' => 'A', 'text' => 'Hallo']] : 'Text',
                        'questions' => array_map(fn ($i) => ['id' => "q{$i}", 'prompt' => "Frage {$i}", 'options' => [['id' => 'a', 'label' => 'x'], ['id' => 'b', 'label' => 'y']]], range(1, $task['questions'])),
                        'explanations' => ['q1' => 'secret'],
                        'plays' => $section['plays'] ?? null,
                    ], collect(range(1, $task['questions']))->mapWithKeys(fn ($i) => ["q{$i}" => 'a'])->all()],
                    'form' => [['stimulus' => 'Text', 'fields' => [['id' => 'f1', 'label' => 'Stadt']]], ['f1' => ['Berlin']]],
                    'read_aloud' => [['text' => self::readAloudText()], null],
                    'oral' => [[
                        'situation' => "Geheime Situation {$level} {$type}",
                        'instructions' => 'Sprechen Sie.',
                        'points' => ['Punkt'],
                        'prep_seconds' => $task['prep_seconds'],
                        'answer_seconds' => $task['answer_seconds'],
                    ], null],
                    default => [['situation' => 'Ihre Kollegin Lea lädt Sie zum Grillfest ein.', 'instructions' => 'Schreiben Sie eine E-Mail an Lea.', 'points' => ['Danke'], 'min_words' => $task['words'][0] ?? null, 'max_words' => $task['words'][1] ?? null], null],
                };

                LanguageTestItem::create([
                    'language' => 'de', 'cefr_level' => $level, 'skill' => $skill, 'task_type' => $type,
                    'title' => "{$level} {$type}", 'content' => $content, 'answer_key' => $key,
                    'audio_path' => $skill === 'listening' ? 'language-test/audio/x.wav' : null,
                    'status' => 'approved',
                ]);
            }
        }
    }
}
