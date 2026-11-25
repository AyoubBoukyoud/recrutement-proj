<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecruitmentCenter;
use App\Models\TrainingStudent;
use App\Services\Timetable\SchedulingService;
use App\Services\Training\TrainingHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Students of a training centre and their group memberships. Same access model
 * as the timetable: platform administrators, or centre members by role.
 * Status and group changes are effective-dated (TrainingHistory), so earlier
 * months keep the groups and formations they were billed under.
 */
class TrainingStudentController extends Controller
{
    public function __construct(private SchedulingService $scheduling, private TrainingHistory $history) {}

    public function index(Request $request, RecruitmentCenter $center): JsonResponse
    {
        $this->scheduling->authorizeRoles($request->user(), $center, SchedulingService::STUDENT_READ_ROLES);
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(TrainingStudent::STATUSES)],
            'group_id' => ['sometimes', 'integer'],
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);
        $students = TrainingStudent::where('center_id', $center->id)->with(['memberships', 'periods'])
            ->when($data['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($data['group_id'] ?? null, fn ($q, $id) => $q->whereHas('memberships', fn ($m) => $m->where('group_id', $id)->whereNull('ended_on')))
            ->when($data['search'] ?? null, function ($q, $search) {
                $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
                $q->where(fn ($w) => $w->where('first_name', 'like', $like)->orWhere('last_name', 'like', $like)->orWhere('phone', 'like', $like)->orWhere('email', 'like', $like));
            })
            ->orderBy('last_name')->orderBy('first_name')->get();

        return response()->json(['students' => $students->map->toApi()]);
    }

    public function store(Request $request, RecruitmentCenter $center): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center, true);
        $data = $request->validate([...$this->rules(required: true), 'group_ids' => ['sometimes', 'array', 'max:20'], 'group_ids.*' => ['integer', 'distinct']]);
        $student = DB::transaction(function () use ($center, $data) {
            $this->scheduling->lock($center);
            $student = TrainingStudent::create([
                ...$this->clean($data),
                'center_id' => $center->id,
                'status' => 'active',
                'registered_on' => $data['registered_on'] ?? TrainingHistory::today(),
            ]);
            // Groups chosen at registration start on the registration date.
            $this->history->register($center, $student, $data['group_ids'] ?? []);

            return $student;
        }, 5);

        return response()->json($this->fresh($student), 201);
    }

    public function update(Request $request, RecruitmentCenter $center, int $id): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center, true);
        $data = $request->validate([
            ...$this->rules(required: false),
            'status' => ['sometimes', Rule::in(TrainingStudent::STATUSES)],
            'status_effective_on' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:'.TrainingHistory::today()],
        ]);
        $student = DB::transaction(function () use ($center, $id, $data) {
            $this->scheduling->lock($center);
            $student = TrainingStudent::where('center_id', $center->id)->findOrFail($id);
            $changes = $this->clean($data);
            if (isset($changes['registered_on'])) {
                $this->history->moveRegistration($student, $changes['registered_on']);
                unset($changes['registered_on']);
            }
            $student->fill($changes)->save();
            if (isset($data['status']) && $data['status'] !== $student->status) {
                $date = $data['status_effective_on'] ?? TrainingHistory::today();
                $data['status'] === 'inactive' ? $this->history->deactivate($center, $student, $date) : $this->history->reactivate($center, $student, $date);
            }

            return $student;
        }, 5);

        return response()->json($this->fresh($student));
    }

    /** Only a record created by mistake (no payment history) can be deleted; otherwise deactivate it. */
    public function destroy(Request $request, RecruitmentCenter $center, int $id): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center, true);
        DB::transaction(function () use ($center, $id) {
            $this->scheduling->lock($center);
            $student = TrainingStudent::where('center_id', $center->id)->findOrFail($id);
            abort_if($student->payments()->withTrashed()->exists(), 422, 'Cet étudiant a un historique de paiements : désactivez-le plutôt que de le supprimer.');
            $student->delete();
        }, 5);

        return response()->json(null, 204);
    }

    /** Sets the current groups from `effective_on` (default today): assignment, reassignment and removal. */
    public function groups(Request $request, RecruitmentCenter $center, int $id): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center, true);
        $data = $request->validate([
            'group_ids' => ['present', 'array', 'max:20'],
            'group_ids.*' => ['integer', 'distinct'],
            'effective_on' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:'.TrainingHistory::today()],
        ]);
        $student = DB::transaction(function () use ($center, $id, $data) {
            $this->scheduling->lock($center);
            $student = TrainingStudent::where('center_id', $center->id)->findOrFail($id);
            abort_if($student->status !== 'active' && $data['group_ids'], 422, 'Réactivez cet étudiant avant de l’affecter à un groupe.');
            $this->history->syncGroups($center, $student, $data['group_ids'], $data['effective_on'] ?? TrainingHistory::today());

            return $student;
        }, 5);

        return response()->json($this->fresh($student));
    }

    private function fresh(TrainingStudent $student): array
    {
        return $student->fresh(['memberships', 'periods'])->toApi();
    }

    private function rules(bool $required): array
    {
        $presence = $required ? 'required' : 'sometimes';

        return [
            'first_name' => [$presence, 'string', 'max:100'],
            'last_name' => [$presence, 'string', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30', 'regex:/^\+?[0-9 ().-]{6,30}$/'],
            'email' => ['sometimes', 'nullable', 'email', 'max:150'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'level' => ['sometimes', 'nullable', Rule::in(TrainingStudent::LEVELS)],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'registered_on' => ['sometimes', 'date_format:Y-m-d'],
        ];
    }

    private function clean(array $data): array
    {
        $fields = array_intersect_key($data, array_flip(['first_name', 'last_name', 'phone', 'email', 'city', 'level', 'notes', 'registered_on']));
        foreach ($fields as $key => $value) {
            if (is_string($value)) {
                $value = $key === 'notes' ? trim($value) : preg_replace('/\s+/u', ' ', trim($value));
                $fields[$key] = $value === '' && ! in_array($key, ['first_name', 'last_name'], true) ? null : $value;
            }
        }
        foreach (['first_name', 'last_name'] as $key) {
            abort_if(array_key_exists($key, $fields) && $fields[$key] === '', 422, 'Le nom et le prénom sont obligatoires.');
        }

        return $fields;
    }
}
