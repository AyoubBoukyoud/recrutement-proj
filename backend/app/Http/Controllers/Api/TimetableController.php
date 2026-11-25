<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecruitmentCenter;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Timetable\SchedulingService;
use App\Services\Training\TrainingHistory;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TimetableController extends Controller
{
    private const RESOURCES = ['teachers', 'modules', 'groups', 'rooms'];

    public function __construct(private SchedulingService $scheduling, private TrainingHistory $history) {}

    public function centers(Request $request): JsonResponse
    {
        $user = $request->user();
        $admin = $user->hasRole('Administrator');
        abort_unless($admin || $user->hasRole('Training Center'), 403);
        $centers = RecruitmentCenter::where('category', 'training_center')
            ->when(! $admin, fn ($q) => $q->whereIn('id', DB::table('training_center_members')->where('user_id', $user->id)->select('center_id')))
            ->orderBy('name')->get(['id', 'name']);
        $roles = DB::table('training_center_members')->where('user_id', $user->id)->pluck('role', 'center_id');

        $can = fn (int $id, array $allowed) => $admin || in_array($roles[$id] ?? '', $allowed, true);

        return response()->json(['centers' => $centers->map(fn ($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'role' => $admin ? 'ADMINISTRATOR' : ($roles[$c->id] ?? null),
            'can_manage' => $can($c->id, SchedulingService::WRITE_ROLES),
            'can_view_students' => $can($c->id, SchedulingService::STUDENT_READ_ROLES),
            'can_manage_finance' => $can($c->id, SchedulingService::FINANCE_ROLES),
        ]), 'timezone' => SchedulingService::TIMEZONE]);
    }

    public function resources(Request $request, RecruitmentCenter $center): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center);
        $data = [];
        foreach (['teachers', 'rooms'] as $resource) {
            $data[$resource] = DB::table('training_'.$resource)->where('center_id', $center->id)->orderBy('name')->get(['id', 'name']);
        }
        // `monthly_fee` stays the fee in force this month; `fees` is the dated history.
        $fees = TrainingHistory::feeHistory($center->id);
        $month = TrainingHistory::currentMonth();
        $data['modules'] = DB::table('training_modules')->where('center_id', $center->id)->orderBy('name')->get(['id', 'name', 'level'])
            ->map(function ($row) use ($fees, $month) {
                $current = TrainingHistory::feeAt($fees, $row->id, $month);

                return [...(array) $row, 'monthly_fee' => $current['amount'] ?? null, 'fee_effective_from' => $current['effective_from'] ?? null, 'fees' => $fees[$row->id] ?? []];
            });
        $data['groups'] = DB::table('training_groups')->where('center_id', $center->id)->orderBy('name')
            ->select(['id', 'name', 'module_id', 'teacher_id', 'room_id', 'capacity'])
            ->selectSub(DB::table('training_group_students')->whereColumn('group_id', 'training_groups.id')->whereNull('ended_on')->selectRaw('count(*)'), 'student_count')
            ->get()->map(fn ($row) => [...(array) $row, 'student_count' => (int) $row->student_count]);

        return response()->json($data);
    }

    public function saveResource(Request $request, RecruitmentCenter $center, string $resource, ?int $id = null): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center, true);
        abort_unless(in_array($resource, self::RESOURCES, true), 404);
        $data = $request->validate(['name' => ['required', 'string', 'max:150'], ...$this->detailRules($resource, $center)]);
        $name = preg_replace('/\s+/u', ' ', trim($data['name']));
        abort_if($name === '', 422, 'Un nom est requis.');
        $key = mb_strtolower($name);
        // Optional details are only written when sent, so a rename keeps them.
        $details = array_intersect_key($data, $this->detailRules($resource, $center));
        // Fee and formation changes are history, not columns: applied below from an explicit date.
        $fee = array_key_exists('monthly_fee', $details) ? ['amount' => $details['monthly_fee'] === null ? null : (float) $details['monthly_fee'], 'from' => $details['fee_effective_from'] ?? TrainingHistory::currentMonth()] : null;
        $formationFrom = $details['formation_effective_on'] ?? TrainingHistory::today();
        unset($details['monthly_fee'], $details['fee_effective_from'], $details['formation_effective_on']);
        $record = DB::transaction(function () use ($request, $center, $resource, $id, $name, $key, $details, $fee, $formationFrom) {
            $this->scheduling->lock($center);
            $this->scheduling->authorize($request->user(), $center, true);
            $table = DB::table('training_'.$resource)->where('center_id', $center->id);
            if ($id) {
                abort_unless((clone $table)->where('id', $id)->exists(), 404);
            }
            abort_if((clone $table)->where('name_key', $key)->when($id, fn ($q) => $q->where('id', '!=', $id))->exists(), 422, 'Ce nom existe déjà dans ce centre.');
            if ($resource === 'groups' && isset($details['capacity']) && $id) {
                $members = DB::table('training_group_students')->where('group_id', $id)->whereNull('ended_on')->count();
                abort_if($members > $details['capacity'], 422, "Ce groupe compte déjà $members étudiants : la capacité ne peut pas être inférieure.");
            }
            if ($resource === 'groups' && $id && array_key_exists('module_id', $details)) {
                $this->history->changeGroupFormation($center->id, $id, $details['module_id'], $formationFrom);
            }
            if ($id) {
                (clone $table)->where('id', $id)->update(['name' => $name, 'name_key' => $key, ...$details, 'updated_at' => now()]);
            } else {
                $id = DB::table('training_'.$resource)->insertGetId(['center_id' => $center->id, 'name' => $name, 'name_key' => $key, ...$details, 'created_at' => now(), 'updated_at' => now()]);
            }

            if ($resource === 'modules' && $fee) {
                $this->history->setFee($center->id, $id, $fee['amount'], $fee['from'], $request->user()->id);
            }

            return ['id' => $id, 'name' => $name, ...$details];
        }, 5);

        return response()->json($record, $id ? 200 : 201);
    }

    public function deleteResource(Request $request, RecruitmentCenter $center, string $resource, int $id): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center, true);
        abort_unless(in_array($resource, self::RESOURCES, true), 404);
        DB::transaction(function () use ($request, $center, $resource, $id) {
            $this->scheduling->lock($center);
            $this->scheduling->authorize($request->user(), $center, true);
            $field = ['teachers' => 'teacher_id', 'modules' => 'module_id', 'groups' => 'group_id', 'rooms' => 'room_id'][$resource];
            abort_if(TrainingSession::where('center_id', $center->id)->where($field, $id)->exists(), 422, 'Cette ressource est utilisée par des cours et ne peut pas être supprimée.');
            abort_if($resource === 'groups' && DB::table('training_group_students')->where('group_id', $id)->exists(), 422, 'Ce groupe a des étudiants ou un historique d’affectations : il ne peut pas être supprimé.');
            abort_if($resource === 'modules' && DB::table('training_groups')->where('center_id', $center->id)->where('module_id', $id)->exists(), 422, 'Cette formation est rattachée à des groupes et ne peut pas être supprimée.');
            abort_if($resource === 'modules' && DB::table('training_group_students')->where('module_id', $id)->exists(), 422, 'Cette formation figure dans l’historique des étudiants et ne peut pas être supprimée.');
            abort_unless(DB::table('training_'.$resource)->where('center_id', $center->id)->where('id', $id)->delete(), 404);
        }, 5);

        return response()->json(null, 204);
    }

    public function sessions(Request $request, RecruitmentCenter $center): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center);
        $data = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
            'group_id' => ['sometimes', 'integer', Rule::exists('training_groups', 'id')->where('center_id', $center->id)],
            'room_id' => ['sometimes', 'integer', Rule::exists('training_rooms', 'id')->where('center_id', $center->id)],
        ]);
        abort_if(CarbonImmutable::parse($data['from'])->diffInDays(CarbonImmutable::parse($data['to'])) > 42, 422, 'La période maximale est de six semaines.');
        $sessions = TrainingSession::where('center_id', $center->id)->whereBetween('date', [$data['from'], $data['to']])
            ->when($data['group_id'] ?? null, fn ($q, $id) => $q->where('group_id', $id))
            ->when($data['room_id'] ?? null, fn ($q, $id) => $q->where('room_id', $id))
            ->orderBy('date')->orderBy('start_time')->get();

        return response()->json(['sessions' => $sessions, 'timezone' => SchedulingService::TIMEZONE]);
    }

    public function availability(Request $request, RecruitmentCenter $center): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center);
        $data = $this->sessionData($request, $center, availability: true);
        if (isset($data['exclude_id'])) {
            TrainingSession::where('center_id', $center->id)->findOrFail($data['exclude_id']);
        }

        return response()->json($this->scheduling->availability($center->id, $data, $data['exclude_id'] ?? null));
    }

    public function store(Request $request, RecruitmentCenter $center): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center, true);
        $session = $this->scheduling->save($request->user(), $center, $this->sessionData($request, $center));

        return response()->json($session, 201);
    }

    public function update(Request $request, RecruitmentCenter $center, int $id): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center, true);
        $session = $this->scheduling->save($request->user(), $center, $this->sessionData($request, $center, update: true), $id);

        return response()->json($session);
    }

    public function destroy(Request $request, RecruitmentCenter $center, int $id): JsonResponse
    {
        $this->scheduling->authorize($request->user(), $center, true);
        $data = $request->validate(['version' => ['required', 'integer', 'min:1']]);
        $this->scheduling->delete($request->user(), $center, $id, $data['version']);

        return response()->json(null, 204);
    }

    public function member(Request $request, RecruitmentCenter $center): JsonResponse
    {
        abort_unless($request->user()->hasRole('Administrator'), 403);
        abort_unless($center->category === 'training_center', 404);
        $data = $request->validate(['user_id' => ['required', 'integer', 'exists:users,id'], 'role' => ['nullable', Rule::in(['CENTER_OWNER', 'CENTER_ADMIN', 'COORDINATOR', 'TEACHER', 'ACCOUNTANT', 'STUDENT'])]]);
        DB::transaction(function () use ($center, $data) {
            $this->scheduling->lock($center);
            if ($data['role'] ?? null) {
                // Membership never silently grants a platform role.
                abort_unless(User::findOrFail($data['user_id'])->hasRole('Training Center'), 422, 'Ce compte doit d’abord avoir le rôle Training Center.');
                DB::table('training_center_members')->updateOrInsert(['center_id' => $center->id, 'user_id' => $data['user_id']], ['role' => $data['role'], 'updated_at' => now(), 'created_at' => now()]);
            } else {
                DB::table('training_center_members')->where('center_id', $center->id)->where('user_id', $data['user_id'])->delete();
            }
        }, 5);

        return response()->json(['message' => 'Accès mis à jour.']);
    }

    /** Optional details per resource kind; foreign ids must belong to the same centre. */
    private function detailRules(string $resource, RecruitmentCenter $center): array
    {
        $own = fn (string $table) => ['sometimes', 'nullable', 'integer', Rule::exists('training_'.$table, 'id')->where('center_id', $center->id)];

        return match ($resource) {
            'modules' => [
                'level' => ['sometimes', 'nullable', 'string', 'max:20'],
                'monthly_fee' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:1000000'],
                'fee_effective_from' => ['sometimes', 'string', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            ],
            'groups' => [
                'module_id' => $own('modules'), 'teacher_id' => $own('teachers'), 'room_id' => $own('rooms'),
                'capacity' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:500'],
                'formation_effective_on' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:'.TrainingHistory::today()],
            ],
            default => [],
        };
    }

    private function sessionData(Request $request, RecruitmentCenter $center, bool $update = false, bool $availability = false): array
    {
        $rules = [
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ];
        foreach (['teacher_id' => 'teachers', 'module_id' => 'modules', 'group_id' => 'groups', 'room_id' => 'rooms'] as $field => $resource) {
            $rules[$field] = ['required', 'integer', Rule::exists('training_'.$resource, 'id')->where('center_id', $center->id)];
        }
        if ($availability) {
            $rules['exclude_id'] = ['sometimes', 'nullable', 'integer'];
        } elseif ($update) {
            $rules['version'] = ['required', 'integer', 'min:1'];
        } else {
            $rules['request_key'] = ['required', 'uuid'];
        }

        return $request->validate($rules);
    }
}
