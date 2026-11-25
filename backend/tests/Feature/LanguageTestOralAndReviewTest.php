<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\CandidateProfile;
use App\Models\LanguageTest;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use App\Services\LanguageAssessment\LanguageLevelReconciler;
use App\Services\LanguageTest\ExamFinalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\LanguageExamFixtures;
use Tests\TestCase;

class LanguageTestOralAndReviewTest extends TestCase
{
    use LanguageExamFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpLanguageExam();
    }

    public function test_the_oral_situation_stays_hidden_until_revealed_then_is_graded_from_the_audio(): void
    {
        $this->seedBank('B1');
        $profile = $this->candidateWithCertificate('B1');
        Http::fake(fn ($r) => Http::response(self::grading(70, oral: ($r['input'][0]['type'] ?? null) === 'audio')));

        $id = $this->startAndPassPhaseOne();

        $started = $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/start")->assertOk();
        $this->assertStringNotContainsString('Geheime Situation', $started->getContent());
        $this->assertSame('B1', $started->json('oral_level'));
        $items = $started->json('items');
        $this->assertCount(2, $items);
        $this->assertNull($items[0]['oral']['content']);
        $this->assertSame(90, $items[0]['oral']['answer_seconds']);

        $revealed = $this->postJson("/api/candidate/language-tests/{$id}/responses/{$items[0]['response_id']}/reveal")->assertOk();
        $this->assertStringContainsString('Geheime Situation', $revealed->json('content.situation'));

        // One situation at a time.
        $this->postJson("/api/candidate/language-tests/{$id}/responses/{$items[1]['response_id']}/reveal")
            ->assertStatus(409)->assertJsonPath('reason', 'task_open');

        foreach ($items as $i => $entry) {
            if ($i > 0) {
                $this->postJson("/api/candidate/language-tests/{$id}/responses/{$entry['response_id']}/reveal")->assertOk();
            }
            $this->post("/api/candidate/language-tests/{$id}/responses/{$entry['response_id']}/recording", [
                'video' => $this->oralVideo(),
            ])->assertCreated();
        }

        // Gemini got the audio itself, with the level and the situation.
        Http::assertSent(fn ($r) => ($r['input'][0]['type'] ?? null) === 'audio'
            && str_contains($r['input'][1]['text'] ?? '', 'speaking part')
            && str_contains($r['input'][1]['text'] ?? '', 'Geheime Situation')
            && str_starts_with(base64_decode($r['input'][0]['data']), 'RIFF'));

        $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/complete")->assertOk();

        $test = LanguageTest::find($id);
        $this->assertSame('validated', $test->status);
        $this->assertSame('B1', $test->ai_cefr);
        $this->assertSame('confirmed', $test->outcome);
        // Read-aloud does not inflate the spontaneous speaking result.
        $this->assertSame(70, $test->skill_scores['speaking']);
        $oral = $test->responses()->where('section', 'oral')->first();
        $this->assertNotNull($oral->video_path);
        $this->assertSame($oral->video_path, $oral->audio_path);
        $this->assertNotNull($test->responses()->where('section', 'oral')->first()->evaluation['transcript']);

        // Publication is automatic, even when integrity flags need a later look.
        $this->assertSame('B1', $profile->languages()->first()->tested_cefr);
        $this->assertSame('B1', $test->final_cefr);
        $this->assertNotNull($test->published_at);
        $this->assertNull($test->reviewed_by_id);
        $this->assertSame(1, AppNotification::where('type', 'language_test.reviewed')->count());
        app(ExamFinalizer::class)->maybeFinalize($test);
        $this->assertSame(1, AppNotification::where('type', 'language_test.reviewed')->count());
        $this->makeDiscoverable($profile);
        $recruiter = User::factory()->create();
        $recruiter->assignRole('Company');
        $this->actingAs($recruiter, 'sanctum');
        $this->getJson("/api/recruiter/candidates/{$profile->id}")->assertOk()->assertJsonPath('amud_language_tests.0.final_cefr', 'B1');
    }

    public function test_a_recording_after_the_task_window_is_refused(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');
        $this->fakeGrader(70);

        $id = $this->startAndPassPhaseOne();
        $items = $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/start")->json('items');
        $this->postJson("/api/candidate/language-tests/{$id}/responses/{$items[0]['response_id']}/reveal")->assertOk();

        $this->travel(30 + 90 + 61)->seconds();

        $this->post("/api/candidate/language-tests/{$id}/responses/{$items[0]['response_id']}/recording", [
            'video' => $this->oralVideo(),
        ])->assertStatus(409)->assertJsonPath('reason', 'too_late');
    }

    public function test_weak_phase_one_keeps_the_oral_at_the_exam_level(): void
    {
        $this->seedBank('B1');
        $this->seedBank('A2');
        $this->candidateWithCertificate('B1');
        $this->fakeGrader(50); // writing 50 at B1 → A2

        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');
        $this->runPhaseOne($id, correct: true);
        $this->assertNull(LanguageTest::find($id)->provisional_cefr);

        $started = $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/start")->assertOk();
        $this->assertSame('B1', $started->json('oral_level'));
        $this->assertSame(90, $started->json('items.0.oral.answer_seconds')); // B1 presentation

        // Skipping every oral task: the oral scores 0 and the exam is flagged.
        $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/complete")->assertOk();
        $test = LanguageTest::find($id);
        $this->assertSame('validated', $test->status);
        $this->assertTrue($test->needs_attention);
        $this->assertContains('oral_missing', $test->integrity['flags']);
        $this->assertSame('not_demonstrated', $test->outcome);
        $this->assertNull($test->final_cefr);
    }

    public function test_an_admin_can_correct_an_automatically_published_result(): void
    {
        [$test, $profile] = $this->finishedExam('B1', ai: 'B1');
        $admin = $this->admin();

        $this->getJson('/api/admin/language-tests?status=validated')
            ->assertOk()->assertJsonPath('data.0.id', $test->id)->assertJsonPath('data.0.ai_cefr', 'B1');

        $this->getJson("/api/admin/language-tests/{$test->id}")
            ->assertOk()->assertJsonPath('candidate_language.source', 'certified');

        $this->patchJson("/api/admin/language-tests/{$test->id}/result", ['final_cefr' => 'B1', 'note' => 'Checked the recordings.'])
            ->assertOk()->assertJsonPath('status', 'validated')->assertJsonPath('final_cefr', 'B1');

        $row = $profile->languages()->first();
        $this->assertSame('B1', $row->cefr_level);
        $this->assertSame('certified', $row->source);
        $this->assertSame('B1', $row->tested_cefr);
        $this->assertTrue($row->certificate_confirmed);
        $this->assertDatabaseHas('admin_activity_logs', ['action' => 'language_test_corrected', 'actor_id' => $admin->id]);
        $this->assertSame(1, AppNotification::where('type', 'language_test.reviewed')->count());
    }

    public function test_a_lower_validated_level_flags_the_certificate_without_changing_it(): void
    {
        [$test, $profile] = $this->finishedExam('B2', ai: 'B1');
        $this->admin();

        $this->patchJson("/api/admin/language-tests/{$test->id}/result", ['final_cefr' => 'B1', 'note' => 'Corrected after review.'])->assertOk();

        $row = $profile->languages()->first();
        $this->assertSame('B2', $row->cefr_level);
        $this->assertSame('B1', $row->tested_cefr);
        $this->assertFalse($row->certificate_confirmed);
    }

    public function test_without_a_certificate_the_validated_level_becomes_the_profile_level(): void
    {
        [$test, $profile] = $this->finishedExam('B1', ai: 'A2', certified: false);
        $this->admin();

        // Overriding the AI needs a reason.
        $this->patchJson("/api/admin/language-tests/{$test->id}/result", ['final_cefr' => 'B1'])->assertStatus(422);
        $this->patchJson("/api/admin/language-tests/{$test->id}/result", ['final_cefr' => 'B1', 'skill_results' => ['speaking' => 'B1'], 'note' => 'Oral clearly B1; reading text was ambiguous.'])->assertOk();

        $row = $profile->languages()->first();
        $this->assertSame('B1', $row->cefr_level);
        $this->assertSame('amud_tested', $row->source);
        $this->assertSame('B1', $row->self_declared_cefr);

        // Editing the declared level later cannot overwrite the validated one.
        $this->actingAs($profile->user, 'sanctum')
            ->putJson('/api/candidate/languages', ['language' => 'de', 'cefr_level' => 'C1'])->assertOk();
        $this->assertSame('B1', $profile->languages()->first()->cefr_level);
    }

    public function test_an_annulled_exam_leaves_the_profile_alone(): void
    {
        [$test, $profile] = $this->finishedExam('B1', ai: 'B1');
        $this->admin();

        $this->postJson("/api/admin/language-tests/{$test->id}/annul", [])->assertStatus(422);
        $this->postJson("/api/admin/language-tests/{$test->id}/annul", ['note' => 'Another person answered the oral.'])
            ->assertOk()->assertJsonPath('status', 'abandoned');

        $this->assertNull($profile->languages()->first()->tested_cefr);
        $this->patchJson("/api/admin/language-tests/{$test->id}/result", ['final_cefr' => 'B1', 'note' => 'Cannot restore an annulled sitting.'])->assertStatus(409);
    }

    public function test_only_administrators_review_exams(): void
    {
        [$test, $profile] = $this->finishedExam('B1', ai: 'B1');
        $this->actingAs($profile->user, 'sanctum');

        $this->getJson('/api/admin/language-tests')->assertForbidden();
        $this->patchJson("/api/admin/language-tests/{$test->id}/result", ['final_cefr' => 'B1'])->assertForbidden();
    }

    public function test_recruiters_see_the_validated_level_and_can_filter_on_it(): void
    {
        [$validated, $profileA] = $this->finishedExam('B1', ai: 'B1');
        $this->makeDiscoverable($profileA);
        [, $profileB] = $this->finishedExam('B1', ai: 'B1', published: false); // not yet finished
        $this->makeDiscoverable($profileB);

        $this->admin();
        $this->patchJson("/api/admin/language-tests/{$validated->id}/result", ['final_cefr' => 'B1', 'note' => 'ok'])->assertOk();

        $recruiter = User::factory()->create();
        $recruiter->assignRole('Company');
        $this->actingAs($recruiter, 'sanctum');

        $ids = collect($this->getJson('/api/recruiter/candidates?amud_validated=1&language=de&cefr_level=B1')->assertOk()->json('data'))->pluck('id');
        $this->assertEquals([$profileA->id], $ids->all());
        $this->getJson('/api/recruiter/candidates?amud_validated=1&language=de&cefr_level=B2')->assertJsonCount(0, 'data');

        $all = collect($this->getJson('/api/recruiter/candidates')->json('data'))->keyBy('id');
        $this->assertTrue($all[$profileA->id]['has_amud_validated']);
        $this->assertFalse($all[$profileB->id]['has_amud_validated']);

        $dossier = $this->getJson("/api/recruiter/candidates/{$profileA->id}")->assertOk();
        $dossier->assertJsonPath('amud_language_tests.0.final_cefr', 'B1')
            ->assertJsonPath('amud_language_tests.0.certificate_confirmed', true)
            ->assertJsonPath('languages.0.tested_cefr', 'B1');
        $this->assertStringNotContainsString('review_note', $dossier->getContent());
        $this->assertStringNotContainsString('Geheime', $dossier->getContent());
    }

    public function test_certificate_confirmation_tracks_later_edits_and_detachment(): void
    {
        [$test, $profile] = $this->finishedExam('B1', ai: 'B1');
        $this->actingAs($profile->user, 'sanctum');
        $this->putJson('/api/candidate/languages', ['language' => 'de', 'cefr_level' => 'C2'])
            ->assertOk()->assertJsonPath('certificate_confirmed', false);
        $this->putJson('/api/candidate/languages', ['language' => 'de', 'cefr_level' => 'A2'])
            ->assertOk()->assertJsonPath('certificate_confirmed', true);
        $this->deleteJson('/api/candidate/languages/de/certificate')
            ->assertOk()->assertJsonPath('certificate_confirmed', null)->assertJsonPath('cefr_level', 'B1');
    }

    public function test_a_certificate_added_after_the_exam_is_compared_to_the_result(): void
    {
        [$test, $profile] = $this->finishedExam('B1', ai: 'B1', certified: false);
        $document = $profile->documents()->create(['type' => 'certificate', 'file_path' => 'c.pdf', 'ocr_status' => 'completed']);
        $this->actingAs($profile->user, 'sanctum');
        $this->postJson('/api/candidate/languages/de/certificate', ['document_id' => $document->id, 'cefr_level' => 'C2'])
            ->assertOk()->assertJsonPath('certificate_confirmed', false)->assertJsonPath('tested_cefr', 'B1');
    }

    public function test_the_oral_refuses_separate_audio_and_requires_video(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');
        $this->fakeGrader(70);
        $id = $this->startAndPassPhaseOne();
        $entry = $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/start")->json('items.0');
        $url = "/api/candidate/language-tests/{$id}/responses/{$entry['response_id']}/recording";
        $this->post($url, ['audio' => UploadedFile::fake()->create('oral.webm', 300, 'audio/webm')])
            ->assertStatus(422)->assertInvalid(['video', 'audio']);
        $this->post($url, ['audio' => UploadedFile::fake()->create('other.webm', 300, 'audio/webm'), 'video' => $this->oralVideo()])
            ->assertStatus(422)->assertInvalid(['audio']);
    }

    public function test_a_failed_phase_one_does_not_require_an_untested_lower_oral_bank(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');
        $this->fakeGrader(50);
        $id = $this->startAndPassPhaseOne();
        $this->assertNull(LanguageTest::find($id)->provisional_cefr);
        $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/start")
            ->assertOk()->assertJsonPath('oral_level', 'B1');
    }

    public function test_failed_grading_does_not_publish_an_incomplete_level_and_can_be_corrected(): void
    {
        $this->seedBank('B1');
        $profile = $this->candidateWithCertificate('B1');
        $this->fakeGrader(70);
        $id = $this->startAndPassPhaseOne();
        $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/start")->assertOk();
        $test = LanguageTest::find($id);
        $test->responses()->where('section', 'oral')->update(['audio_path' => 'bad.mp4', 'video_path' => 'bad.mp4', 'status' => 'failed']);
        $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/complete")->assertOk()->assertJsonPath('status', 'failed');
        $this->assertNull($test->fresh()->final_cefr);
        $this->assertNull($profile->languages()->first()->tested_cefr);
        $this->assertSame('B1', $profile->languages()->first()->cefr_level);
        $this->assertContains('grading_failed', $test->fresh()->integrity['flags']);
        $this->admin();
        $this->patchJson("/api/admin/language-tests/{$id}/result", ['final_cefr' => 'B1', 'note' => 'Listened to the saved video.'])->assertStatus(422);
        $this->patchJson("/api/admin/language-tests/{$id}/result", ['final_cefr' => 'B1', 'skill_results' => ['speaking' => 'B1'], 'note' => 'Listened to the saved video.'])
            ->assertOk()->assertJsonPath('status', 'validated');
        $this->assertSame('B1', $profile->languages()->first()->tested_cefr);
    }

    public function test_a_correction_needs_a_reason_even_if_the_final_level_matches_the_ai(): void
    {
        [$test] = $this->finishedExam('B1', ai: 'B1');
        $this->admin();
        foreach (['', '   '] as $note) {
            $this->patchJson("/api/admin/language-tests/{$test->id}/result", ['final_cefr' => 'B1', 'skill_results' => ['speaking' => 'A2'], 'note' => $note])
                ->assertStatus(422);
        }
        $this->patchJson("/api/admin/language-tests/{$test->id}/result", ['final_cefr' => 'A2', 'skill_results' => ['speaking' => 'A2'], 'note' => 'Pronunciation is below B1.'])
            ->assertOk()->assertJsonPath('skill_results.speaking', 'A2')->assertJsonPath('needs_attention', false);
        $this->assertDatabaseHas('admin_activity_logs', ['action' => 'language_test_corrected']);
    }

    public function test_annulling_the_latest_result_restores_the_previous_sitting(): void
    {
        [$older, $profile] = $this->finishedExam('B1', ai: 'A2', certified: false);
        $newer = $older->replicate();
        $newer->fill(['completed_at' => now()->addMinute(), 'ai_cefr' => 'B1', 'final_cefr' => 'B1'])->save();
        app(LanguageLevelReconciler::class)->applyValidatedTest($newer);
        $this->assertSame('B1', $profile->languages()->first()->tested_cefr);
        $this->admin();
        $this->postJson("/api/admin/language-tests/{$newer->id}/annul", ['note' => 'Wrong candidate in the recording.'])->assertOk();
        $row = $profile->languages()->first();
        $this->assertSame($older->id, $row->language_test_id);
        $this->assertSame('A2', $row->cefr_level);
    }

    public function test_the_upgrade_publishes_existing_waiting_results_and_reconciles_certificates(): void
    {
        [$test, $profile] = $this->finishedExam('B1', ai: 'B1', published: false);
        $test->update(['status' => 'awaiting_review']);
        $migration = require database_path('migrations/2026_11_23_120000_publish_completed_language_test_results.php');
        $migration->up();
        $this->assertSame('validated', $test->fresh()->status);
        $this->assertSame('B1', $profile->languages()->first()->tested_cefr);
        $this->assertTrue($profile->languages()->first()->certificate_confirmed);
        $this->assertNull($test->fresh()->reviewed_by_id);
    }

    public function test_a_failed_writing_task_is_not_hidden_by_another_successful_mark(): void
    {
        $this->seedBank('B1');
        $profile = $this->candidateWithCertificate('B1');
        $this->fakeGrader(70);
        $id = $this->startAndPassPhaseOne();
        $test = LanguageTest::find($id);
        $test->responses()->where('section', 'writing')->first()->update(['status' => 'failed', 'score' => null]);
        $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/start")->assertOk();
        $this->postJson("/api/candidate/language-tests/{$id}/sections/oral/complete")->assertOk()->assertJsonPath('status', 'failed');
        $this->assertNull($profile->languages()->first()->tested_cefr);
    }

    private function oralVideo(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('oral.mp4', file_get_contents(base_path('tests/Fixtures/language-test/oral.mp4')));
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private function startAndPassPhaseOne(): int
    {
        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');
        $this->runPhaseOne($id, correct: true);
        $this->assertSame('oral', LanguageTest::find($id)->current_section);

        return $id;
    }

    /** @return array{0: LanguageTest, 1: CandidateProfile} */
    private function finishedExam(string $level, string $ai, bool $certified = true, bool $published = true): array
    {
        $user = User::factory()->create();
        $profile = CandidateProfileResolver::resolve($user);
        $row = ['language' => 'de', 'cefr_level' => $level, 'self_declared_cefr' => $level, 'source' => $certified ? 'certified' : 'self_declared'];
        if ($certified) {
            $row['certificate_document_id'] = $profile->documents()->create(['type' => 'certificate', 'file_path' => 'c.pdf', 'ocr_status' => 'completed'])->id;
        }
        $profile->languages()->create($row);

        $test = $profile->languageTests()->create([
            'language' => 'de', 'exam_level' => $level, 'level_source' => $certified ? 'certificate' : 'declared',
            'blueprint' => config("language_test.blueprints.{$level}"), 'status' => $published ? 'validated' : 'in_progress',
            'final_cefr' => $published ? $ai : null, 'published_at' => $published ? now() : null,
            'provisional_cefr' => $ai, 'ai_cefr' => $ai, 'outcome' => $ai === $level ? 'confirmed' : 'reclassified',
            'skill_scores' => ['reading' => 70, 'listening' => 65, 'writing' => 62, 'speaking' => 68],
            'skill_results' => ['reading' => $level, 'listening' => $level, 'writing' => $level, 'speaking' => $ai],
            'sections' => ['oral' => ['status' => 'done', 'level' => $ai]],
            'review_note' => null, 'started_at' => now()->subHour(), 'completed_at' => now(),
        ]);

        if ($published) {
            app(LanguageLevelReconciler::class)->applyValidatedTest($test);
        }

        return [$test, $profile];
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    /** Same gate as recruiter search: consents and submission. */
    private function makeDiscoverable(CandidateProfile $profile): void
    {
        $profile->update(['first_name' => 'Test', 'last_name' => 'Kandidat', 'terms_consent_at' => now(), 'cndp_consent_at' => now(), 'submitted_at' => now()]);
    }
}
