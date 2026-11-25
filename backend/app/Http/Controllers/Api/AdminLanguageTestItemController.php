<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateLanguageTestItems;
use App\Models\AdminActivityLog;
use App\Models\LanguageTestItem;
use App\Models\LanguageTestResponse;
use App\Services\LanguageTest\ExamBlueprint;
use App\Services\LanguageTest\ItemGenerator;
use App\Services\LanguageTest\ItemShape;
use App\Services\LanguageTest\SpeechSynthesizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * The level-exam bank, for administrators: what the AI drafted, what is
 * approved, and whether each level has enough approved items to run an exam.
 * Approval is the only door from "draft" to something a candidate can sit.
 */
class AdminLanguageTestItemController extends Controller
{
    public function __construct(
        private readonly ExamBlueprint $blueprint,
        private readonly ItemShape $shape,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'language' => ['sometimes', Rule::in($this->blueprint->languages())],
            'level' => ['sometimes', Rule::in($this->blueprint->levels())],
            'skill' => ['sometimes', Rule::in(ExamBlueprint::SKILLS)],
            'task_type' => ['sometimes', Rule::in($this->blueprint->taskTypeNames())],
            'status' => ['sometimes', 'in:draft,approved,retired'],
            'sector' => ['sometimes', Rule::in($this->blueprint->sectors())],
            'q' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:100'],
        ]);

        $query = LanguageTestItem::query()->with('reviewer')->latest('id');
        foreach (['language', 'skill', 'task_type', 'status', 'sector'] as $column) {
            if (! empty($filters[$column])) {
                $query->where($column, $filters[$column]);
            }
        }
        if (! empty($filters['level'])) {
            $query->where('cefr_level', $filters['level']);
        }
        if (! empty($filters['q'])) {
            $query->where('title', 'like', '%'.$filters['q'].'%');
        }

        $page = $query->paginate($filters['per_page'] ?? 20);
        $page->setCollection($page->getCollection()->map(fn (LanguageTestItem $item) => $this->present($item)));

        return response()->json($page);
    }

    public function show(LanguageTestItem $item): JsonResponse
    {
        return response()->json($this->present($item->load('reviewer')));
    }

    /**
     * Per level: what one exam needs, what is approved, what is waiting, and
     * how many complete distinct exams the approved bank can assemble.
     */
    public function coverage(Request $request): JsonResponse
    {
        $language = $request->validate(['language' => ['sometimes', Rule::in($this->blueprint->languages())]])['language'] ?? 'de';
        $target = (int) config('language_test.target_exams_per_level');

        $counts = LanguageTestItem::query()
            ->where('language', $language)
            ->selectRaw('cefr_level, skill, task_type, status, count(*) as total')
            ->groupBy('cefr_level', 'skill', 'task_type', 'status')
            ->get()
            ->groupBy(fn ($row) => "{$row->cefr_level}|{$row->skill}|{$row->task_type}");

        $levels = [];
        foreach ($this->blueprint->levels() as $level) {
            $tasks = [];
            $examsPossible = PHP_INT_MAX;
            foreach ($this->blueprint->requirements($level) as $req) {
                $rows = $counts->get("{$level}|{$req['skill']}|{$req['task_type']}", collect());
                $approved = (int) $rows->where('status', 'approved')->sum('total');
                $draft = (int) $rows->where('status', 'draft')->sum('total');
                $examsPossible = min($examsPossible, intdiv($approved, $req['per_exam']));
                $tasks[] = [...$req, 'approved' => $approved, 'draft' => $draft, 'target' => $req['per_exam'] * $target];
            }
            $levels[] = [
                'level' => $level,
                'exams_possible' => $examsPossible === PHP_INT_MAX ? 0 : $examsPossible,
                'target_exams' => $target,
                'tasks' => $tasks,
            ];
        }

        return response()->json(['language' => $language, 'levels' => $levels]);
    }

    public function update(Request $request, LanguageTestItem $item): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'sector' => ['sometimes', Rule::in($this->blueprint->sectors())],
            'content' => ['sometimes', 'array'],
            'answer_key' => ['sometimes', 'nullable', 'array'],
            'status' => ['sometimes', 'in:draft,approved,retired'],
            'review_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        // A candidate's score was computed against this exact content; changing
        // it afterwards would silently rewrite their result. Retire and replace.
        $changesExam = array_key_exists('content', $data) || array_key_exists('answer_key', $data);
        if ($changesExam && LanguageTestResponse::where('item_id', $item->id)->exists()) {
            return response()->json([
                'message' => 'This item has already been used in an exam and can no longer be edited. Retire it and create a new one.',
            ], 409);
        }

        $item->fill($data);

        if (($data['status'] ?? null) === 'approved') {
            $problems = $this->problems($item);
            if ($problems !== []) {
                return response()->json([
                    'message' => 'The item cannot be approved yet.',
                    'errors' => ['item' => $problems],
                ], 422);
            }
        }

        if (array_key_exists('status', $data) && $item->isDirty('status')) {
            $item->reviewed_by_id = $request->user()->id;
            $item->reviewed_at = now();
        }

        $item->save();

        if ($item->wasChanged('status')) {
            AdminActivityLog::record($request->user(), $item, 'exam_item_'.$item->status, [
                'level' => $item->cefr_level,
                'skill' => $item->skill,
            ]);
        }

        return response()->json($this->present($item->fresh('reviewer')));
    }

    /** An administrator's own recording replaces the synthesised clip. */
    public function uploadAudio(Request $request, LanguageTestItem $item): JsonResponse
    {
        abort_unless($item->skill === 'listening', 422, 'Only listening items carry audio.');

        $request->validate(['audio' => ['required', 'file', 'mimes:mp3,wav,m4a,ogg,webm,aac', 'max:20480']]);

        $path = $request->file('audio')->store('language-test/audio', 'local');
        if ($item->audio_path) {
            Storage::disk('local')->delete($item->audio_path);
        }
        $item->update(['audio_path' => $path]);

        return response()->json($this->present($item->fresh('reviewer')));
    }

    public function synthesizeAudio(LanguageTestItem $item, SpeechSynthesizer $speech): JsonResponse
    {
        abort_unless($item->skill === 'listening', 422, 'Only listening items carry audio.');

        if (! $speech->synthesize($item)) {
            return response()->json(['message' => 'Speech synthesis is unavailable right now. Upload a recording instead.'], 503);
        }

        return response()->json($this->present($item->fresh('reviewer')));
    }

    /** Queue AI drafts for one task of one level exam. */
    public function generate(Request $request, ItemGenerator $generator): JsonResponse
    {
        $data = $request->validate([
            'language' => ['sometimes', Rule::in($this->blueprint->languages())],
            'level' => ['required', Rule::in($this->blueprint->levels())],
            'skill' => ['required', Rule::in(ExamBlueprint::SKILLS)],
            'task_type' => ['required', Rule::in($this->blueprint->taskTypeNames())],
            'sector' => ['sometimes', Rule::in($this->blueprint->sectors())],
            'count' => ['sometimes', 'integer', 'min:1', 'max:5'],
        ]);

        if (! $this->blueprint->task($data['level'], $data['skill'], $data['task_type'])) {
            return response()->json(['message' => "The {$data['level']} exam has no {$data['skill']} task of that type."], 422);
        }
        if (! $generator->isConfigured()) {
            return response()->json(['message' => 'Item generation needs GEMINI_API_KEY on the server.'], 503);
        }

        GenerateLanguageTestItems::dispatch(
            $data['language'] ?? 'de',
            $data['level'],
            $data['skill'],
            $data['task_type'],
            $data['sector'] ?? 'general',
            $data['count'] ?? 1,
        );

        return response()->json(['message' => 'Generation queued. Drafts will appear in the list as they are written.'], 202);
    }

    /** @return list<string> */
    private function problems(LanguageTestItem $item): array
    {
        $task = $this->blueprint->task($item->cefr_level, $item->skill, $item->task_type);
        if (! $task) {
            return ["The {$item->cefr_level} exam no longer has a {$item->skill} task of type {$item->task_type}."];
        }

        $problems = $this->shape->problems($item->task_type, $task, $item->content ?? [], $item->answer_key);
        if ($item->needsAudio() && ! $item->hasAudio()) {
            $problems[] = 'A listening item needs its audio clip (synthesise or upload one).';
        }

        return $problems;
    }

    /** @return array<string, mixed> */
    private function present(LanguageTestItem $item): array
    {
        return [...$item->adminPayload(), 'problems' => $this->problems($item)];
    }
}
