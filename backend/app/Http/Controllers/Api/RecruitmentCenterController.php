<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecruitmentCenter;
use App\Models\RecruitmentCenterNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * A shared call log for training/recruitment centers a commercial or
 * administrator has reached out to. Both roles see the same list and the
 * same notes — the point is that two agents don't call the same center
 * unaware of each other, see routes/api.php.
 */
class RecruitmentCenterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:150'],
            'category' => ['sometimes', 'nullable', 'in:'.implode(',', RecruitmentCenter::CATEGORIES)],
            'call_status' => ['sometimes', 'nullable', 'in:'.implode(',', RecruitmentCenter::CALL_STATUSES)],
            'offer_status' => ['sometimes', 'nullable', 'in:'.implode(',', RecruitmentCenter::OFFER_STATUSES)],
        ]);

        $centers = RecruitmentCenter::query()
            ->withCount('notes')
            ->with(['creator:id,name,phone', 'notes' => fn ($query) => $query->latest('created_at')->limit(1)->with('author:id,name,phone')])
            ->when($filters['q'] ?? null, fn ($query, $q) => $query->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$q}%")
                ->orWhere('city', 'like', "%{$q}%")))
            ->when($filters['category'] ?? null, fn ($query, $category) => $query->where('category', $category))
            ->when($filters['call_status'] ?? null, fn ($query, $status) => $query->where('call_status', $status))
            ->when($filters['offer_status'] ?? null, fn ($query, $status) => $query->where('offer_status', $status))
            ->latest('updated_at')
            ->paginate((int) $request->integer('per_page', 20));

        $centers->getCollection()->transform(fn (RecruitmentCenter $center) => $this->summarize($center));

        return response()->json($centers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $center = RecruitmentCenter::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($this->summarize($this->reloadForSummary($center)), 201);
    }

    public function show(RecruitmentCenter $recruitmentCenter): JsonResponse
    {
        $recruitmentCenter->load(['creator:id,name,phone', 'notes.author:id,name,phone']);

        return response()->json([
            'id' => $recruitmentCenter->id,
            'name' => $recruitmentCenter->name,
            'category' => $recruitmentCenter->category,
            'phone' => $recruitmentCenter->phone,
            'email' => $recruitmentCenter->email,
            'address' => $recruitmentCenter->address,
            'city' => $recruitmentCenter->city,
            'contact_person' => $recruitmentCenter->contact_person,
            'call_status' => $recruitmentCenter->call_status,
            'offer_status' => $recruitmentCenter->offer_status,
            'created_by' => $recruitmentCenter->creator?->name ?? $recruitmentCenter->creator?->phone,
            'created_at' => $recruitmentCenter->created_at,
            'notes' => $recruitmentCenter->notes->map(fn (RecruitmentCenterNote $note) => $this->summarizeNote($note)),
        ]);
    }

    public function update(Request $request, RecruitmentCenter $recruitmentCenter): JsonResponse
    {
        $data = $this->validated($request, sometimes: true);

        $recruitmentCenter->update($data);

        return response()->json($this->summarize($this->reloadForSummary($recruitmentCenter)));
    }

    public function addNote(Request $request, RecruitmentCenter $recruitmentCenter): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $note = $recruitmentCenter->notes()->create([
            'body' => $data['body'],
            'author_id' => $request->user()->id,
        ]);

        // Bumps `updated_at` so the index's "most recently touched" ordering
        // surfaces a center right after someone logs a call with it.
        $recruitmentCenter->touch();

        return response()->json($this->summarizeNote($note->load('author:id,name,phone')), 201);
    }

    private function reloadForSummary(RecruitmentCenter $center): RecruitmentCenter
    {
        // A freshly created row doesn't carry call_status/offer_status in
        // memory — only the database applied their column defaults — so a
        // refresh is needed before the response can report them correctly.
        return $center
            ->refresh()
            ->loadCount('notes')
            ->load([
                'creator:id,name,phone',
                'notes' => fn ($query) => $query->latest('created_at')->limit(1)->with('author:id,name,phone'),
            ]);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, bool $sometimes = false): array
    {
        $rule = $sometimes ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$rule, 'string', 'max:150'],
            'category' => [$rule, 'in:'.implode(',', RecruitmentCenter::CATEGORIES)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'email' => ['sometimes', 'nullable', 'email', 'max:150'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'contact_person' => ['sometimes', 'nullable', 'string', 'max:150'],
            'call_status' => ['sometimes', 'in:'.implode(',', RecruitmentCenter::CALL_STATUSES)],
            'offer_status' => ['sometimes', 'in:'.implode(',', RecruitmentCenter::OFFER_STATUSES)],
        ]);
    }

    /** @return array<string, mixed> */
    private function summarize(RecruitmentCenter $center): array
    {
        $lastNote = $center->notes->first();

        return [
            'id' => $center->id,
            'name' => $center->name,
            'category' => $center->category,
            'phone' => $center->phone,
            'email' => $center->email,
            'address' => $center->address,
            'city' => $center->city,
            'contact_person' => $center->contact_person,
            'call_status' => $center->call_status,
            'offer_status' => $center->offer_status,
            'created_by' => $center->creator?->name ?? $center->creator?->phone,
            'created_at' => $center->created_at,
            'notes_count' => $center->notes_count,
            'last_note' => $lastNote ? $this->summarizeNote($lastNote) : null,
        ];
    }

    /** @return array<string, mixed> */
    private function summarizeNote(RecruitmentCenterNote $note): array
    {
        return [
            'id' => $note->id,
            'body' => $note->body,
            'author' => $note->author?->name ?? $note->author?->phone,
            'created_at' => $note->created_at,
        ];
    }
}
