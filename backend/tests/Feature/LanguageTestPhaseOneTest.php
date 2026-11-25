<?php

namespace Tests\Feature;

use App\Models\LanguageTest;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\LanguageExamFixtures;
use Tests\TestCase;

class LanguageTestPhaseOneTest extends TestCase
{
    use LanguageExamFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpLanguageExam();
    }

    public function test_a_certified_b1_candidate_finishes_phase_one_without_a_premature_level(): void
    {
        $this->seedBank('B1');
        $profile = $this->candidateWithCertificate('B1');
        $this->fakeGrader(72);

        $this->getJson('/api/candidate/language-tests/overview?language=de')
            ->assertOk()
            ->assertJsonPath('exam_level', 'B1')
            ->assertJsonPath('level_source', 'certificate')
            ->assertJsonPath('exam_available', true)
            ->assertJsonPath('exams.B1.reading.tasks', 3);

        $this->postJson('/api/candidate/language-tests', ['language' => 'de'])->assertStatus(422);

        $test = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])
            ->assertCreated()
            ->assertJsonPath('exam_level', 'B1')
            ->assertJsonPath('current_section', 'reading')
            ->assertJsonPath('items', [])
            ->json();

        $this->runPhaseOne($test['id'], correct: true);

        $state = $this->getJson("/api/candidate/language-tests/{$test['id']}")->assertOk()->json();
        $this->assertSame('in_progress', $state['status']);
        $this->assertSame('oral', $state['current_section']);
        $this->assertNull($state['provisional']['cefr']);
        $this->assertNull($state['provisional']['outcome']);
        $this->assertSame(100, $state['provisional']['skill_scores']['reading']);
        $this->assertSame(72, $state['provisional']['skill_scores']['writing']);
        $this->assertNull($state['provisional']['skill_scores']['speaking']);
        $this->assertSame(100, $state['provisional']['skill_scores']['read_aloud']);
        $this->assertSame(['Clear structure'], $state['provisional']['summary']['strengths']);
    }

    public function test_weak_reading_does_not_invent_a_lower_level(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');
        $this->fakeGrader(70);

        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');
        $this->runPhaseOne($id, correct: false);

        $state = $this->getJson("/api/candidate/language-tests/{$id}")->json();
        $this->assertNull($state['provisional']['outcome']);
        // Wrong answers do not demonstrate any lower level.
        $this->assertNull($state['provisional']['cefr']);
    }

    public function test_the_exam_never_leaks_keys_or_scripts(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');

        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');
        $this->postJson("/api/candidate/language-tests/{$id}/sections/reading/complete")->assertOk();
        $body = $this->postJson("/api/candidate/language-tests/{$id}/sections/listening/start")->assertOk()->getContent();

        $this->assertStringNotContainsString('answer_key', $body);
        $this->assertStringNotContainsString('script', $body);
        $this->assertStringNotContainsString('explanations', $body);
        $this->assertStringNotContainsString('audio_path', $body);
    }

    public function test_listening_clips_play_only_as_often_as_the_level_allows(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');

        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');
        $this->postJson("/api/candidate/language-tests/{$id}/sections/reading/complete");
        $items = $this->postJson("/api/candidate/language-tests/{$id}/sections/listening/start")->json('items');
        $rid = $items[0]['response_id'];
        $this->assertSame(2, $items[0]['plays_left']);

        $this->postJson("/api/candidate/language-tests/{$id}/responses/{$rid}/play")->assertOk()->assertJsonPath('plays_left', 1);
        $this->postJson("/api/candidate/language-tests/{$id}/responses/{$rid}/play")->assertOk()->assertJsonPath('plays_left', 0);
        $this->postJson("/api/candidate/language-tests/{$id}/responses/{$rid}/play")->assertStatus(409)->assertJsonPath('reason', 'no_plays_left');
    }

    public function test_answers_are_refused_after_the_section_clock_and_it_closes_itself(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');

        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');
        $items = $this->postJson("/api/candidate/language-tests/{$id}/sections/reading/start")->json('items');

        $this->travel(21 + 2)->minutes(); // B1 reading is 20 minutes, plus the grace

        $this->putJson("/api/candidate/language-tests/{$id}/responses/{$items[0]['response_id']}", ['answer' => ['answers' => ['q1' => 'a']]])
            ->assertStatus(409);

        $this->getJson("/api/candidate/language-tests/{$id}")
            ->assertJsonPath('current_section', 'listening')
            ->assertJsonPath('sections.reading.status', 'done');
    }

    public function test_sections_cannot_be_skipped_or_reopened(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');

        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');
        $this->postJson("/api/candidate/language-tests/{$id}/sections/writing/start")->assertStatus(409);

        $items = $this->postJson("/api/candidate/language-tests/{$id}/sections/reading/start")->json('items');
        $this->postJson("/api/candidate/language-tests/{$id}/sections/reading/complete")->assertOk();
        $this->putJson("/api/candidate/language-tests/{$id}/responses/{$items[0]['response_id']}", ['answer' => ['answers' => []]])
            ->assertStatus(409);
    }

    public function test_a_copied_task_scores_zero_without_asking_the_model(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');
        Http::fake();

        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');
        foreach (['reading', 'listening', 'read_aloud'] as $s) {
            $this->postJson("/api/candidate/language-tests/{$id}/sections/{$s}/complete");
        }
        $items = $this->postJson("/api/candidate/language-tests/{$id}/sections/writing/start")->json('items');
        foreach ($items as $entry) {
            $c = $entry['item']['content'];
            $this->putJson("/api/candidate/language-tests/{$id}/responses/{$entry['response_id']}", [
                'answer' => ['text' => str_repeat($c['situation'].' '.$c['instructions'].' ', 3)],
            ])->assertOk();
        }
        $this->postJson("/api/candidate/language-tests/{$id}/sections/writing/complete")->assertOk();

        Http::assertNothingSent();
        $test = LanguageTest::find($id);
        $this->assertSame(0, $test->skill_scores['writing']);
        $this->assertSame('copied_prompt', $test->responses()->where('section', 'writing')->first()->evaluation['guard']);
    }

    public function test_without_any_level_on_file_the_candidate_chooses_one(): void
    {
        $this->seedBank('A2');
        $user = User::factory()->create();
        CandidateProfileResolver::resolve($user);
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/candidate/language-tests/overview')
            ->assertJsonPath('exam_level', null)
            ->assertJsonPath('level_source', 'chosen')
            ->assertJsonPath('available_levels', ['A2']);

        $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])
            ->assertStatus(422)->assertJsonPath('reason', 'level_required');

        $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true, 'level' => 'A2'])
            ->assertCreated()->assertJsonPath('level_source', 'chosen');
    }

    public function test_an_exam_without_an_approved_bank_cannot_start(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B2');

        $this->getJson('/api/candidate/language-tests/overview')->assertJsonPath('exam_available', false);
        $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])
            ->assertStatus(409)->assertJsonPath('reason', 'exam_unavailable');
    }

    public function test_one_sitting_at_a_time_and_a_cooldown_after_it(): void
    {
        $this->seedBank('B1');
        $profile = $this->candidateWithCertificate('B1');

        $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->assertCreated();
        $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])
            ->assertStatus(409)->assertJsonPath('reason', 'in_progress');

        $profile->languageTests()->update(['status' => 'awaiting_review']);
        $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])
            ->assertStatus(429)->assertJsonPath('reason', 'cooldown');

        $this->travel(31)->days();
        $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->assertCreated();
    }

    public function test_another_candidate_cannot_see_or_answer_the_exam(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');
        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');

        $other = User::factory()->create();
        CandidateProfileResolver::resolve($other);
        $this->actingAs($other, 'sanctum');

        $this->getJson("/api/candidate/language-tests/{$id}")->assertNotFound();
        $this->postJson("/api/candidate/language-tests/{$id}/sections/reading/start")->assertNotFound();
    }

    public function test_integrity_events_are_counted(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');
        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');

        $this->postJson("/api/candidate/language-tests/{$id}/integrity", ['event' => 'tab_hidden', 'section' => 'reading'])->assertOk();
        $this->postJson("/api/candidate/language-tests/{$id}/integrity", ['event' => 'paste', 'section' => 'writing'])->assertOk();

        $integrity = LanguageTest::find($id)->integrity;
        $this->assertSame(1, $integrity['tab_hidden']);
        $this->assertSame(1, $integrity['paste_blocked']);
        $this->assertCount(2, $integrity['events']);
    }

    public function test_a_grading_that_never_finished_is_queued_again_when_the_exam_is_viewed(): void
    {
        $this->seedBank('B1');
        $this->candidateWithCertificate('B1');
        $this->fakeGrader(72);

        $id = $this->postJson('/api/candidate/language-tests', ['language' => 'de', 'consent' => true])->json('id');
        $this->runPhaseOne($id, correct: true);

        // Simulate a job lost mid-call: the exam is back in scoring, one writing answer stuck in grading.
        $test = LanguageTest::find($id);
        $stuck = $test->responses()->where('section', 'writing')->first();
        $stuck->update(['status' => 'grading', 'score' => null]);
        $test->update(['status' => 'scoring', 'provisional_cefr' => null, 'summary' => null, 'current_section' => 'writing']);

        $this->getJson("/api/candidate/language-tests/{$id}")->assertJsonPath('status', 'scoring');

        $this->travel(11)->minutes();
        $this->getJson("/api/candidate/language-tests/{$id}");

        $this->assertSame('graded', $stuck->fresh()->status);
        $this->assertTrue(LanguageTest::find($id)->phaseOneComplete());
        $this->assertNull(LanguageTest::find($id)->provisional_cefr);
    }
}
