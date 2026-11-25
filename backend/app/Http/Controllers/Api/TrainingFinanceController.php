<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecruitmentCenter;
use App\Models\TrainingMembership;
use App\Models\TrainingPayment;
use App\Models\TrainingStudent;
use App\Models\TrainingStudentPeriod;
use App\Services\Timetable\SchedulingService;
use App\Services\Training\TrainingHistory;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Student payments and the monthly report. Only real recorded payments are
 * reported; the expected amount comes from the formation fee in force that month.
 */
class TrainingFinanceController extends Controller
{
    private const PERIOD = 'regex:/^\d{4}-(0[1-9]|1[0-2])$/';

    public function __construct(private SchedulingService $scheduling) {}

    public function payments(Request $request, RecruitmentCenter $center): JsonResponse
    {
        $this->authorizeFinance($request, $center);
        $data = $request->validate(['month' => ['sometimes', 'string', self::PERIOD], 'student_id' => ['sometimes', 'integer']]);
        abort_unless(isset($data['month']) || isset($data['student_id']), 422, 'Précisez un mois ou un étudiant.');
        $payments = TrainingPayment::where('center_id', $center->id)
            ->when($data['month'] ?? null, fn ($q, $month) => $q->where('period', $month))
            ->when($data['student_id'] ?? null, fn ($q, $id) => $q->where('student_id', $id))
            ->orderByDesc('paid_on')->orderByDesc('id')->limit(1000)->get();

        return response()->json(['payments' => $payments->map->toApi()]);
    }

    public function store(Request $request, RecruitmentCenter $center): JsonResponse
    {
        $this->authorizeFinance($request, $center);
        $data = $request->validate([
            'student_id' => ['required', 'integer', Rule::exists('training_students', 'id')->where('center_id', $center->id)],
            'period' => ['required', 'string', self::PERIOD],
            'amount' => ['required', 'numeric', 'gt:0', 'max:1000000'],
            'paid_on' => ['required', 'date_format:Y-m-d', 'before_or_equal:'.CarbonImmutable::now(SchedulingService::TIMEZONE)->addDay()->toDateString()],
            'method' => ['required', Rule::in(TrainingPayment::METHODS)],
            'reference' => ['sometimes', 'nullable', 'string', 'max:100'],
            'note' => ['sometimes', 'nullable', 'string', 'max:255'],
        ], ['paid_on.before_or_equal' => 'La date d’encaissement ne peut pas être dans le futur.']);
        $payment = TrainingPayment::create([...$data, 'amount' => round((float) $data['amount'], 2), 'center_id' => $center->id, 'recorded_by' => $request->user()->id]);

        return response()->json($payment->toApi(), 201);
    }

    /** Cancels a payment entered by mistake; the row is kept (soft delete) with who removed it. */
    public function destroy(Request $request, RecruitmentCenter $center, int $id): JsonResponse
    {
        $this->authorizeFinance($request, $center);
        $payment = TrainingPayment::where('center_id', $center->id)->findOrFail($id);
        DB::transaction(function () use ($payment, $request) {
            $payment->forceFill(['deleted_by' => $request->user()->id])->save();
            $payment->delete();
        });

        return response()->json(null, 204);
    }

    /**
     * Reads history only: the fee in force that month, the memberships and
     * activity periods overlapping it, and the payments recorded for it. A month
     * with more than one formation is reported as `needs_rule`: billing it needs a
     * rule the centre has not defined yet, so no amount is invented.
     */
    public function monthly(Request $request, RecruitmentCenter $center): JsonResponse
    {
        $this->authorizeFinance($request, $center);
        $data = $request->validate([
            'month' => ['required', 'string', self::PERIOD],
            'group_id' => ['sometimes', 'nullable', 'integer', Rule::exists('training_groups', 'id')->where('center_id', $center->id)],
            'module_id' => ['sometimes', 'nullable', 'integer', Rule::exists('training_modules', 'id')->where('center_id', $center->id)],
        ]);
        $month = $data['month'];
        $start = $month.'-01';
        $end = CarbonImmutable::createFromFormat('Y-m-d', $start)->endOfMonth()->toDateString();
        $overlaps = fn ($q, string $from, string $to) => $q->where($from, '<=', $end)->where(fn ($w) => $w->whereNull($to)->orWhere($to, '>=', $start));

        $fees = TrainingHistory::feeHistory($center->id);
        $active = TrainingStudentPeriod::where('center_id', $center->id)->where(fn ($q) => $overlaps($q, 'started_on', 'ended_on'))->pluck('student_id')->unique()->flip();
        $memberships = TrainingMembership::where('center_id', $center->id)->where(fn ($q) => $overlaps($q, 'joined_on', 'ended_on'))->orderBy('joined_on')->get()->groupBy('student_id');
        $paid = TrainingPayment::where('center_id', $center->id)->where('period', $month)
            ->groupBy('student_id')->selectRaw('student_id, sum(amount) as total, count(*) as count')->get()->keyBy('student_id');
        $students = TrainingStudent::where('center_id', $center->id)->whereIn('id', $active->keys()->merge($paid->keys())->unique()->values())
            ->orderBy('last_name')->orderBy('first_name')->get();

        $rows = [];
        foreach ($students as $student) {
            $periods = $memberships[$student->id] ?? collect();
            $groupIds = $periods->pluck('group_id')->unique()->sort()->values()->all();
            $moduleIds = $periods->pluck('module_id')->filter()->unique()->sort()->values()->all();
            if (! empty($data['group_id']) && ! in_array((int) $data['group_id'], $groupIds, true)) {
                continue;
            }
            if (! empty($data['module_id']) && ! in_array((int) $data['module_id'], $moduleIds, true)) {
                continue;
            }
            $formations = array_map(function (int $moduleId) use ($fees, $month) {
                $fee = TrainingHistory::feeAt($fees, $moduleId, $month);

                return ['module_id' => $moduleId, 'fee' => $fee['amount'] ?? null, 'fee_effective_from' => $fee['effective_from'] ?? null];
            }, $moduleIds);
            $amount = round((float) ($paid[$student->id]->total ?? 0), 2);
            $issue = count($moduleIds) > 1 ? ($this->concurrent($periods, $start, $end) ? 'multiple_formations' : 'formation_change') : null;
            $expected = ! $issue && $formations && $formations[0]['fee'] !== null ? $formations[0]['fee'] : null;
            $status = match (true) {
                $issue !== null => 'needs_rule',
                $expected === null || $expected <= 0 => 'no_fee',
                $amount >= $expected => 'paid',
                $amount > 0 => 'partial',
                default => 'unpaid',
            };
            $rows[] = [
                'student_id' => $student->id,
                'name' => trim($student->first_name.' '.$student->last_name),
                'phone' => $student->phone,
                'student_status' => $student->status,
                'group_ids' => $groupIds,
                'module_ids' => $moduleIds,
                'formations' => $formations,
                'expected' => $expected,
                'paid' => $amount,
                'balance' => $expected === null ? null : max(0, round($expected - $amount, 2)),
                'payments_count' => (int) ($paid[$student->id]->count ?? 0),
                'status' => $status,
                'billing_issue' => $issue,
                // Joined, left or changed status during the month: the full fee is still shown (current rule, to be confirmed).
                'partial_month' => $this->partial($periods, $student, $start, $end),
            ];
        }
        $counts = array_count_values(array_column($rows, 'status'));

        return response()->json([
            'month' => $month,
            'rows' => $rows,
            'totals' => [
                'students' => count($rows),
                'expected' => round(array_sum(array_map(fn ($row) => $row['expected'] ?? 0, $rows)), 2),
                'paid' => round(array_sum(array_column($rows, 'paid')), 2),
                'outstanding' => round(array_sum(array_map(fn ($row) => $row['balance'] ?? 0, $rows)), 2),
                'paid_count' => $counts['paid'] ?? 0,
                'partial_count' => $counts['partial'] ?? 0,
                'unpaid_count' => $counts['unpaid'] ?? 0,
                'no_fee_count' => $counts['no_fee'] ?? 0,
                'needs_rule_count' => $counts['needs_rule'] ?? 0,
            ],
        ]);
    }

    /** True when two formations overlap in time within the month (not a simple change of formation). */
    private function concurrent(Collection $periods, string $start, string $end): bool
    {
        $clipped = $periods->filter(fn ($m) => $m->module_id)->map(fn ($m) => [
            'module' => $m->module_id,
            'from' => max($m->joined_on->format('Y-m-d'), $start),
            'to' => min($m->ended_on?->format('Y-m-d') ?? $end, $end),
        ])->values();
        foreach ($clipped as $i => $a) {
            foreach ($clipped->slice($i + 1) as $b) {
                if ($a['module'] !== $b['module'] && $a['from'] <= $b['to'] && $b['from'] <= $a['to']) {
                    return true;
                }
            }
        }

        return false;
    }

    private function partial(Collection $periods, TrainingStudent $student, string $start, string $end): bool
    {
        if ($periods->isEmpty()) {
            return false;
        }
        $from = $periods->min(fn ($m) => $m->joined_on->format('Y-m-d'));
        $to = $periods->contains(fn ($m) => $m->ended_on === null) ? $end : $periods->max(fn ($m) => $m->ended_on->format('Y-m-d'));

        return $from > $start || $to < $end;
    }

    private function authorizeFinance(Request $request, RecruitmentCenter $center): void
    {
        $this->scheduling->authorizeRoles($request->user(), $center, SchedulingService::FINANCE_ROLES, 'Accès aux paiements non autorisé.');
    }
}
