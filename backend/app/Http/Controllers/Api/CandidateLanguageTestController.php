<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LanguageTest;
use App\Models\LanguageTestResponse;
use App\Services\CandidateProfileResolver;
use App\Services\LanguageTest\ExamAssembler;
use App\Services\LanguageTest\ExamBlueprint;
use App\Services\LanguageTest\ExamRefusal;
use App\Services\LanguageTest\LanguageTestSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * The candidate's side of the AMUD level exam. Nothing returned here ever
 * carries an answer key, a listening script or a per-question result while
 * the exam is running — only, once Phase 1 is scored, the per-skill scores
 * and the provisional level.
 */
class CandidateLanguageTestController extends Controller
{
    public function __construct(
        private readonly LanguageTestSession $session,
        private readonly ExamAssembler $assembler,
        private readonly ExamBlueprint $blueprint,
    ) {}

    /** What the candidate would sit, whether it is possible now, and any sitting in progress. */
    public function overview(Request $request): JsonResponse
    {
        $language = $request->validate(['language' => ['sometimes', Rule::in($this->blueprint->languages())]])['language'] ?? 'de';
        $profile = CandidateProfileResolver::resolve($request->user());

        ['level' => $level, 'source' => $source] = $this->assembler->examLevel($profile, $language);
        $available = $this->assembler->availableLevels($language);
        $active = $this->session->active($profile, $language);
        $latest = $profile->languageTests()->where('language', $language)->latest('id')->first();

        return response()->json([
            'language' => $language,
            'exam_level' => $level,
            'level_source' => $source,
            'available_levels' => $available,
            'exam_available' => $level ? in_array($level, $available, true) : $available !== [],
            'cooldown_until' => $this->session->cooldownUntil($profile, $language)?->toIso8601String(),
            'active_test_id' => $active?->id,
            'latest_test_id' => $latest?->id,
            'exams' => collect($level ? [$level] : $available)->mapWithKeys(fn ($l) => [$l => $this->outline($l)]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'language' => ['required', Rule::in($this->blueprint->languages())],
            'level' => ['sometimes', 'nullable', Rule::in($this->blueprint->levels())],
            'consent' => ['accepted'],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());

        return $this->refusable(function () use ($profile, $data) {
            $test = $this->session->start($profile, $data['language'], $data['level'] ?? null);

            return response()->json($this->state($test), 201);
        });
    }

    public function show(Request $request, LanguageTest $languageTest): JsonResponse
    {
        $this->authorizeOwner($request, $languageTest);
        $this->session->closeOverdue($languageTest);
        $this->session->recoverStalled($languageTest);

        return response()->json($this->state($languageTest->fresh()));
    }

    public function startSection(Request $request, LanguageTest $languageTest, string $section): JsonResponse
    {
        $this->authorizeOwner($request, $languageTest);

        return $this->refusable(fn () => response()->json($this->state($this->session->startSection($languageTest, $section)->fresh())));
    }

    public function completeSection(Request $request, LanguageTest $languageTest, string $section): JsonResponse
    {
        $this->authorizeOwner($request, $languageTest);

        return $this->refusable(fn () => response()->json($this->state($this->session->completeSection($languageTest, $section))));
    }

    public function answer(Request $request, LanguageTest $languageTest, LanguageTestResponse $response): JsonResponse
    {
        $this->authorizeResponse($request, $languageTest, $response);
        $data = $request->validate([
            'answer' => ['required', 'array'],
            'time_ms' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:86400000'],
        ]);

        return $this->refusable(function () use ($languageTest, $response, $data) {
            $this->session->saveAnswer($languageTest, $response->load('item'), $data['answer'], $data['time_ms'] ?? null);

            return response()->json(['saved' => true]);
        });
    }

    public function recording(Request $request, LanguageTest $languageTest, LanguageTestResponse $response): JsonResponse
    {
        $this->authorizeResponse($request, $languageTest, $response);
        $request->validate([
            'audio' => [$response->section === 'oral' ? 'prohibited' : 'required', 'file', 'mimes:wav,mp3,m4a,mp4,webm,weba,ogg,oga,aac,caf', 'max:20480'],
            // The live oral's camera recording, kept for the reviewer only.
            'video' => [$response->section === 'oral' ? 'required' : 'prohibited', 'file', 'mimes:webm,mp4,mov,qt,mkv', 'max:51200'],
        ]);

        return $this->refusable(function () use ($request, $languageTest, $response) {
            $response->load('item');
            $response->section === 'oral'
                ? $this->session->saveOralRecording($languageTest, $response, $request->file('video'))
                : $this->session->saveRecording($languageTest, $response, $request->file('audio'));

            return response()->json(['saved' => true], 201);
        });
    }

    /** Phase 2: show one speaking situation; its clock starts now. */
    public function reveal(Request $request, LanguageTest $languageTest, LanguageTestResponse $response): JsonResponse
    {
        $this->authorizeResponse($request, $languageTest, $response);

        return $this->refusable(fn () => response()->json($this->session->reveal($languageTest, $response->load('item'))));
    }

    public function play(Request $request, LanguageTest $languageTest, LanguageTestResponse $response): JsonResponse
    {
        $this->authorizeResponse($request, $languageTest, $response);

        return $this->refusable(fn () => response()->json($this->session->play($languageTest, $response->load('item'))));
    }

    public function integrity(Request $request, LanguageTest $languageTest): JsonResponse
    {
        $this->authorizeOwner($request, $languageTest);
        $data = $request->validate([
            'event' => ['required', 'in:tab_hidden,paste,copy,fullscreen_exit'],
            'section' => ['sometimes', 'nullable', 'string', 'max:20'],
        ]);

        if (in_array($languageTest->status, ['in_progress', 'scoring'], true)) {
            $this->session->recordIntegrity($languageTest, $data['event'], $data['section'] ?? null);
        }

        return response()->json(['recorded' => true]);
    }

    /** @return array<string, mixed> */
    private function state(LanguageTest $test): array
    {
        $current = $test->current_section;
        $sectionState = $test->sections[$current] ?? [];
        $open = $test->status === 'in_progress' && ($sectionState['status'] ?? null) === 'active';

        $items = [];
        if ($open) {
            $items = $test->responses()->with('item')->where('section', $current)->orderBy('position')->get()
                ->map(fn (LanguageTestResponse $r) => $current === 'oral' ? [
                    // Nothing about the situation — not even its title — before it is revealed.
                    'response_id' => $r->id,
                    'item' => ['id' => $r->item->id, 'skill' => 'oral', 'task_type' => $r->item->task_type, 'title' => null, 'content' => []],
                    'answer' => null,
                    'has_recording' => filled($r->audio_path),
                    'plays_left' => null,
                    'oral' => $this->session->oralPayload($r),
                ] : [
                    'response_id' => $r->id,
                    'item' => $r->item->candidatePayload(),
                    'answer' => $r->answer,
                    'has_recording' => filled($r->audio_path),
                    'plays_left' => $current === 'listening'
                        ? max(0, (int) ($r->item->content['plays'] ?? $test->blueprint['listening']['plays'] ?? 1) - $r->plays)
                        : null,
                ])->all();
        }

        $phaseOneDone = $test->phaseOneComplete();
        $reviewing = $test->status === 'awaiting_review';

        return [
            'id' => $test->id,
            'language' => $test->language,
            'exam_level' => $test->exam_level,
            'level_source' => $test->level_source,
            'status' => $test->status,
            'current_section' => $current,
            'sections' => collect($test->sections ?? [])->map(fn ($s, $name) => [
                ...$s,
                'minutes' => $test->blueprint[$name]['minutes'] ?? null,
                'tasks' => count($test->blueprint[$name]['tasks'] ?? []),
            ]),
            'items' => $items,
            'server_time' => Carbon::now()->toIso8601String(),
            'grace_seconds' => LanguageTestSession::GRACE_SECONDS,
            'outcome' => $reviewing ? null : $test->outcome,
            'provisional' => $phaseOneDone ? [
                'cefr' => $test->provisional_cefr,
                'outcome' => $reviewing ? null : $test->outcome,
                'skill_scores' => $reviewing ? null : $test->skill_scores,
                'skill_results' => $reviewing ? null : $test->skill_results,
                'summary' => $reviewing ? null : $test->summary,
            ] : null,
            'oral_level' => $test->sections['oral']['level'] ?? null,
            // Under review the AI's verdict is not shown: it may still change.
            'ai_cefr' => $test->status === 'validated' ? $test->ai_cefr : null,
            'final_cefr' => $test->status === 'validated' ? $test->final_cefr : null,
            'final_skill_results' => $test->status === 'validated' ? $test->skill_results : null,
        ];
    }

    /** @return array<string, array{minutes: int|null, tasks: int}> */
    private function outline(string $level): array
    {
        return collect($this->blueprint->forLevel($level))
            ->map(fn ($section) => ['minutes' => $section['minutes'] ?? null, 'tasks' => count($section['tasks'])])
            ->all();
    }

    private function refusable(callable $action): JsonResponse
    {
        try {
            return $action();
        } catch (ExamRefusal $e) {
            return response()->json(['message' => $e->getMessage(), 'reason' => $e->reason], $e->status);
        }
    }

    private function authorizeOwner(Request $request, LanguageTest $test): void
    {
        abort_unless($test->candidate_profile_id === $request->user()->candidateProfile?->id, 404);
    }

    private function authorizeResponse(Request $request, LanguageTest $test, LanguageTestResponse $response): void
    {
        $this->authorizeOwner($request, $test);
        abort_unless($response->language_test_id === $test->id, 404);
    }
}
