<?php

namespace Tests\Feature;

use App\Jobs\GenerateLanguageTestItems;
use App\Models\LanguageTestItem;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use App\Services\Gemini\GeminiTransientFailure;
use App\Services\LanguageTest\ItemGenerator;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LanguageTestItemBankTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        Storage::fake('local');
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.model' => 'gemini-3.6-flash',
            'services.gemini.endpoint' => 'https://generativelanguage.googleapis.com/v1beta/interactions',
            'services.gemini.tts_model' => 'tts-model',
            'services.gemini.tts_endpoint' => 'https://generativelanguage.googleapis.com/v1beta/models',
        ]);
    }

    public function test_the_generator_stores_a_valid_draft_with_its_key_split_out(): void
    {
        Http::fake(['*' => Http::response(self::interaction(self::trueFalse(5, 80)))]);

        $result = app(ItemGenerator::class)->generate('de', 'A1', 'reading', 'true_false');

        $item = $result['item'];
        $this->assertNotNull($item, implode(' ', $result['problems']));
        $this->assertSame('draft', $item->status);
        $this->assertSame('A1', $item->cefr_level);
        $this->assertSame(['q1' => 'r', 'q2' => 'f', 'q3' => 'r', 'q4' => 'f', 'q5' => 'r'], $item->answer_key);

        // The prompt is pitched at the level and the task, and asks for JSON by schema.
        Http::assertSent(function (Request $request) {
            $prompt = $request['input'][0]['text'];

            return str_contains($prompt, 'CEFR level A1')
                && str_contains($prompt, 'true_false')
                && str_contains($prompt, 'exactly 5')
                && $request['response_format']['mime_type'] === 'application/json';
        });
    }

    public function test_a_draft_that_breaks_the_level_blueprint_is_not_stored(): void
    {
        // Three questions where A1 true/false needs five.
        Http::fake(['*' => Http::response(self::interaction(self::trueFalse(3, 80)))]);

        $result = app(ItemGenerator::class)->generate('de', 'A1', 'reading', 'true_false');

        $this->assertNull($result['item']);
        $this->assertContains('Expected 5 questions, found 3.', $result['problems']);
        $this->assertSame(0, LanguageTestItem::count());
    }

    public function test_a_busy_api_is_reported_as_transient(): void
    {
        Http::fake(['*' => Http::response('busy', 503)]);

        $this->expectException(GeminiTransientFailure::class);
        app(ItemGenerator::class)->generate('de', 'A1', 'reading', 'true_false');
    }

    public function test_the_command_tops_up_a_level_task_with_drafts(): void
    {
        Http::fake(['*' => Http::response(self::interaction(self::trueFalse(5, 80)))]);

        $this->artisan('language-test:generate', ['level' => 'A1', '--skill' => 'reading', '--type' => 'true_false'])
            ->assertSuccessful();

        // target_exams_per_level (2) × one true/false item per A1 exam.
        $this->assertSame(2, LanguageTestItem::where('status', 'draft')->count());

        $this->artisan('language-test:generate', ['level' => 'A1', '--skill' => 'reading', '--type' => 'true_false'])
            ->expectsOutputToContain('2 in bank, generating 0')
            ->assertSuccessful();
    }

    public function test_the_command_refuses_a_task_the_level_does_not_have(): void
    {
        $this->artisan('language-test:generate', ['level' => 'B2', '--skill' => 'writing', '--type' => 'form_fill'])
            ->assertExitCode(2);
    }

    public function test_only_administrators_reach_the_bank(): void
    {
        $candidate = User::factory()->create();
        $candidate->assignRole('User');

        $this->actingAs($candidate, 'sanctum')->getJson('/api/admin/language-test-items')->assertForbidden();
    }

    public function test_an_admin_sees_the_key_and_the_problems_and_approves(): void
    {
        $admin = $this->admin();
        $item = $this->item('A1', 'reading', 'true_false', self::trueFalseContent(5, 80));

        $this->getJson('/api/admin/language-test-items?level=A1&status=draft')
            ->assertOk()
            ->assertJsonPath('data.0.id', $item->id)
            ->assertJsonPath('data.0.answer_key.q1', 'r')
            ->assertJsonPath('data.0.problems', []);

        $this->patchJson("/api/admin/language-test-items/{$item->id}", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('status', 'approved')
            ->assertJsonPath('reviewer.id', $admin->id);

        $this->assertDatabaseHas('admin_activity_logs', ['action' => 'exam_item_approved', 'subject_id' => $item->id]);
    }

    public function test_an_item_with_defects_cannot_be_approved(): void
    {
        $this->admin();
        $item = $this->item('A1', 'reading', 'true_false', self::trueFalseContent(2, 80));

        $this->patchJson("/api/admin/language-test-items/{$item->id}", ['status' => 'approved'])
            ->assertStatus(422)
            ->assertJsonFragment(['Expected 5 questions, found 2.']);
    }

    public function test_a_listening_item_needs_audio_before_approval(): void
    {
        $this->admin();
        $item = $this->item('A1', 'listening', 'true_false', self::trueFalseContent(4, 60, listening: true));

        $this->patchJson("/api/admin/language-test-items/{$item->id}", ['status' => 'approved'])
            ->assertStatus(422)
            ->assertJsonFragment(['A listening item needs its audio clip (synthesise or upload one).']);

        $this->post("/api/admin/language-test-items/{$item->id}/audio", [
            'audio' => UploadedFile::fake()->create('clip.mp3', 200, 'audio/mpeg'),
        ])->assertOk()->assertJsonPath('has_audio', true);

        $this->patchJson("/api/admin/language-test-items/{$item->id}", ['status' => 'approved'])->assertOk();
    }

    public function test_speech_synthesis_stores_a_playable_wav(): void
    {
        $this->admin();
        $item = $this->item('A1', 'listening', 'true_false', self::trueFalseContent(4, 60, listening: true));

        Http::fake(['*' => Http::response(['candidates' => [['content' => ['parts' => [
            ['inlineData' => ['mimeType' => 'audio/L16;rate=24000', 'data' => base64_encode(str_repeat("\x00\x01", 2400))]],
        ]]]]])]);

        $this->postJson("/api/admin/language-test-items/{$item->id}/audio/synthesize")
            ->assertOk()
            ->assertJsonPath('has_audio', true);

        $wav = Storage::disk('local')->get($item->fresh()->audio_path);
        $this->assertStringStartsWith('RIFF', $wav);
        $this->assertSame(44 + 4800, strlen($wav));

        // A two-person dialogue gets two voices.
        Http::assertSent(fn (Request $r) => count($r['generationConfig']['speechConfig']['multiSpeakerVoiceConfig']['speakerVoiceConfigs']) === 2);
    }

    public function test_an_item_already_used_in_an_exam_cannot_be_edited(): void
    {
        $this->admin();
        $item = $this->item('A1', 'reading', 'true_false', self::trueFalseContent(5, 80));

        $candidate = User::factory()->create();
        $profile = CandidateProfileResolver::resolve($candidate);
        $test = $profile->languageTests()->create([
            'language' => 'de',
            'exam_level' => 'A1',
            'level_source' => 'certificate',
            'blueprint' => config('language_test.blueprints.A1'),
        ]);
        $test->responses()->create(['item_id' => $item->id, 'section' => 'reading']);

        $this->patchJson("/api/admin/language-test-items/{$item->id}", ['answer_key' => ['q1' => 'f']])
            ->assertStatus(409);

        // Retiring stays possible.
        $this->patchJson("/api/admin/language-test-items/{$item->id}", ['status' => 'retired'])
            ->assertOk();
    }

    public function test_coverage_counts_how_many_exams_each_level_can_assemble(): void
    {
        $this->admin();
        foreach (config('language_test.blueprints.A2') as $skill => $section) {
            foreach ($section['tasks'] as $task) {
                $this->item('A2', $skill, $task['task_type'], ['stub' => true], 'approved');
            }
        }
        $this->item('A1', 'reading', 'true_false', ['stub' => true], 'draft');

        $levels = collect($this->getJson('/api/admin/language-test-items/coverage')->assertOk()->json('levels'))->keyBy('level');

        $this->assertSame(1, $levels['A2']['exams_possible']);
        $this->assertSame(0, $levels['A1']['exams_possible']);
        $a1 = collect($levels['A1']['tasks'])->firstWhere('task_type', 'true_false');
        $this->assertSame(1, $a1['draft']);
        $this->assertSame(2, $a1['target']);
    }

    public function test_the_generate_button_queues_drafts(): void
    {
        Queue::fake();
        $this->admin();

        $this->postJson('/api/admin/language-test-items/generate', [
            'level' => 'B1', 'skill' => 'writing', 'task_type' => 'informal_email', 'count' => 2,
        ])->assertStatus(202);

        Queue::assertPushed(GenerateLanguageTestItems::class);

        $this->postJson('/api/admin/language-test-items/generate', [
            'level' => 'B1', 'skill' => 'writing', 'task_type' => 'form_fill',
        ])->assertStatus(422);
    }

    public function test_a_candidate_payload_never_carries_the_key_or_the_script(): void
    {
        $item = $this->item('A1', 'listening', 'true_false', self::trueFalseContent(4, 60, listening: true));

        $payload = $item->candidatePayload();

        $this->assertArrayNotHasKey('answer_key', $payload);
        $this->assertArrayNotHasKey('script', $payload['content']);
        $this->assertArrayNotHasKey('explanations', $payload['content']);
        $this->assertArrayNotHasKey('answer_key', $item->toArray());
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    private function item(string $level, string $skill, string $type, array $shaped, string $status = 'draft'): LanguageTestItem
    {
        return LanguageTestItem::create([
            'language' => 'de',
            'cefr_level' => $level,
            'skill' => $skill,
            'task_type' => $type,
            'title' => 'Test',
            'content' => $shaped['content'] ?? $shaped,
            'answer_key' => $shaped['answer_key'] ?? null,
            'status' => $status,
        ]);
    }

    /** Raw generator output: answers inline, as Gemini writes them. */
    private static function trueFalse(int $questions, int $words): array
    {
        return [
            'title' => 'Im Supermarkt',
            'stimulus' => implode(' ', array_fill(0, $words, 'Wort')),
            'script' => [],
            'options' => [],
            'questions' => array_map(fn ($i) => [
                'prompt' => "Aussage {$i}",
                'options' => [],
                'answer' => $i % 2 ? 'r' : 'f',
                'explanation' => 'Stated in line 2.',
            ], range(1, $questions)),
        ];
    }

    /** Stored shape, for items created directly. */
    private static function trueFalseContent(int $questions, int $words, bool $listening = false): array
    {
        $text = implode(' ', array_fill(0, $words, 'Wort'));
        $content = $listening
            ? ['script' => [['speaker' => 'Anna', 'text' => $text], ['speaker' => 'Ben', 'text' => 'Ja.']]]
            : ['stimulus' => $text];

        $content['questions'] = array_map(fn ($i) => [
            'id' => "q{$i}", 'prompt' => "Aussage {$i}", 'options' => [['id' => 'r', 'label' => 'Richtig'], ['id' => 'f', 'label' => 'Falsch']],
        ], range(1, $questions));
        $content['explanations'] = ['q1' => 'why'];

        $key = [];
        foreach (range(1, $questions) as $i) {
            $key["q{$i}"] = $i % 2 ? 'r' : 'f';
        }

        return ['content' => $content, 'answer_key' => $key];
    }

    private static function interaction(array $payload): array
    {
        return [
            'id' => 'v1_test',
            'status' => 'completed',
            'steps' => [
                ['type' => 'thought', 'signature' => 'redacted'],
                ['type' => 'model_output', 'content' => [['type' => 'text', 'text' => json_encode($payload)]]],
            ],
        ];
    }
}
