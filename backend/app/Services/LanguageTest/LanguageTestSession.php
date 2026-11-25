<?php

namespace App\Services\LanguageTest;

use App\Jobs\GradeTestResponse;
use App\Models\CandidateProfile;
use App\Models\LanguageTest;
use App\Models\LanguageTestResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * The rules of one exam sitting, Phase 1: sections run in a fixed order,
 * each against its own clock that starts when the candidate opens it;
 * answers are accepted only for the open section and only until its
 * deadline (plus a short grace for the network); a section left open past
 * its deadline closes itself with whatever was saved.
 */
class LanguageTestSession
{
    /** Network slack after a section's deadline before answers are refused. */
    public const GRACE_SECONDS = 60;

    /** A grading still pending after this long is assumed lost and queued again. */
    public const STALL_MINUTES = 10;

    /** Time to allow the camera, frame the face and read the instructions. */
    private const ORAL_SETUP_SECONDS = 600;

    /** Read-aloud recordings are capped well above any text's reading time. */
    private const MAX_RECORDING_KB = 20480;

    public function __construct(
        private readonly ExamBlueprint $blueprint,
        private readonly ExamAssembler $assembler,
        private readonly KeyScorer $keyScorer,
        private readonly PhaseOneFinalizer $finalizer,
        private readonly ExamFinalizer $examFinalizer,
    ) {}

    /** The sitting in progress (or being scored) for this language, if any. */
    public function active(CandidateProfile $profile, string $language): ?LanguageTest
    {
        return $profile->languageTests()
            ->where('language', $language)
            ->whereIn('status', ['in_progress', 'scoring'])
            ->latest('id')
            ->first();
    }

    /** When the candidate may sit this language's exam again, if not now. */
    public function cooldownUntil(CandidateProfile $profile, string $language): ?Carbon
    {
        $last = $profile->languageTests()
            ->where('language', $language)
            ->whereIn('status', ['awaiting_review', 'validated', 'abandoned'])
            ->latest('started_at')
            ->first();

        $until = $last?->started_at?->copy()->addDays((int) config('language_test.retake_cooldown_days'));

        return $until && $until->isFuture() ? $until : null;
    }

    public function start(CandidateProfile $profile, string $language, ?string $chosenLevel): LanguageTest
    {
        if ($this->active($profile, $language)) {
            throw new ExamRefusal('You already have an exam in progress.', 409, 'in_progress');
        }
        if ($until = $this->cooldownUntil($profile, $language)) {
            throw new ExamRefusal('You can take this exam again from '.$until->toDateString().'.', 429, 'cooldown');
        }

        ['level' => $level, 'source' => $source] = $this->assembler->examLevel($profile, $language);
        if ($level === null) {
            if (! $chosenLevel) {
                throw new ExamRefusal('Choose the level you want to be tested at.', 422, 'level_required');
            }
            $level = $chosenLevel;
        }

        if (! $this->assembler->isAvailable($language, $level)) {
            throw new ExamRefusal("The {$level} exam is not available yet.", 409, 'exam_unavailable');
        }

        return DB::transaction(function () use ($profile, $language, $level, $source) {
            $sections = [];
            foreach ([...config('language_test.phase_one_sections'), ...config('language_test.phase_two_sections')] as $name) {
                $sections[$name] = ['status' => 'pending'];
            }

            $test = $profile->languageTests()->create([
                'language' => $language,
                'exam_level' => $level,
                'level_source' => $source,
                'blueprint' => $this->blueprint->forLevel($level),
                'status' => 'in_progress',
                'current_section' => config('language_test.phase_one_sections')[0],
                'sections' => $sections,
                'integrity' => ['tab_hidden' => 0, 'paste_blocked' => 0, 'events' => []],
                'consented_at' => now(),
                'started_at' => now(),
            ]);

            $this->assembler->draw($test, config('language_test.phase_one_sections'));

            return $test;
        });
    }

    /** Opens the current section and starts its clock. Idempotent. */
    public function startSection(LanguageTest $test, string $section): LanguageTest
    {
        $this->closeOverdue($test);
        $this->assertCurrent($test, $section);

        $sections = $test->sections;
        if ($section === 'oral' && ($sections['oral']['status'] ?? 'pending') === 'pending') {
            return $this->startOral($test);
        }
        if (($sections[$section]['status'] ?? 'pending') === 'pending') {
            $minutes = (int) ($test->blueprint[$section]['minutes'] ?? 10);
            $sections[$section] = [
                'status' => 'active',
                'started_at' => now()->toIso8601String(),
                'deadline_at' => now()->addMinutes($minutes)->toIso8601String(),
            ];
            $test->update(['sections' => $sections]);
        }

        return $test;
    }

    /** @param  array<string, mixed>  $answer */
    public function saveAnswer(LanguageTest $test, LanguageTestResponse $response, array $answer, ?int $timeMs): LanguageTestResponse
    {
        // A section closing and its final save must serialize on the same row.
        return DB::transaction(function () use ($test, $response, $answer, $timeMs) {
            $test = LanguageTest::query()->lockForUpdate()->findOrFail($test->id);
            $this->assertWritable($test, $response);
            if (in_array($response->section, ['read_aloud', 'oral'], true)) {
                throw new ExamRefusal('This task is answered with a recording.', 422);
            }

            $response->update([
                'answer' => $this->cleanAnswer($response, $answer),
                'time_ms' => $timeMs,
                'status' => 'answered',
            ]);

            return $response;
        });
    }

    public function saveRecording(LanguageTest $test, LanguageTestResponse $response, UploadedFile $audio): LanguageTestResponse
    {
        return DB::transaction(function () use ($test, $response, $audio) {
            $test = LanguageTest::query()->lockForUpdate()->findOrFail($test->id);
            $response->refresh()->load('item');
            $this->assertWritable($test, $response);
            if ($response->section !== 'read_aloud') {
                throw new ExamRefusal('Only the read-aloud task takes a recording.', 422);
            }
            if ($response->audio_path) {
                throw new ExamRefusal('This recording has already been submitted.', 409);
            }
            if ($audio->getSize() > self::MAX_RECORDING_KB * 1024) {
                throw new ExamRefusal('The recording is too large.', 422);
            }

            $path = $audio->store("language-test/responses/{$test->id}", 'local');
            $response->update(['audio_path' => $path, 'status' => 'answered']);

            // Transcription takes a while; start it now rather than at section end.
            GradeTestResponse::enqueue($response->id);

            return $response->fresh();
        });
    }

    /**
     * Phase 2 checks spontaneous speech at the chosen exam level.
     * A failed Phase 1 does not establish a lower level for the oral.
     * The situations are drawn now and stay hidden until each is revealed.
     */
    private function startOral(LanguageTest $test): LanguageTest
    {
        if (! $test->phaseOneComplete()) {
            throw new ExamRefusal('Phase 1 is not finished yet.', 409, 'section_closed');
        }

        $level = $this->assembler->oralLevel($test->language, $test->exam_level);
        if ($level === null) {
            throw new ExamRefusal('The speaking test is not available yet.', 409, 'exam_unavailable');
        }

        return DB::transaction(function () use ($test, $level) {
            if (! $test->responses()->where('section', 'oral')->exists()) {
                $this->assembler->draw($test, ['oral'], $level);
            }

            // Every task's preparation and answer time, plus room to set up the camera.
            $seconds = $test->responses()->with('item')->where('section', 'oral')->get()
                ->sum(fn ($r) => (int) ($r->item->content['prep_seconds'] ?? 30) + (int) ($r->item->content['answer_seconds'] ?? 60));

            $sections = $test->sections;
            $sections['oral'] = [
                'status' => 'active',
                'level' => $level,
                'started_at' => now()->toIso8601String(),
                'deadline_at' => now()->addSeconds($seconds + self::ORAL_SETUP_SECONDS)->toIso8601String(),
            ];
            $test->update(['sections' => $sections]);

            return $test;
        });
    }

    /**
     * Shows one oral situation, at a moment the candidate did not choose (the
     * page triggers it after a random delay once the camera is live). From
     * here the clock runs: preparation + answer + grace, then the recording
     * is refused.
     *
     * @return array<string, mixed>
     */
    public function reveal(LanguageTest $test, LanguageTestResponse $response): array
    {
        return DB::transaction(function () use ($test, $response) {
            $test = LanguageTest::query()->lockForUpdate()->findOrFail($test->id);
            $response->refresh()->load('item');
            $this->assertWritable($test, $response);
            if ($response->section !== 'oral') {
                throw new ExamRefusal('Only speaking tasks are revealed.', 422);
            }

            if (! $response->revealed_at) {
                $open = $test->responses()->with('item')->where('section', 'oral')
                    ->whereNotNull('revealed_at')->whereNull('audio_path')
                    ->get()
                    ->first(fn ($r) => ! $this->windowClosed($r));
                if ($open && $open->id !== $response->id) {
                    throw new ExamRefusal('Finish the current speaking task first.', 409, 'task_open');
                }

                $response->update(['revealed_at' => now()]);
            }

            return $this->oralPayload($response->fresh('item'));
        });
    }

    /** @return array<string, mixed> */
    public function oralPayload(LanguageTestResponse $response): array
    {
        $content = $response->item->content ?? [];

        return [
            'response_id' => $response->id,
            'revealed_at' => $response->revealed_at?->toIso8601String(),
            'content' => $response->revealed_at ? [
                'situation' => $content['situation'] ?? '',
                'instructions' => $content['instructions'] ?? '',
                'points' => $content['points'] ?? [],
            ] : null,
            'prep_seconds' => (int) ($content['prep_seconds'] ?? 30),
            'answer_seconds' => (int) ($content['answer_seconds'] ?? 60),
            'server_time' => now()->toIso8601String(),
        ];
    }

    /**
     * The live answer: the audio track (graded) and, when the camera was on,
     * the video (kept for the reviewer). Only accepted inside the window the
     * reveal opened — no rehearsing offline, no uploading something else later.
     */
    public function saveOralRecording(LanguageTest $test, LanguageTestResponse $response, UploadedFile $video): LanguageTestResponse
    {
        return DB::transaction(function () use ($test, $response, $video) {
            $test = LanguageTest::query()->lockForUpdate()->findOrFail($test->id);
            $response->refresh()->load('item');
            $this->assertWritable($test, $response);
            if ($response->section !== 'oral') {
                throw new ExamRefusal('This task does not take a live recording.', 422);
            }
            if (! $response->revealed_at) {
                throw new ExamRefusal('The situation has not been shown yet.', 409, 'not_revealed');
            }
            if ($response->audio_path) {
                throw new ExamRefusal('This recording has already been submitted.', 409);
            }
            if ($this->windowClosed($response)) {
                throw new ExamRefusal('The time for this task is over.', 409, 'too_late');
            }

            $dir = "language-test/responses/{$test->id}";
            $path = $video->store($dir, 'local');
            $response->update([
                // The grader extracts the audio from this exact video. Separate
                // client-supplied audio can never substitute another speaker.
                'audio_path' => $path,
                'video_path' => $path,
                'time_ms' => (int) $response->revealed_at->diffInMilliseconds(now()),
                'status' => 'answered',
            ]);

            GradeTestResponse::enqueue($response->id);

            return $response->fresh();
        });
    }

    private function windowClosed(LanguageTestResponse $response): bool
    {
        $content = $response->item->content ?? [];
        $window = (int) ($content['prep_seconds'] ?? 30) + (int) ($content['answer_seconds'] ?? 60) + self::GRACE_SECONDS;

        return $response->revealed_at !== null && $response->revealed_at->copy()->addSeconds($window)->isPast();
    }

    /**
     * Hands out the listening clip, counting each play against the level's
     * limit. Returns a short-lived signed URL.
     */
    public function play(LanguageTest $test, LanguageTestResponse $response): array
    {
        $this->assertWritable($test, $response);
        if ($response->section !== 'listening' || ! $response->item->audio_path) {
            throw new ExamRefusal('This task has no audio.', 422);
        }

        $allowed = (int) ($response->item->content['plays'] ?? $test->blueprint['listening']['plays'] ?? 1);
        if ($response->plays >= $allowed) {
            throw new ExamRefusal('You have used every play for this recording.', 409, 'no_plays_left');
        }

        $response->increment('plays');

        return [
            'url' => Storage::disk('local')->temporaryUrl($response->item->audio_path, now()->addMinutes(5)),
            'plays_left' => $allowed - $response->plays,
        ];
    }

    public function completeSection(LanguageTest $test, string $section): LanguageTest
    {
        $this->closeOverdue($test);
        if (($test->sections[$section]['status'] ?? null) === 'done') {
            return $test->fresh();
        }
        $this->assertCurrent($test, $section);

        $this->close($test, $section);

        return $test->fresh();
    }

    /**
     * A grading whose job never finished (a worker restarted mid-call, an
     * API timeout that exhausted its retries without reaching `failed()`)
     * would leave the exam in "scoring" for ever. Anything still waiting
     * after STALL_MINUTES is queued again; called whenever the sitting is
     * looked at, so the candidate's own polling heals it.
     */
    public function recoverStalled(LanguageTest $test): void
    {
        if (! in_array($test->status, ['in_progress', 'scoring'], true)) {
            return;
        }

        $stalled = $test->responses()
            ->where(fn ($q) => $q->where('grading_due_at', '<=', now())
                ->orWhere(fn ($q) => $q->whereNull('grading_due_at')->where('updated_at', '<', now()->subMinutes(self::STALL_MINUTES))))
            ->where(fn ($q) => $q->where('status', 'grading')
                ->orWhere(fn ($q) => $q->where('status', 'answered')->whereNotNull('audio_path')))
            ->get();

        foreach ($stalled as $response) {
            GradeTestResponse::enqueue($response->id);
        }
    }

    /** A section whose clock ran out closes itself with what was saved. */
    public function closeOverdue(LanguageTest $test): void
    {
        $current = $test->current_section;
        $state = $test->sections[$current] ?? null;
        if (($state['status'] ?? null) === 'active'
            && Carbon::parse($state['deadline_at'])->addSeconds(self::GRACE_SECONDS)->isPast()) {
            $this->close($test, $current);
            $test->refresh();
        }
    }

    public function recordIntegrity(LanguageTest $test, string $event, ?string $section): void
    {
        $integrity = $test->integrity ?? [];
        $counter = ['tab_hidden' => 'tab_hidden', 'paste' => 'paste_blocked', 'copy' => 'copy_blocked'][$event] ?? null;
        if ($counter) {
            $integrity[$counter] = ($integrity[$counter] ?? 0) + 1;
        }
        $events = $integrity['events'] ?? [];
        $events[] = ['event' => $event, 'section' => $section, 'at' => now()->toIso8601String()];
        $integrity['events'] = array_slice($events, -100);

        $test->update(['integrity' => $integrity]);
    }

    private function close(LanguageTest $test, string $section): void
    {
        DB::transaction(function () use ($test, $section) {
            $test = LanguageTest::query()->lockForUpdate()->findOrFail($test->id);
            if (($test->sections[$section]['status'] ?? null) === 'done') {
                return;
            }
            $this->assertCurrent($test, $section);
            $responses = $test->responses()->with('item')->where('section', $section)->get();

            foreach ($responses as $response) {
                $this->scoreOnClose($response);
            }

            $sections = $test->sections;
            $sections[$section] = [...($sections[$section] ?? []), 'status' => 'done', 'completed_at' => now()->toIso8601String()];

            $order = config('language_test.phase_one_sections');
            $position = array_search($section, $order, true);
            $next = $position === false ? null : ($order[$position + 1] ?? null);

            $integrity = $test->integrity ?? [];
            if ($this->suspiciouslyFast($test, $section, $sections[$section], $responses)) {
                $integrity['too_fast'] = [...($integrity['too_fast'] ?? []), $section];
            }

            $test->update([
                'sections' => $sections,
                'current_section' => $next ?? $test->current_section,
                'status' => $next ? 'in_progress' : 'scoring',
                'integrity' => $integrity,
                'completed_at' => $next ? null : now(),
            ]);
        });

        if ($test->fresh()->status === 'scoring') {
            $this->finalizer->maybeFinalize($test);
            $this->examFinalizer->maybeFinalize($test);
        }
    }

    private function scoreOnClose(LanguageTestResponse $response): void
    {
        $item = $response->item;
        $scoring = $this->blueprint->taskType($item->task_type)['scoring'];

        if ($scoring === 'key') {
            $result = $this->keyScorer->score($item, $response->answer);
            $response->update([
                'score' => $result['score'],
                'is_correct' => $result['correct'] === $result['total'],
                'evaluation' => ['correct' => $result['correct'], 'total' => $result['total'], 'detail' => $result['detail']],
                'status' => 'graded',
            ]);

            return;
        }

        if ($response->section === 'oral') {
            // Queued on upload; a task never recorded scores 0.
            if (! $response->audio_path) {
                $response->update(['score' => 0, 'status' => 'graded', 'evaluation' => ['guard' => 'no_recording']]);
            }

            return;
        }

        if ($scoring === 'alignment') {
            // Already queued on upload; nothing recorded means nothing to grade.
            if (! $response->audio_path) {
                $response->update(['score' => 0, 'status' => 'graded', 'evaluation' => ['guard' => 'no_recording']]);
            }

            return;
        }

        // Rubric (writing): an empty answer scores 0 without a model call.
        if (trim((string) ($response->answer['text'] ?? '')) === '') {
            $response->update(['score' => 0, 'status' => 'graded', 'evaluation' => ['guard' => 'empty']]);

            return;
        }

        $response->update(['status' => 'grading']);
        GradeTestResponse::enqueue($response->id);
    }

    /** A strong receptive score in under a fifth of the time is worth a human look. */
    private function suspiciouslyFast(LanguageTest $test, string $section, array $state, $responses): bool
    {
        if (! in_array($section, ['reading', 'listening'], true) || empty($state['started_at'])) {
            return false;
        }

        $allowed = (int) ($test->blueprint[$section]['minutes'] ?? 10) * 60;
        $used = Carbon::parse($state['started_at'])->diffInSeconds(now());
        $correct = $responses->sum(fn ($r) => $r->fresh()->evaluation['correct'] ?? 0);
        $total = max(1, $responses->sum(fn ($r) => $r->fresh()->evaluation['total'] ?? 0));

        return $used < $allowed * 0.2 && $correct / $total >= 0.85;
    }

    /** Keep only what the task can hold; never trust the shape a client sends. */
    private function cleanAnswer(LanguageTestResponse $response, array $answer): array
    {
        $item = $response->item;
        $family = $this->blueprint->family($item->task_type);

        if ($family === 'questions') {
            $ids = array_column($item->content['questions'] ?? [], 'id');
            $given = (array) ($answer['answers'] ?? []);

            return ['answers' => array_map('strval', array_filter(
                array_intersect_key($given, array_flip($ids)),
                fn ($v) => is_scalar($v),
            ))];
        }

        if ($family === 'form') {
            $ids = array_column($item->content['fields'] ?? [], 'id');

            return ['fields' => array_map(
                fn ($v) => mb_substr((string) $v, 0, 200),
                array_filter(array_intersect_key((array) ($answer['fields'] ?? []), array_flip($ids)), 'is_scalar'),
            )];
        }

        return ['text' => mb_substr((string) ($answer['text'] ?? ''), 0, 12000)];
    }

    private function assertCurrent(LanguageTest $test, string $section): void
    {
        if ($test->status !== 'in_progress' || $test->current_section !== $section) {
            throw new ExamRefusal('This section is not open.', 409, 'section_closed');
        }
    }

    private function assertWritable(LanguageTest $test, LanguageTestResponse $response): void
    {
        $this->closeOverdue($test);
        $test->refresh();

        $state = $test->sections[$response->section] ?? null;
        if ($test->status !== 'in_progress' || $test->current_section !== $response->section || ($state['status'] ?? null) !== 'active') {
            throw new ExamRefusal('This section is closed.', 409, 'section_closed');
        }
    }
}
