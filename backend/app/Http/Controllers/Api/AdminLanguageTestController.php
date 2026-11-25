<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\LanguageTest;
use App\Models\LanguageTestResponse;
use App\Services\LanguageAssessment\LanguageLevelReconciler;
use App\Services\LanguageTest\ExamBlueprint;
use App\Services\Notifications;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Review of the AMUD level exam: an administrator reads what the AI
 * concluded — every answer, every recording, the evidence the grader quoted,
 * the integrity log — and approves it, corrects the level or annuls the
 * sitting. A1–B1 results are published automatically and corrected only when
 * needed; B2 and above wait for approval (config language_test.review_levels).
 */
class AdminLanguageTestController extends Controller
{
    public function __construct(private readonly ExamBlueprint $blueprint) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'in:in_progress,scoring,awaiting_review,validated,abandoned,failed'],
            'needs_attention' => ['sometimes', 'boolean'],
            'level' => ['sometimes', Rule::in($this->blueprint->levels())],
            'q' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:100'],
        ]);

        $query = LanguageTest::query()
            ->with(['candidateProfile:id,user_id,first_name,last_name,profession', 'candidateProfile.user:id,name,phone', 'reviewer:id,name'])
            ->when($filters['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when(array_key_exists('needs_attention', $filters), fn ($q) => $q->where('needs_attention', filter_var($filters['needs_attention'], FILTER_VALIDATE_BOOLEAN)))
            ->when($filters['level'] ?? null, fn ($q, $l) => $q->where('exam_level', $l))
            ->when($filters['q'] ?? null, function ($q, $term) {
                $like = '%'.$term.'%';
                $q->whereHas('candidateProfile', fn ($p) => $p->where('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhereHas('user', fn ($u) => $u->where('phone', 'like', $like)->orWhere('name', 'like', $like)));
            })
            // Results waiting for approval first, then unresolved flags.
            ->orderByRaw("status = 'awaiting_review' desc")
            ->orderByDesc('needs_attention')
            ->orderBy('completed_at')
            ->orderByDesc('id');

        $page = $query->paginate($filters['per_page'] ?? 20);
        $page->setCollection($page->getCollection()->map(fn (LanguageTest $t) => $this->summary($t)));

        return response()->json($page);
    }

    public function show(LanguageTest $languageTest): JsonResponse
    {
        $test = $languageTest->load(['candidateProfile.user:id,name,phone', 'candidateProfile.languages', 'reviewer:id,name']);
        $sign = fn (?string $path) => $path ? Storage::disk('local')->temporaryUrl($path, now()->addMinutes(30)) : null;

        $responses = $test->responses()->with('item')->orderBy('position')->get()->map(fn (LanguageTestResponse $r) => [
            'id' => $r->id,
            'section' => $r->section,
            'status' => $r->status,
            'score' => $r->score,
            'is_correct' => $r->is_correct,
            'plays' => $r->plays,
            'time_ms' => $r->time_ms,
            'revealed_at' => $r->revealed_at?->toIso8601String(),
            'answer' => $r->answer,
            'evaluation' => $r->evaluation,
            'audio_url' => $sign($r->audio_path),
            'video_url' => $sign($r->video_path),
            'item' => [
                ...$r->item->adminPayload(),
            ],
        ]);

        $language = $test->candidateProfile->languages->firstWhere('language', $test->language);

        return response()->json([
            ...$this->summary($test),
            'sections' => $test->sections,
            'skill_scores' => $test->skill_scores,
            'skill_results' => $test->skill_results,
            'summary' => $test->summary,
            'integrity' => $test->integrity,
            'review_note' => $test->review_note,
            'candidate_language' => $language?->only(['cefr_level', 'self_declared_cefr', 'source', 'certificate_document_id', 'tested_cefr', 'certificate_confirmed']),
            'responses' => $responses,
        ]);
    }

    /** Publish the AI's result for an exam held for review (config language_test.review_levels) as it stands. */
    public function approve(Request $request, LanguageTest $languageTest, LanguageLevelReconciler $reconciler, Notifications $notifications): JsonResponse
    {
        $data = $request->validate(['note' => ['sometimes', 'nullable', 'string', 'max:2000']]);

        $approved = DB::transaction(function () use ($request, $languageTest, $data, $reconciler) {
            $test = LanguageTest::query()->lockForUpdate()->findOrFail($languageTest->id);
            if ($test->status !== 'awaiting_review') {
                return false;
            }
            $note = trim((string) ($data['note'] ?? '')) ?: null;
            $test->update([
                'status' => 'validated',
                'final_cefr' => $test->ai_cefr,
                'review_note' => $note,
                'reviewed_by_id' => $request->user()->id,
                'reviewed_at' => now(),
                'published_at' => now(),
                'needs_attention' => false,
            ]);
            $reconciler->applyValidatedTest($test->fresh('candidateProfile'));
            AdminActivityLog::record($request->user(), $test->candidateProfile, 'language_test_approved', [
                'language_test_id' => $test->id, 'final_cefr' => $test->final_cefr, 'note' => $note,
            ]);

            return true;
        });
        if (! $approved) {
            return response()->json(['message' => 'Only an exam awaiting review can be approved.'], 409);
        }
        $notifications->languageTestReviewed($languageTest->fresh());

        return $this->show($languageTest->fresh());
    }

    /** Correct an already published result, or supply missing skills after a technical failure. */
    public function correctResult(Request $request, LanguageTest $languageTest, LanguageLevelReconciler $reconciler, Notifications $notifications): JsonResponse
    {
        $data = $request->validate([
            'final_cefr' => ['present', 'nullable', Rule::in($this->blueprint->levels())],
            'skill_results' => ['sometimes', 'array:reading,listening,writing,speaking'],
            'skill_results.*' => ['nullable', Rule::in($this->blueprint->levels())],
            'note' => ['required', 'string', 'max:2000', 'not_regex:/^\\s*$/u'],
        ]);

        $saved = DB::transaction(function () use ($request, $languageTest, $data, $reconciler) {
            $test = LanguageTest::query()->lockForUpdate()->findOrFail($languageTest->id);
            if (! in_array($test->status, ['validated', 'failed', 'awaiting_review'], true)) {
                return false;
            }
            $skills = ($data['skill_results'] ?? []) + ($test->skill_results ?? []);
            if (array_diff(['reading', 'listening', 'writing', 'speaking'], array_keys($data['final_cefr'] === null ? $skills : array_filter($skills)))) {
                return null;
            }
            $lowest = min(array_map(fn ($level) => LanguageLevelReconciler::rank($level), $skills));
            if (LanguageLevelReconciler::rank($data['final_cefr']) !== $lowest) {
                return 'inconsistent_skills';
            }
            $before = ['final_cefr' => $test->final_cefr, 'skill_results' => $test->skill_results];
            $test->update([
                'status' => 'validated',
                'final_cefr' => $data['final_cefr'],
                'skill_results' => $skills,
                'outcome' => $data['final_cefr'] === null ? 'not_demonstrated' : (LanguageLevelReconciler::rank($data['final_cefr']) < LanguageLevelReconciler::rank($test->exam_level) ? 'reclassified' : 'confirmed'),
                'review_note' => trim($data['note']),
                'reviewed_by_id' => $request->user()->id,
                'reviewed_at' => now(),
                'published_at' => $test->published_at ?? now(),
                'needs_attention' => false,
            ]);
            $reconciler->applyValidatedTest($test->fresh('candidateProfile'));
            AdminActivityLog::record($request->user(), $test->candidateProfile, 'language_test_corrected', [
                'language_test_id' => $test->id, 'before' => $before,
                'final_cefr' => $test->final_cefr, 'skill_results' => $skills, 'note' => $test->review_note,
            ]);

            return true;
        });
        if ($saved === false) {
            return response()->json(['message' => 'Only a finished exam can be corrected.'], 409);
        }
        if ($saved === null) {
            return response()->json(['message' => 'Supply a level for every missing skill.', 'errors' => ['skill_results' => ['All four skill levels are required.']]], 422);
        }
        if ($saved === 'inconsistent_skills') {
            return response()->json(['message' => 'The final level must match the lowest skill level. Correct the relevant skills as well.', 'errors' => ['final_cefr' => ['The final level must match the lowest skill level.']]], 422);
        }
        $notifications->languageTestReviewed($languageTest->fresh());

        return $this->show($languageTest->fresh());
    }

    /** Annul a result and remove its effect from the profile and recruiter search. */
    public function annul(Request $request, LanguageTest $languageTest, LanguageLevelReconciler $reconciler, Notifications $notifications): JsonResponse
    {
        $data = $request->validate(['note' => ['required', 'string', 'max:2000', 'not_regex:/^\\s*$/u']]);

        DB::transaction(function () use ($request, $languageTest, $data, $reconciler) {
            $test = LanguageTest::query()->lockForUpdate()->findOrFail($languageTest->id);
            $test->update([
                'status' => 'abandoned', 'final_cefr' => null,
                'review_note' => trim($data['note']),
                'reviewed_by_id' => $request->user()->id,
                'reviewed_at' => now(), 'needs_attention' => false,
            ]);
            $reconciler->removeTestResult($test->fresh('candidateProfile'));
            AdminActivityLog::record($request->user(), $test->candidateProfile, 'language_test_annulled', [
                'language_test_id' => $test->id, 'note' => $data['note'],
            ]);
        });
        $notifications->languageTestReviewed($languageTest->fresh());

        return $this->show($languageTest->fresh());
    }

    /** @return array<string, mixed> */
    private function summary(LanguageTest $test): array
    {
        $profile = $test->candidateProfile;

        return [
            'id' => $test->id,
            'language' => $test->language,
            'exam_level' => $test->exam_level,
            'level_source' => $test->level_source,
            'status' => $test->status,
            'outcome' => $test->outcome,
            'provisional_cefr' => $test->provisional_cefr,
            'ai_cefr' => $test->ai_cefr,
            'final_cefr' => $test->final_cefr,
            'oral_level' => $test->sections['oral']['level'] ?? null,
            'needs_attention' => $test->needs_attention,
            'flags' => $test->integrity['flags'] ?? [],
            'started_at' => $test->started_at?->toIso8601String(),
            'completed_at' => $test->completed_at?->toIso8601String(),
            'reviewed_at' => $test->reviewed_at?->toIso8601String(),
            'published_at' => $test->published_at?->toIso8601String(),
            'reviewer' => $test->reviewer?->only(['id', 'name']),
            'candidate' => [
                'profile_id' => $profile?->id,
                'name' => trim(($profile?->first_name ?? '').' '.($profile?->last_name ?? '')) ?: $profile?->user?->name,
                'phone' => $profile?->user?->phone,
                'profession' => $profile?->profession,
            ],
        ];
    }
}
