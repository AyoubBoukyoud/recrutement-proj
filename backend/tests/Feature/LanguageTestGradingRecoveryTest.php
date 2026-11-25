<?php

namespace Tests\Feature;

use App\Jobs\GradeTestResponse;
use App\Models\LanguageTestItem;
use App\Models\LanguageTestResponse;
use App\Services\Gemini\GeminiTransientFailure;
use App\Services\LanguageTest\ExamFinalizer;
use App\Services\LanguageTest\LanguageTestSession;
use App\Services\LanguageTest\PhaseOneFinalizer;
use App\Services\LanguageTest\ProductiveGrader;
use App\Services\LanguageTest\ReadAloudScorer;
use App\Services\LanguageTest\UnreliableGrading;
use Illuminate\Contracts\Queue\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Tests\Concerns\LanguageExamFixtures;
use Tests\TestCase;

class LanguageTestGradingRecoveryTest extends TestCase
{
    use LanguageExamFixtures, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpLanguageExam();
    }

    private function response(): LanguageTestResponse
    {
        $this->seedBank('B1');
        $profile = $this->candidateWithCertificate('B1');
        $test = $profile->languageTests()->create([
            'language' => 'de', 'exam_level' => 'B1', 'level_source' => 'certificate',
            'blueprint' => config('language_test.blueprints.B1'), 'status' => 'in_progress',
            'current_section' => 'writing', 'sections' => ['writing' => ['status' => 'pending']],
        ]);

        return $test->responses()->create([
            'item_id' => LanguageTestItem::where('task_type', 'informal_email')->first()->id,
            'section' => 'writing', 'status' => 'grading',
            'answer' => ['text' => str_repeat('Ich freue mich sehr auf den gemeinsamen Abend. ', 12)],
        ]);
    }

    private function runJob(GradeTestResponse $job): void
    {
        $job->handle(app(ReadAloudScorer::class), app(ProductiveGrader::class), app(PhaseOneFinalizer::class), app(ExamFinalizer::class));
    }

    public function test_disagreement_and_incomplete_marks_retry_without_publishing_a_score(): void
    {
        $response = $this->response();
        Queue::fake();
        GradeTestResponse::enqueue($response->id);
        $job = Queue::pushed(GradeTestResponse::class)->first();
        $replies = [];
        Http::fake(function () use (&$replies) {
            return Http::response(array_shift($replies));
        });
        foreach ([[90, 50], [59, 60], [70, null]] as [$first, $second]) {
            $replies = [self::grading($first), $second === null ? ['output_text' => '{}'] : self::grading($second)];
            try {
                $this->runJob($job);
                $this->fail('An uncertain mark must request a retry.');
            } catch (UnreliableGrading) {
                $this->assertNull($response->fresh()->score);
                $this->assertSame('grading', $response->fresh()->status);
                $this->assertTrue($response->fresh()->grading_due_at->isFuture());
                $this->assertTrue($response->fresh()->evaluation['disagreement']);
                $this->assertNull($response->languageTest->final_cefr);
            }
        }
        $replies = [self::grading(70), self::grading(72)];
        $this->runJob($job);
        $this->assertSame('graded', $response->fresh()->status);
        $this->assertSame(71, $response->fresh()->score);
        $this->assertFalse($response->fresh()->evaluation['disagreement']);
    }

    public function test_exhausting_inconsistent_grading_never_turns_it_into_a_mark(): void
    {
        $response = $this->response();
        Queue::fake();
        GradeTestResponse::enqueue($response->id);
        $job = Queue::pushed(GradeTestResponse::class)->first();
        Http::fakeSequence()->push(self::grading(90))->push(self::grading(40));
        try {
            $this->runJob($job);
            $this->fail('Expected an inconsistent grading.');
        } catch (UnreliableGrading $e) {
            $job->failed($e);
        }
        $this->assertSame('failed', $response->fresh()->status);
        $this->assertNull($response->fresh()->score);
        $this->assertTrue($response->fresh()->evaluation['disagreement']);
        $this->assertNull($response->languageTest->final_cefr);
    }

    public function test_normal_backoff_is_not_recovered_and_obsolete_jobs_cannot_write(): void
    {
        $response = $this->response();
        Queue::fake();
        $overloaded = true;
        Http::fake(function () use (&$overloaded) {
            return $overloaded ? Http::response(['error' => 'overloaded'], 503) : Http::response(self::grading(70));
        });
        GradeTestResponse::enqueue($response->id);
        $original = Queue::pushed(GradeTestResponse::class)->first();
        $original->setJob(Mockery::mock(Job::class, function ($mock) {
            $mock->shouldReceive('attempts')->andReturn(5);
        }));
        try {
            $this->runJob($original);
            $this->fail('An overloaded API should request a queue retry.');
        } catch (GeminiTransientFailure) {
            $this->assertTrue($response->fresh()->grading_due_at->isFuture());
        }

        $this->travel(11)->minutes();
        app(LanguageTestSession::class)->recoverStalled($response->languageTest);
        Queue::assertPushed(GradeTestResponse::class, 1);

        // A genuinely lost job can be replaced after its backoff and recovery grace.
        $this->travel(15)->minutes();
        app(LanguageTestSession::class)->recoverStalled($response->languageTest);
        Queue::assertPushed(GradeTestResponse::class, 2);
        $replacement = Queue::pushed(GradeTestResponse::class)->last();
        $this->assertNotSame($original->gradingToken, $replacement->gradingToken);
        $original->failed(new \RuntimeException('Late failure from the obsolete worker.'));
        $this->runJob($original);
        $this->assertSame('grading', $response->fresh()->status);
        Http::assertSentCount(1);

        $overloaded = false;
        $this->runJob($replacement);
        $this->assertSame('graded', $response->fresh()->status);
        $this->assertSame(70, $response->fresh()->score);
        $original->failed(new \RuntimeException('Old retry exhausted.'));
        $this->assertSame(70, $response->fresh()->score);
    }

    public function test_repeated_dispatch_and_simultaneous_delivery_are_idempotent(): void
    {
        $response = $this->response();
        Queue::fake();
        $this->fakeGrader(70);
        GradeTestResponse::enqueue($response->id);
        GradeTestResponse::enqueue($response->id);
        Queue::assertPushed(GradeTestResponse::class, 1);
        $job = Queue::pushed(GradeTestResponse::class)->first();
        $lock = Cache::lock('language-test-grading:'.$response->id, 660);
        $this->assertTrue($lock->get());
        try {
            $this->runJob($job);
            Http::assertNothingSent();
        } finally {
            $lock->release();
        }
        $this->runJob($job);
        $this->runJob($job);
        $this->assertSame(70, $response->fresh()->score);
        Http::assertSentCount(2); // Exactly the two independent marking runs.
    }

    public function test_a_job_serialized_before_grading_leases_can_still_finish(): void
    {
        $response = $this->response();
        $this->fakeGrader(70);
        $class = GradeTestResponse::class;
        $legacy = unserialize(sprintf('O:%d:"%s":1:{s:10:"responseId";i:%d;}', strlen($class), $class, $response->id));
        $this->runJob($legacy);
        $this->assertSame('graded', $response->fresh()->status);
        $this->assertSame(70, $response->fresh()->score);
    }
}
