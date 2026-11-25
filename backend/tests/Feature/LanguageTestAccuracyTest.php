<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\LanguageTest;
use App\Models\User;
use App\Services\LanguageAssessment\LanguageLevelReconciler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\LanguageExamFixtures;
use Tests\TestCase;

class LanguageTestAccuracyTest extends TestCase
{
    use LanguageExamFixtures, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpLanguageExam();
    }

    private function blankExam(string $level): array
    {
        $this->seedBank($level);
        $profile = $this->candidateWithCertificate($level);
        Http::preventStrayRequests();
        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->assertCreated()->json('id');
        foreach (['reading', 'listening', 'read_aloud', 'writing', 'oral'] as $section) {
            $this->postJson("/api/candidate/language-tests/{$id}/sections/{$section}/start")->assertOk();
            $this->postJson("/api/candidate/language-tests/{$id}/sections/{$section}/complete")->assertOk();
        }

        return [LanguageTest::findOrFail($id), $profile];
    }

    public function test_empty_a1_and_a2_exams_publish_no_level_or_certificate_confirmation(): void
    {
        foreach (['A1', 'A2'] as $level) {
            [$test, $profile] = $this->blankExam($level);
            $this->assertSame('validated', $test->status); // Finished, with no approval gate.
            $this->assertSame('not_demonstrated', $test->outcome);
            $this->assertNull($test->final_cefr);
            $this->assertNull($profile->languages()->first()->tested_cefr);
            $this->assertFalse($profile->languages()->first()->certificate_confirmed);
            $this->getJson("/api/candidate/language-tests/{$test->id}")
                ->assertOk()->assertJsonPath('final_cefr', null)->assertJsonPath('outcome', 'not_demonstrated');
            $this->assertSame(0, $test->skill_scores['speaking']);
        }
        Http::assertNothingSent();
    }

    private function spokenExam(string $level, array $oralScores, int $writing = 70): array
    {
        $this->seedBank($level);
        $profile = $this->candidateWithCertificate($level);
        $runs = collect($oralScores)->flatMap(fn ($score) => [$score, $score])->all();
        Http::fake(function ($r) use (&$runs, $writing) {
            $oral = ($r['input'][0]['type'] ?? null) === 'audio';

            return Http::response(self::grading($oral ? array_shift($runs) : $writing, oral: $oral));
        });
        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->assertCreated()->json('id');
        $this->runPhaseOne($id, correct: true);
        $items = $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/start")->assertOk()->json('items');
        foreach ($items as $item) {
            $this->postJson("/api/candidate/language-tests/{$id}/responses/{$item['response_id']}/reveal")->assertOk();
            $this->post("/api/candidate/language-tests/{$id}/responses/{$item['response_id']}/recording", [
                'video' => UploadedFile::fake()->createWithContent('oral.mp4', file_get_contents(base_path('tests/Fixtures/language-test/oral.mp4'))),
            ])->assertCreated();
        }
        $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/complete")->assertOk();

        return [LanguageTest::findOrFail($id), $profile];
    }

    public function test_a_complete_a1_pass_still_publishes_automatically(): void
    {
        [$test, $profile] = $this->spokenExam('A1', [70, 70]);
        $this->assertSame('A1', $test->final_cefr);
        $this->assertSame('A1', $profile->languages()->first()->tested_cefr);
        $this->assertTrue($profile->languages()->first()->certificate_confirmed);
        $this->assertNull($test->reviewed_by_id);
    }

    public function test_perfect_read_aloud_cannot_rescue_failed_spontaneous_speech(): void
    {
        [$test, $profile] = $this->spokenExam('A2', [50, 50]);
        $this->assertSame(100, $test->skill_scores['read_aloud']);
        $this->assertSame(50, $test->skill_scores['speaking']);
        $this->assertNull($test->final_cefr);
        $this->assertNull($profile->languages()->first()->tested_cefr);
    }

    public function test_an_excellent_introduction_cannot_mask_a_failed_situation(): void
    {
        [$test] = $this->spokenExam('A2', [100, 20]);
        $this->assertSame(20, $test->skill_scores['speaking']);
        $this->assertSame('not_demonstrated', $test->outcome);
        $this->assertNull($test->final_cefr);
    }

    public function test_a_perfect_form_does_not_rescue_failed_free_writing(): void
    {
        [$test] = $this->spokenExam('A1', [70, 70], writing: 20);
        $this->assertSame(100, $test->responses()->whereHas('item', fn ($q) => $q->where('task_type', 'form_fill'))->first()->score);
        $this->assertSame(20, $test->skill_scores['writing']);
        $this->assertNull($test->final_cefr);
    }

    public function test_an_unsuccessful_candidate_can_choose_a_lower_complete_exam_after_cooldown(): void
    {
        [$test, $profile] = $this->blankExam('A2');
        $this->seedBank('A1');
        $this->getJson('/api/candidate/language-tests/overview')->assertOk()->assertJsonPath('exam_level', null);
        $this->travel(31)->days();
        $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'level' => 'A1', 'consent' => true])
            ->assertCreated()->assertJsonPath('exam_level', 'A1')->assertJsonPath('level_source', 'chosen');
        $this->assertSame('A2', $profile->languages()->first()->cefr_level); // Certificate retained.
    }

    public function test_an_unsuccessful_exam_is_not_a_validated_recruiter_search_level(): void
    {
        [$test, $profile] = $this->blankExam('A1');
        $profile->update(['terms_consent_at' => now(), 'cndp_consent_at' => now(), 'submitted_at' => now()]);
        $recruiter = User::factory()->create();
        $recruiter->assignRole('Company');
        $this->actingAs($recruiter, 'sanctum');
        $this->getJson('/api/recruiter/candidates?amud_validated=1')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/recruiter/candidates/{$profile->id}")->assertOk()
            ->assertJsonPath('amud_language_tests.0.final_cefr', null)
            ->assertJsonPath('amud_language_tests.0.certificate_confirmed', false);
    }

    public function test_upgrade_removes_legacy_false_passes_but_preserves_admin_corrections(): void
    {
        [$test, $profile] = $this->blankExam('A1');
        $test->update(['final_cefr' => 'A1', 'ai_cefr' => 'A1', 'outcome' => 'confirmed']);
        app(LanguageLevelReconciler::class)->applyValidatedTest($test);
        $originalDate = $test->completed_at->toDateTimeString();
        $migration = require database_path('migrations/2026_11_24_130000_require_demonstrated_language_test_levels.php');
        $migration->up();
        $this->assertNull($test->fresh()->final_cefr);
        $this->assertNull($profile->languages()->first()->tested_cefr);
        $this->assertFalse($profile->languages()->first()->certificate_confirmed);
        $this->assertSame($originalDate, $test->fresh()->completed_at->toDateTimeString());
        $test->refresh()->update(['final_cefr' => 'A1', 'reviewed_by_id' => User::factory()->create()->id, 'reviewed_at' => now()]);
        $migration->up();
        $this->assertSame('A1', $test->fresh()->final_cefr);
    }

    public function test_upgrade_removes_an_old_pass_based_on_opposite_borderline_marks(): void
    {
        [$test, $profile] = $this->spokenExam('A1', [70, 70]);
        $response = $test->responses()->where('section', 'oral')->first();
        $evaluation = $response->evaluation;
        $evaluation['runs'][0]['score'] = 59;
        $evaluation['runs'][1]['score'] = 61;
        $evaluation['disagreement'] = false; // The former 15-point spread check missed this.
        $response->update(['score' => 60, 'evaluation' => $evaluation]);
        $migration = require database_path('migrations/2026_11_24_130000_require_demonstrated_language_test_levels.php');
        $migration->up();
        $this->assertSame('failed', $test->fresh()->status);
        $this->assertNull($test->fresh()->final_cefr);
        $this->assertNull($profile->languages()->first()->tested_cefr);
        $this->assertContains('grader_disagreement', $test->fresh()->integrity['flags']);
        $this->assertNotNull($response->fresh()); // Upgrade preserves the evidence.
    }

    public function test_admin_can_correct_a_pass_to_level_not_demonstrated(): void
    {
        [$test, $profile] = $this->spokenExam('A1', [70, 70]);
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');
        $this->actingAs($admin, 'sanctum');
        $this->patchJson("/api/admin/language-tests/{$test->id}/result", [
            'final_cefr' => null, 'skill_results' => ['speaking' => null], 'note' => 'The situation was not answered.',
        ])->assertOk()->assertJsonPath('outcome', 'not_demonstrated')->assertJsonPath('final_cefr', null);
        $this->assertNull($profile->languages()->first()->tested_cefr);
        $this->assertFalse($profile->languages()->first()->certificate_confirmed);
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    public function test_a_b2_result_waits_for_an_administrator_and_shows_nothing_meanwhile(): void
    {
        [$test, $profile] = $this->spokenExam('B2', [70, 70]);
        $this->assertSame('awaiting_review', $test->status);
        $this->assertSame('B2', $test->ai_cefr);
        $this->assertNull($test->final_cefr);
        $this->assertNull($test->published_at);
        $this->assertNull($profile->languages()->first()->tested_cefr);
        $this->assertNull($profile->languages()->first()->certificate_confirmed);
        $this->assertSame(0, AppNotification::where('user_id', $profile->user_id)->where('type', 'language_test.reviewed')->count());

        // The candidate sees that the result is under review, not the AI's verdict.
        $this->getJson("/api/candidate/language-tests/{$test->id}")->assertOk()
            ->assertJsonPath('status', 'awaiting_review')
            ->assertJsonPath('ai_cefr', null)->assertJsonPath('final_cefr', null)->assertJsonPath('outcome', null)
            ->assertJsonPath('provisional.skill_results', null);

        $this->actingAsAdmin();
        $this->getJson('/api/admin/language-tests')->assertOk()->assertJsonPath('data.0.id', $test->id);
        $this->postJson("/api/admin/language-tests/{$test->id}/approve")->assertOk()
            ->assertJsonPath('status', 'validated')->assertJsonPath('final_cefr', 'B2');
        $this->assertSame('B2', $profile->languages()->first()->tested_cefr);
        $this->assertTrue($profile->languages()->first()->certificate_confirmed);
        $this->assertNotNull($test->fresh()->published_at);
        $this->assertSame('Résultat de l’examen', AppNotification::where('user_id', $profile->user_id)->where('type', 'language_test.reviewed')->first()->title);

        // Approval is for results under review only.
        $this->postJson("/api/admin/language-tests/{$test->id}/approve")->assertStatus(409);
    }

    public function test_an_administrator_can_publish_a_different_level_for_a_reviewed_exam(): void
    {
        [$test, $profile] = $this->spokenExam('C1', [70, 70], writing: 50);
        $this->assertSame('awaiting_review', $test->status);
        $this->assertNull($test->ai_cefr); // Writing 50: the AI did not see C1.

        $this->actingAsAdmin();
        $this->patchJson("/api/admin/language-tests/{$test->id}/result", [
            'final_cefr' => 'C1', 'skill_results' => ['writing' => 'C1'], 'note' => 'Writing meets C1; the AI marked it a level low.',
        ])->assertOk()->assertJsonPath('status', 'validated')->assertJsonPath('final_cefr', 'C1');
        $this->assertSame('C1', $profile->languages()->first()->tested_cefr);
    }

    public function test_b1_and_below_still_publish_automatically(): void
    {
        [$test] = $this->spokenExam('B1', [70, 70]);
        $this->assertSame('validated', $test->status);
        $this->assertSame('B1', $test->final_cefr);
    }

    public function test_upgrade_sends_an_automatic_b2_result_back_to_review(): void
    {
        [$test, $profile] = $this->spokenExam('B2', [70, 70]);
        $test->update(['status' => 'validated', 'final_cefr' => 'B2', 'published_at' => now()]);
        app(LanguageLevelReconciler::class)->applyValidatedTest($test->fresh('candidateProfile'));
        $this->assertSame('B2', $profile->languages()->first()->tested_cefr);

        $migration = require database_path('migrations/2026_11_24_130000_require_demonstrated_language_test_levels.php');
        $migration->up();
        $this->assertSame('awaiting_review', $test->fresh()->status);
        $this->assertNull($test->fresh()->final_cefr);
        $this->assertNull($profile->languages()->first()->tested_cefr);
    }
}
