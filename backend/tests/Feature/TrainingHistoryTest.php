<?php

namespace Tests\Feature;

use App\Models\RecruitmentCenter;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Reports read effective-dated history: administrative changes never rewrite past months. */
class TrainingHistoryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private RecruitmentCenter $center;

    private string $base;

    protected function setUp(): void
    {
        parent::setUp();
        $now = CarbonImmutable::parse('2026-11-17 10:00:00', 'Africa/Casablanca');
        Carbon::setTestNow($now);
        CarbonImmutable::setTestNow($now);
        $this->seed(RoleSeeder::class);
        $this->withoutMiddleware(ThrottleRequests::class);
        $this->admin = User::factory()->create();
        $this->admin->assignRole('Administrator');
        $this->center = RecruitmentCenter::create(['name' => 'Centre réel', 'category' => 'training_center', 'created_by' => $this->admin->id]);
        $this->base = '/api/timetable/centers/'.$this->center->id;
        $this->actingAs($this->admin, 'sanctum');
    }

    private function formation(string $name, ?float $fee, string $from = '2026-09'): int
    {
        return $this->postJson($this->base.'/resources/modules', ['name' => $name, 'monthly_fee' => $fee, 'fee_effective_from' => $from])->assertCreated()->json('id');
    }

    private function group(string $name, ?int $module): int
    {
        return $this->postJson($this->base.'/resources/groups', ['name' => $name, 'module_id' => $module])->assertCreated()->json('id');
    }

    private function student(array $groups, string $registered = '2026-09-01'): int
    {
        return $this->postJson($this->base.'/students', ['first_name' => 'Sara', 'last_name' => 'Idrissi', 'group_ids' => $groups, 'registered_on' => $registered])->assertCreated()->json('id');
    }

    private function row(string $month, int $student = 0): array
    {
        $rows = collect($this->getJson($this->base.'/reports/monthly?month='.$month)->assertOk()->json('rows'));

        return $student ? (array) $rows->firstWhere('student_id', $student) : (array) $rows->first();
    }

    public function test_a_fee_change_applies_from_its_month_and_keeps_earlier_months(): void
    {
        $a1 = $this->formation('A1', 800);
        $student = $this->student([$this->group('A1 Matin', $a1)]);
        $this->putJson($this->base."/resources/modules/$a1", ['name' => 'A1', 'monthly_fee' => 900, 'fee_effective_from' => '2026-11'])->assertOk();
        $this->assertSame([800, 800, 900], [$this->row('2026-09', $student)['expected'], $this->row('2026-10', $student)['expected'], $this->row('2026-11', $student)['expected']]);
        // Re-sending the fee in force, or a rename without a fee, adds no history.
        $this->putJson($this->base."/resources/modules/$a1", ['name' => 'A1', 'monthly_fee' => 900, 'fee_effective_from' => '2026-12'])->assertOk();
        $this->putJson($this->base."/resources/modules/$a1", ['name' => 'Allemand A1'])->assertOk();
        $this->assertDatabaseCount('training_formation_fees', 2);
        // Without an explicit month the change starts this month (API compatibility).
        $this->putJson($this->base."/resources/modules/$a1", ['name' => 'Allemand A1', 'monthly_fee' => 950])->assertOk();
        $this->assertSame([800, 950], [$this->row('2026-10', $student)['expected'], $this->row('2026-11', $student)['expected']]);
        $module = collect($this->getJson($this->base.'/resources')->json('modules'))->firstWhere('id', $a1);
        $this->assertSame(950, (int) $module['monthly_fee']);
        $this->assertSame('2026-11', $module['fee_effective_from']);
        $this->assertSame(['2026-09', '2026-11'], array_column($module['fees'], 'effective_from'));
        // Months before the first fee have no fee: reported honestly, not guessed.
        $this->assertSame('no_fee', $this->postJsonAndRow('2026-08'));
    }

    private function postJsonAndRow(string $month): string
    {
        $student = $this->postJson($this->base.'/students', ['first_name' => 'Early', 'last_name' => 'Bird', 'registered_on' => $month.'-01', 'group_ids' => [DB::table('training_groups')->value('id')]])->assertCreated()->json('id');

        return $this->row($month, $student)['status'];
    }

    public function test_reassignment_keeps_past_groups_and_flags_a_formation_change(): void
    {
        $a1 = $this->formation('A1', 800);
        $b1 = $this->formation('B1', 1000);
        $ga = $this->group('A1 Matin', $a1);
        $gb = $this->group('B1 Soir', $b1);
        $student = $this->student([$ga]);
        $this->putJson($this->base."/students/$student/groups", ['group_ids' => [$gb], 'effective_on' => '2026-11-10'])->assertOk()
            ->assertJsonPath('group_ids', [$gb])->assertJsonCount(2, 'memberships')->assertJsonPath('memberships.0.ended_on', '2026-11-09');
        $october = $this->row('2026-10', $student);
        $this->assertSame([[$ga], 800, 'unpaid'], [$october['group_ids'], $october['expected'], $october['status']]);
        $november = $this->row('2026-11', $student);
        $this->assertSame(['needs_rule', 'formation_change', null, null], [$november['status'], $november['billing_issue'], $november['expected'], $november['balance']]);
        $this->assertSame([$ga, $gb], $november['group_ids']);
        $this->assertSame([800, 1000], array_column($november['formations'], 'fee'));
        $this->assertSame(1000, $this->row('2026-12', $student)['expected']);
        $this->getJson($this->base.'/reports/monthly?month=2026-11')->assertJsonPath('totals.needs_rule_count', 1)->assertJsonPath('totals.expected', 0);
        // Filters follow history too.
        $this->getJson($this->base."/reports/monthly?month=2026-10&group_id=$gb")->assertJsonCount(0, 'rows');
        $this->getJson($this->base."/reports/monthly?month=2026-11&module_id=$a1")->assertJsonCount(1, 'rows');
    }

    public function test_same_formation_reassignment_and_concurrent_formations(): void
    {
        $a1 = $this->formation('A1', 800);
        $club = $this->formation('Club', 200);
        [$morning, $evening, $clubGroup] = [$this->group('A1 Matin', $a1), $this->group('A1 Soir', $a1), $this->group('Club', $club)];
        $moved = $this->student([$morning]);
        $this->putJson($this->base."/students/$moved/groups", ['group_ids' => [$evening], 'effective_on' => '2026-11-10'])->assertOk();
        $this->assertSame(['unpaid', 800, null], [$this->row('2026-11', $moved)['status'], $this->row('2026-11', $moved)['expected'], $this->row('2026-11', $moved)['billing_issue']]);
        $both = $this->student([$morning, $clubGroup]);
        $row = $this->row('2026-10', $both);
        $this->assertSame(['needs_rule', 'multiple_formations', null], [$row['status'], $row['billing_issue'], $row['expected']]);
    }

    public function test_a_group_formation_change_is_dated_and_snapshotted(): void
    {
        $a1 = $this->formation('A1', 800);
        $a2 = $this->formation('A2', 850);
        $group = $this->group('Progression', $a1);
        $student = $this->student([$group]);
        $this->putJson($this->base."/resources/groups/$group", ['name' => 'Progression', 'module_id' => $a2, 'formation_effective_on' => '2026-11-01'])->assertOk();
        $this->assertSame([800, 850], [$this->row('2026-10', $student)['expected'], $this->row('2026-11', $student)['expected']]);
        $this->assertSame([[$a1], [$a2]], [$this->row('2026-10', $student)['module_ids'], $this->row('2026-11', $student)['module_ids']]);
        // A change dated today splits the current month: flagged, not double-counted.
        $this->putJson($this->base."/resources/groups/$group", ['name' => 'Progression', 'module_id' => $a1])->assertOk();
        $this->assertSame('formation_change', $this->row('2026-11', $student)['billing_issue']);
        $this->assertSame(800, $this->row('2026-10', $student)['expected']);
        // Formations in a student's history cannot be deleted.
        $this->putJson($this->base."/resources/groups/$group", ['name' => 'Progression', 'module_id' => null])->assertOk();
        $this->deleteJson($this->base."/resources/modules/$a2")->assertUnprocessable();
        $this->putJson($this->base."/resources/groups/$group", ['name' => 'Progression', 'formation_effective_on' => '2026-12-01', 'module_id' => $a2])->assertUnprocessable();
    }

    public function test_deactivation_and_reactivation_keep_the_gap(): void
    {
        $a1 = $this->formation('A1', 800);
        $group = $this->group('A1 Matin', $a1);
        $student = $this->student([$group]);
        $this->putJson($this->base."/students/$student", ['status' => 'inactive', 'status_effective_on' => '2026-10-01'])->assertOk()
            ->assertJsonPath('status', 'inactive')->assertJsonPath('group_ids', [])->assertJsonPath('periods.0.ended_on', '2026-09-30')->assertJsonPath('memberships.0.ended_on', '2026-09-30');
        $this->assertSame(800, $this->row('2026-09', $student)['expected']);
        $this->assertSame([], $this->row('2026-10', $student));
        $this->putJson($this->base."/students/$student", ['status' => 'active', 'status_effective_on' => '2026-11-10'])->assertOk()->assertJsonCount(2, 'periods')->assertJsonPath('group_ids', []);
        $this->putJson($this->base."/students/$student/groups", ['group_ids' => [$group], 'effective_on' => '2026-11-10'])->assertOk();
        $this->assertSame([], $this->row('2026-10', $student), 'The inactive month stays out of the report');
        $november = $this->row('2026-11', $student);
        $this->assertSame([800, true], [$november['expected'], $november['partial_month']]);
        // Dates must be coherent.
        $this->putJson($this->base."/students/$student", ['status' => 'inactive', 'status_effective_on' => '2026-11-01'])->assertUnprocessable();
        $this->putJson($this->base."/students/$student", ['status' => 'inactive', 'status_effective_on' => '2026-11-18'])->assertUnprocessable();
    }

    public function test_effective_dates_are_validated_and_same_day_corrections_leave_no_history(): void
    {
        $a1 = $this->formation('A1', 800);
        [$ga, $gb] = [$this->group('A', $a1), $this->group('B', $a1)];
        $student = $this->student([$ga], '2026-11-17');
        $this->putJson($this->base."/students/$student/groups", ['group_ids' => [$gb], 'effective_on' => '2026-11-18'])->assertUnprocessable();
        $this->putJson($this->base."/students/$student/groups", ['group_ids' => [$gb], 'effective_on' => '2026-11-16'])->assertUnprocessable();
        $this->putJson($this->base."/students/$student/groups", ['group_ids' => [$gb]])->assertOk()->assertJsonCount(1, 'memberships')->assertJsonPath('memberships.0.group_id', $gb);
        // Re-sending a current group is idempotent; groups with any history cannot be deleted.
        $this->putJson($this->base."/students/$student/groups", ['group_ids' => [$gb]])->assertOk()->assertJsonCount(1, 'memberships');
        $this->deleteJson($this->base."/resources/groups/$gb")->assertUnprocessable();
        $this->deleteJson($this->base."/resources/groups/$ga")->assertNoContent();
    }

    public function test_past_reports_are_unchanged_by_later_administrative_changes(): void
    {
        $a1 = $this->formation('A1', 800);
        $b1 = $this->formation('B1', 1000);
        [$ga, $gb] = [$this->group('A1 Matin', $a1), $this->group('B1 Soir', $b1)];
        $students = [$this->student([$ga]), $this->student([$ga]), $this->student([$gb])];
        $this->postJson($this->base.'/payments', ['student_id' => $students[0], 'period' => '2026-09', 'amount' => 800, 'paid_on' => '2026-09-05', 'method' => 'cash'])->assertCreated();
        $this->postJson($this->base.'/payments', ['student_id' => $students[1], 'period' => '2026-09', 'amount' => 300, 'paid_on' => '2026-09-05', 'method' => 'cash'])->assertCreated();
        $before = [$this->getJson($this->base.'/reports/monthly?month=2026-09')->json(), $this->getJson($this->base.'/reports/monthly?month=2026-10')->json()];

        $this->putJson($this->base."/resources/modules/$a1", ['name' => 'A1', 'monthly_fee' => 1200, 'fee_effective_from' => '2026-11'])->assertOk();
        $this->putJson($this->base."/resources/modules/$b1", ['name' => 'B1', 'monthly_fee' => 1500])->assertOk();
        $this->putJson($this->base."/students/{$students[0]}/groups", ['group_ids' => [$gb], 'effective_on' => '2026-11-03'])->assertOk();
        $this->putJson($this->base."/resources/groups/$ga", ['name' => 'A1 Matin', 'module_id' => $b1, 'formation_effective_on' => '2026-11-01'])->assertOk();
        $this->putJson($this->base."/students/{$students[2]}", ['status' => 'inactive', 'status_effective_on' => '2026-11-01'])->assertOk();
        $this->putJson($this->base."/resources/groups/$gb", ['name' => 'B1 Soir renommé'])->assertOk();

        $after = [$this->getJson($this->base.'/reports/monthly?month=2026-09')->json(), $this->getJson($this->base.'/reports/monthly?month=2026-10')->json()];
        // `student_status` is the student's current status (display only); every billing field must be identical.
        $strip = fn (array $reports) => array_map(fn ($report) => [...$report, 'rows' => array_map(fn ($row) => array_diff_key($row, ['student_status' => true]), $report['rows'])], $reports);
        $this->assertSame($strip($before), $strip($after));
        $this->assertSame('inactive', $after[0]['rows'][2]['student_status']);
        $this->assertSame(800, $before[0]['rows'][0]['expected']);
    }

    public function test_history_is_centre_scoped(): void
    {
        $other = RecruitmentCenter::create(['name' => 'Autre', 'category' => 'training_center', 'created_by' => $this->admin->id]);
        $foreignModule = $this->postJson("/api/timetable/centers/{$other->id}/resources/modules", ['name' => 'Externe', 'monthly_fee' => 10])->assertCreated()->json('id');
        $group = $this->group('A', $this->formation('A1', 800));
        $this->putJson($this->base."/resources/groups/$group", ['name' => 'A', 'module_id' => $foreignModule])->assertUnprocessable();
        $this->putJson($this->base."/resources/modules/$foreignModule", ['name' => 'X', 'monthly_fee' => 1])->assertNotFound();
        $this->student([$group]);
        $this->getJson("/api/timetable/centers/{$other->id}/reports/monthly?month=2026-11")->assertOk()->assertJsonCount(0, 'rows');
        $this->assertSame(['Externe'], collect($this->getJson("/api/timetable/centers/{$other->id}/resources")->json('modules'))->pluck('name')->all());
        $this->assertDatabaseHas('training_formation_fees', ['module_id' => $foreignModule, 'center_id' => $other->id]);
    }
}
