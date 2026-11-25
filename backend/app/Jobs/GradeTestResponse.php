<?php

namespace App\Jobs;

use App\Models\LanguageTest;
use App\Models\LanguageTestResponse;
use App\Services\LanguageTest\ExamFinalizer;
use App\Services\LanguageTest\PhaseOneFinalizer;
use App\Services\LanguageTest\ProductiveGrader;
use App\Services\LanguageTest\ReadAloudScorer;
use App\Services\LanguageTest\UnreliableGrading;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/** A durable lease covers both running work and normal queue backoff. */
class GradeTestResponse implements ShouldQueue
{
    use Queueable;

    public int $tries = 6;

    public int $timeout = 600;

    public const RECOVERY_GRACE_SECONDS = 600;

    /** @var list<int> */
    public array $backoff = [30, 120, 300, 600, 900];

    // A property default also covers jobs serialized before leases were added.
    public ?string $gradingToken = null;

    public function __construct(public readonly int $responseId, ?string $gradingToken = null)
    {
        $this->gradingToken = $gradingToken;
    }

    /** Claim once, including concurrent uploads/recovery requests. Lost claims can expire. */
    public static function enqueue(int $responseId): void
    {
        DB::transaction(function () use ($responseId) {
            $response = LanguageTestResponse::query()->lockForUpdate()->find($responseId);
            if (! $response || in_array($response->status, ['graded', 'failed'], true)
                || $response->grading_due_at?->isFuture()) {
                return;
            }

            $token = (string) Str::uuid();
            $response->update([
                'grading_token' => $token,
                'grading_due_at' => now()->addSeconds((new self($responseId))->timeout + self::RECOVERY_GRACE_SECONDS),
            ]);
            DB::afterCommit(fn () => self::dispatch($responseId, $token));
        });
    }

    public function handle(ReadAloudScorer $readAloud, ProductiveGrader $grader, PhaseOneFinalizer $finalizer, ExamFinalizer $examFinalizer): void
    {
        // Protect against redelivery of the same job while a worker still owns it.
        $lock = Cache::lock('language-test-grading:'.$this->responseId, $this->timeout + 60);
        if (! $lock->get()) {
            return;
        }

        try {
            $response = LanguageTestResponse::with(['item', 'languageTest'])->find($this->responseId);
            if (! $this->owns($response)) {
                return;
            }

            $test = $response->languageTest;
            $evaluation = $response->evaluation ?? [];
            unset($evaluation['error']);
            $response->update([
                'status' => 'grading', 'evaluation' => $evaluation ?: null,
                'grading_due_at' => now()->addSeconds($this->timeout + self::RECOVERY_GRACE_SECONDS),
            ]);

            try {
                $result = match ($response->section) {
                    'read_aloud' => $readAloud->score($response, $test->language),
                    'writing' => $grader->gradeWriting($response, $test->exam_level, $test->language),
                    'oral' => $grader->gradeOral($response, $test->sections['oral']['level'] ?? $test->exam_level, $test->language),
                    default => null,
                };
            } catch (Throwable $e) {
                $attempt = $this->job?->attempts() ?? 1;
                $delay = $this->backoff[min($attempt - 1, count($this->backoff) - 1)];
                LanguageTestResponse::whereKey($response->id)->where('grading_token', $this->gradingToken)
                    ->update([
                        'grading_due_at' => now()->addSeconds($delay + self::RECOVERY_GRACE_SECONDS),
                        'evaluation' => $e instanceof UnreliableGrading ? $e->evaluation : ($response->evaluation ?? []),
                    ]);
                throw $e;
            }

            DB::transaction(function () use ($response, $result, $finalizer, $examFinalizer) {
                LanguageTest::query()->lockForUpdate()->find($response->language_test_id);
                $current = LanguageTestResponse::with('languageTest')->lockForUpdate()->find($response->id);
                // Recovery may have replaced a dead worker's claim. Its late result is obsolete.
                if (! $this->owns($current)) {
                    return;
                }
                $current->update($result === null ? [
                    'status' => 'failed', 'grading_due_at' => null,
                    'evaluation' => ['error' => $current->section === 'read_aloud' ? 'transcription_unavailable' : 'grader_unavailable'],
                ] : [
                    'status' => 'graded', 'score' => $result['score'], 'evaluation' => $result['evaluation'], 'grading_due_at' => null,
                ]);
                $finalizer->maybeFinalize($current->languageTest);
                $examFinalizer->maybeFinalize($current->languageTest);
            });
        } finally {
            $lock->release();
        }
    }

    private function owns(?LanguageTestResponse $response): bool
    {
        return $response && $response->grading_token === $this->gradingToken
            && ! in_array($response->status, ['graded', 'failed'], true)
            && in_array($response->languageTest?->status, ['in_progress', 'scoring'], true);
    }

    public function failed(?Throwable $e): void
    {
        DB::transaction(function () {
            $testId = LanguageTestResponse::whereKey($this->responseId)->value('language_test_id');
            LanguageTest::query()->lockForUpdate()->find($testId);
            $response = LanguageTestResponse::with('languageTest')->lockForUpdate()->find($this->responseId);
            if (! $this->owns($response)) {
                return;
            }
            $response->update([
                'status' => 'failed', 'grading_due_at' => null,
                'evaluation' => [...($response->evaluation ?? []), 'error' => 'grading_error'],
            ]);
            app(PhaseOneFinalizer::class)->maybeFinalize($response->languageTest);
            app(ExamFinalizer::class)->maybeFinalize($response->languageTest);
        });
    }
}
