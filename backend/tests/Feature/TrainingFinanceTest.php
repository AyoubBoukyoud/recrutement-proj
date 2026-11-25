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

class TrainingFinanceTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private RecruitmentCenter $center;

    private string $base;

    protected function setUp(): void
    {
        parent::setUp();
        // Effective dates default to today (Africa/Casablanca): pin it.
        Carbon::setTestNow(CarbonImmutable::parse('2026-11-17 10:00:00', 'Africa/Casablanca'));
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-11-17 10:00:00', 'Africa/Casablanca'));
        $this->seed(RoleSeeder::class);
        $this->withoutMiddleware(ThrottleRequests::class);
        $this->admin = User::factory()->create();
        $this->admin->assignRole('Administrator');
        $this->center = RecruitmentCenter::create(['name' => 'Centre réel', 'category' => 'training_center', 'created_by' => $this->admin->id]);
        $this->base = '/api/timetable/centers/'.$this->center->id;
        $this->actingAs($this->admin, 'sanctum');
    }

    private function student(string $first, array $groups, string $registered = '2026-10-01'): int
    {
        return $this->postJson($this->base.'/students', ['first_name' => $first, 'last_name' => 'Test', 'group_ids' => $groups, 'registered_on' => $registered])->assertCreated()->json('id');
    }

    private function pay(int $student, float $amount, string $period = '2026-11'): int
    {
        return $this->postJson($this->base.'/payments', ['student_id' => $student, 'period' => $period, 'amount' => $amount, 'paid_on' => '2026-11-05', 'method' => 'cash'])->assertCreated()->json('id');
    }

    public function test_monthly_report_statuses_totals_and_filters(): void
    {
        $a1 = $this->postJson($this->base.'/resources/modules', ['name' => 'Allemand A1', 'monthly_fee' => 800, 'fee_effective_from' => '2026-10'])->json('id');
        $b1 = $this->postJson($this->base.'/resources/modules', ['name' => 'Allemand B1', 'monthly_fee' => 1000, 'fee_effective_from' => '2026-10'])->json('id');
        $free = $this->postJson($this->base.'/resources/modules', ['name' => 'Atelier'])->json('id');
        $ga = $this->postJson($this->base.'/resources/groups', ['name' => 'A1 Matin', 'module_id' => $a1])->json('id');
        $gb = $this->postJson($this->base.'/resources/groups', ['name' => 'B1 Soir', 'module_id' => $b1])->json('id');
        $gf = $this->postJson($this->base.'/resources/groups', ['name' => 'Atelier', 'module_id' => $free])->json('id');

        $paid = $this->student('Paid', [$ga]);
        $partial = $this->student('Partial', [$gb]);
        $unpaid = $this->student('Unpaid', [$ga]);
        $noFee = $this->student('NoFee', [$gf]);
        $this->student('Later', [$ga], '2026-12-03'); // registered after the month
        $this->pay($paid, 500);
        $this->pay($paid, 300);
        $this->pay($partial, 400);
        $this->pay($unpaid, 800, '2026-10'); // another month does not count

        $report = $this->getJson($this->base.'/reports/monthly?month=2026-11')->assertOk();
        $rows = collect($report->json('rows'))->keyBy('student_id');
        $this->assertCount(4, $rows);
        $this->assertSame(['paid', 800, 0], [$rows[$paid]['status'], (int) $rows[$paid]['paid'], (int) $rows[$paid]['balance']]);
        $this->assertSame(['partial', 400, 600], [$rows[$partial]['status'], (int) $rows[$partial]['paid'], (int) $rows[$partial]['balance']]);
        $this->assertSame(['unpaid', 0, 800], [$rows[$unpaid]['status'], (int) $rows[$unpaid]['paid'], (int) $rows[$unpaid]['balance']]);
        $this->assertSame('no_fee', $rows[$noFee]['status']);
        $this->assertNull($rows[$noFee]['expected']);
        $report->assertJsonPath('totals.expected', fn ($v) => (int) $v === 2600)->assertJsonPath('totals.paid', fn ($v) => (int) $v === 1200)
            ->assertJsonPath('totals.outstanding', fn ($v) => (int) $v === 1400)->assertJsonPath('totals.paid_count', 1)->assertJsonPath('totals.unpaid_count', 1);

        $this->getJson($this->base."/reports/monthly?month=2026-11&group_id=$gb")->assertOk()->assertJsonCount(1, 'rows')->assertJsonPath('rows.0.student_id', $partial);
        $this->getJson($this->base."/reports/monthly?month=2026-11&module_id=$a1")->assertOk()->assertJsonCount(2, 'rows');
        $this->getJson($this->base.'/reports/monthly?month=2026-10')->assertOk()->assertJsonPath('totals.paid', fn ($v) => (int) $v === 800);
        $this->getJson($this->base.'/reports/monthly?month=2026-13')->assertUnprocessable();
    }

    public function test_deactivated_students_leave_later_reports_but_keep_paid_months(): void
    {
        $module = $this->postJson($this->base.'/resources/modules', ['name' => 'A1', 'monthly_fee' => 500, 'fee_effective_from' => '2026-10'])->json('id');
        $group = $this->postJson($this->base.'/resources/groups', ['name' => 'G', 'module_id' => $module])->json('id');
        $student = $this->student('Gone', [$group]);
        $this->putJson($this->base."/students/$student", ['status' => 'inactive', 'status_effective_on' => '2026-10-21'])->assertOk();
        $this->getJson($this->base.'/reports/monthly?month=2026-10')->assertOk()->assertJsonCount(1, 'rows')->assertJsonPath('rows.0.expected', 500)->assertJsonPath('rows.0.partial_month', true);
        $this->getJson($this->base.'/reports/monthly?month=2026-11')->assertOk()->assertJsonCount(0, 'rows');
        $this->pay($student, 500);
        $this->getJson($this->base.'/reports/monthly?month=2026-11')->assertOk()->assertJsonCount(1, 'rows')->assertJsonPath('rows.0.status', 'no_fee');
    }

    public function test_payment_validation_cancellation_and_listing(): void
    {
        $student = $this->student('Sara', []);
        $this->postJson($this->base.'/payments', ['student_id' => $student, 'period' => '2026-11', 'amount' => 0, 'paid_on' => '2026-11-05', 'method' => 'bitcoin'])
            ->assertUnprocessable()->assertJsonValidationErrors(['amount', 'method']);
        $this->postJson($this->base.'/payments', ['student_id' => $student, 'period' => '2026-11', 'amount' => 10, 'paid_on' => '2099-01-01', 'method' => 'cash'])->assertUnprocessable()->assertJsonValidationErrors(['paid_on']);
        $id = $this->pay($student, 250.5);
        $this->getJson($this->base.'/payments?month=2026-11')->assertOk()->assertJsonCount(1, 'payments')->assertJsonPath('payments.0.amount', 250.5);
        $this->getJson($this->base.'/payments')->assertUnprocessable();
        $this->deleteJson($this->base."/payments/$id")->assertNoContent();
        $this->getJson($this->base.'/payments?month=2026-11')->assertOk()->assertJsonCount(0, 'payments');
        $this->assertSoftDeleted('training_payments', ['id' => $id, 'deleted_by' => $this->admin->id]);
    }

    public function test_finance_is_isolated_and_restricted_to_finance_roles(): void
    {
        $other = RecruitmentCenter::create(['name' => 'Autre', 'category' => 'training_center', 'created_by' => $this->admin->id]);
        $foreign = $this->postJson('/api/timetable/centers/'.$other->id.'/students', ['first_name' => 'X', 'last_name' => 'Y'])->json('id');
        $this->postJson($this->base.'/payments', ['student_id' => $foreign, 'period' => '2026-11', 'amount' => 10, 'paid_on' => '2026-11-05', 'method' => 'cash'])->assertUnprocessable()->assertJsonValidationErrors(['student_id']);
        $foreignPayment = $this->postJson('/api/timetable/centers/'.$other->id.'/payments', ['student_id' => $foreign, 'period' => '2026-11', 'amount' => 10, 'paid_on' => '2026-11-05', 'method' => 'cash'])->json('id');
        $this->deleteJson($this->base."/payments/$foreignPayment")->assertNotFound();

        foreach (['COORDINATOR' => 403, 'TEACHER' => 403, 'STUDENT' => 403, 'ACCOUNTANT' => 200, 'CENTER_ADMIN' => 200] as $role => $status) {
            $user = User::factory()->create();
            $user->assignRole('Training Center');
            DB::table('training_center_members')->insert(['center_id' => $this->center->id, 'user_id' => $user->id, 'role' => $role, 'created_at' => now(), 'updated_at' => now()]);
            $this->actingAs($user, 'sanctum');
            $this->getJson($this->base.'/reports/monthly?month=2026-11')->assertStatus($status);
            $this->getJson('/api/timetable/centers/'.$other->id.'/reports/monthly?month=2026-11')->assertForbidden();
        }
    }
}
