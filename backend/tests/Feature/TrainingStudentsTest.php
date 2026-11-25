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

class TrainingStudentsTest extends TestCase
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

    private function member(string $role, ?RecruitmentCenter $center = null): User
    {
        $user = User::factory()->create();
        $user->assignRole('Training Center');
        DB::table('training_center_members')->insert(['center_id' => ($center ?? $this->center)->id, 'user_id' => $user->id, 'role' => $role, 'created_at' => now(), 'updated_at' => now()]);

        return $user;
    }

    private function formationAndGroup(?float $fee = 800, ?int $capacity = null): array
    {
        $module = $this->postJson($this->base.'/resources/modules', ['name' => 'Allemand A1', 'level' => 'A1', 'monthly_fee' => $fee])->assertCreated()->json('id');
        $group = $this->postJson($this->base.'/resources/groups', ['name' => 'A1 Matin', 'module_id' => $module, 'capacity' => $capacity])->assertCreated()->json('id');

        return [$module, $group];
    }

    public function test_register_list_edit_deactivate_and_reactivate_a_student(): void
    {
        $student = $this->postJson($this->base.'/students', ['first_name' => '  Sara ', 'last_name' => 'El  Idrissi', 'phone' => '+212 6 12 34 56 78', 'level' => 'A1'])
            ->assertCreated()->assertJsonPath('status', 'active')->assertJsonPath('last_name', 'El Idrissi')->assertJsonPath('group_ids', [])->json();
        $this->assertNotNull($student['registered_on']);
        $this->getJson($this->base.'/students')->assertOk()->assertJsonCount(1, 'students')->assertJsonPath('students.0.first_name', 'Sara');
        $this->getJson($this->base.'/students?search=idri')->assertOk()->assertJsonCount(1, 'students');
        $this->getJson($this->base.'/students?search=zzz')->assertOk()->assertJsonCount(0, 'students');
        $this->putJson($this->base.'/students/'.$student['id'], ['city' => 'Rabat', 'email' => 'sara@example.com'])->assertOk()->assertJsonPath('city', 'Rabat')->assertJsonPath('first_name', 'Sara');
        $this->putJson($this->base.'/students/'.$student['id'], ['status' => 'inactive'])->assertOk()->assertJsonPath('status', 'inactive')->assertJsonPath('deactivated_on', fn ($date) => $date !== null);
        $this->getJson($this->base.'/students?status=active')->assertOk()->assertJsonCount(0, 'students');
        $this->putJson($this->base.'/students/'.$student['id'], ['status' => 'active'])->assertOk()->assertJsonPath('deactivated_on', null);
    }

    public function test_validation_errors_are_explicit(): void
    {
        $this->postJson($this->base.'/students', ['first_name' => '', 'last_name' => ''])->assertUnprocessable()->assertJsonValidationErrors(['first_name', 'last_name']);
        $this->postJson($this->base.'/students', ['first_name' => 'A', 'last_name' => 'B', 'email' => 'nope', 'phone' => 'abc', 'level' => 'Z9'])->assertUnprocessable()->assertJsonValidationErrors(['email', 'phone', 'level']);
        $this->postJson($this->base.'/students', ['first_name' => '   ', 'last_name' => 'B'])->assertUnprocessable();
        $this->assertDatabaseCount('training_students', 0);
    }

    public function test_assignment_reassignment_duplicates_and_capacity(): void
    {
        [, $morning] = $this->formationAndGroup(capacity: 1);
        $evening = $this->postJson($this->base.'/resources/groups', ['name' => 'A1 Soir'])->assertCreated()->json('id');
        $sara = $this->postJson($this->base.'/students', ['first_name' => 'Sara', 'last_name' => 'Idrissi', 'group_ids' => [$morning]])->assertCreated()->assertJsonPath('group_ids', [$morning])->json('id');
        // Duplicate ids are rejected; re-sending a current membership is idempotent.
        $this->putJson($this->base."/students/$sara/groups", ['group_ids' => [$morning, $morning]])->assertUnprocessable();
        $this->putJson($this->base."/students/$sara/groups", ['group_ids' => [$morning]])->assertOk()->assertJsonPath('group_ids', [$morning]);
        $this->assertDatabaseCount('training_group_students', 1);
        // Capacity 1 is reached.
        $omar = $this->postJson($this->base.'/students', ['first_name' => 'Omar', 'last_name' => 'Bennani'])->assertCreated()->json('id');
        $this->putJson($this->base."/students/$omar/groups", ['group_ids' => [$morning]])->assertUnprocessable()->assertJsonPath('message', fn ($m) => str_contains($m, 'complet'));
        // Reassignment frees the seat.
        $this->putJson($this->base."/students/$sara/groups", ['group_ids' => [$evening]])->assertOk()->assertJsonPath('group_ids', [$evening]);
        $this->putJson($this->base."/students/$omar/groups", ['group_ids' => [$morning]])->assertOk();
        $this->getJson($this->base.'/resources')->assertOk()->assertJsonPath('groups.0.student_count', 1)->assertJsonPath('groups.0.capacity', 1);
        $this->getJson($this->base."/students?group_id=$evening")->assertOk()->assertJsonCount(1, 'students')->assertJsonPath('students.0.id', $sara);
        // Capacity cannot drop below the current roster; groups with students cannot be deleted.
        $this->putJson($this->base."/resources/groups/$evening", ['name' => 'A1 Soir', 'capacity' => 0])->assertUnprocessable();
        $this->deleteJson($this->base."/resources/groups/$evening")->assertUnprocessable();
        // Inactive students cannot be assigned; removing all groups is allowed.
        $this->putJson($this->base."/students/$sara/groups", ['group_ids' => []])->assertOk()->assertJsonPath('group_ids', []);
        $this->putJson($this->base."/students/$sara", ['status' => 'inactive'])->assertOk();
        $this->putJson($this->base."/students/$sara/groups", ['group_ids' => [$evening]])->assertUnprocessable();
    }

    public function test_group_details_and_formation_fields_are_kept_on_rename(): void
    {
        [$module, $group] = $this->formationAndGroup();
        $teacher = $this->postJson($this->base.'/resources/teachers', ['name' => 'Mme Weber'])->json('id');
        $room = $this->postJson($this->base.'/resources/rooms', ['name' => 'Salle 1'])->json('id');
        $this->putJson($this->base."/resources/groups/$group", ['name' => 'A1 Matin', 'teacher_id' => $teacher, 'room_id' => $room])->assertOk();
        $this->putJson($this->base."/resources/groups/$group", ['name' => 'A1 Matin bis'])->assertOk();
        $this->putJson($this->base."/resources/modules/$module", ['name' => 'Allemand A1 intensif'])->assertOk();
        $resources = $this->getJson($this->base.'/resources')->assertOk();
        $resources->assertJsonPath('groups.0.module_id', $module)->assertJsonPath('groups.0.teacher_id', $teacher)->assertJsonPath('groups.0.room_id', $room);
        $resources->assertJsonPath('modules.0.monthly_fee', 800)->assertJsonPath('modules.0.level', 'A1');
        // A formation used by a group is protected.
        $this->deleteJson($this->base."/resources/modules/$module")->assertUnprocessable();
    }

    public function test_students_are_isolated_per_centre_and_by_role(): void
    {
        $other = RecruitmentCenter::create(['name' => 'Autre centre', 'category' => 'training_center', 'created_by' => $this->admin->id]);
        $foreignGroup = $this->postJson('/api/timetable/centers/'.$other->id.'/resources/groups', ['name' => 'Groupe externe'])->assertCreated()->json('id');
        $foreignStudent = $this->postJson('/api/timetable/centers/'.$other->id.'/students', ['first_name' => 'X', 'last_name' => 'Y'])->assertCreated()->json('id');
        $mine = $this->postJson($this->base.'/students', ['first_name' => 'Sara', 'last_name' => 'Idrissi'])->assertCreated()->json('id');
        // Cross-centre ids are rejected.
        $this->postJson($this->base.'/students', ['first_name' => 'A', 'last_name' => 'B', 'group_ids' => [$foreignGroup]])->assertUnprocessable();
        $this->putJson($this->base."/students/$mine/groups", ['group_ids' => [$foreignGroup]])->assertUnprocessable();
        $this->putJson($this->base."/students/$foreignStudent", ['first_name' => 'Hack'])->assertNotFound();
        $this->deleteJson($this->base."/students/$foreignStudent")->assertNotFound();

        $coordinator = $this->member('COORDINATOR');
        $this->actingAs($coordinator, 'sanctum');
        $this->getJson($this->base.'/students')->assertOk()->assertJsonCount(1, 'students');
        $this->getJson('/api/timetable/centers/'.$other->id.'/students')->assertForbidden();
        $this->postJson($this->base.'/students', ['first_name' => 'Nadia', 'last_name' => 'Alaoui'])->assertCreated();

        $this->actingAs($this->member('TEACHER'), 'sanctum');
        $this->getJson($this->base.'/students')->assertOk();
        $this->postJson($this->base.'/students', ['first_name' => 'No', 'last_name' => 'Write'])->assertForbidden();
        $this->putJson($this->base."/students/$mine/groups", ['group_ids' => []])->assertForbidden();

        $this->actingAs($this->member('STUDENT'), 'sanctum');
        $this->getJson($this->base.'/students')->assertForbidden();

        $this->actingAs(User::factory()->create(), 'sanctum');
        $this->getJson($this->base.'/students')->assertForbidden();
    }

    public function test_centres_list_exposes_permissions_per_role(): void
    {
        $accountant = $this->member('ACCOUNTANT');
        $this->actingAs($accountant, 'sanctum');
        $this->getJson('/api/timetable/centers')->assertOk()->assertJsonPath('centers.0.role', 'ACCOUNTANT')
            ->assertJsonPath('centers.0.can_manage', false)->assertJsonPath('centers.0.can_view_students', true)->assertJsonPath('centers.0.can_manage_finance', true);
        $this->actingAs($this->admin, 'sanctum');
        $this->getJson('/api/timetable/centers')->assertOk()->assertJsonPath('centers.0.can_manage_finance', true)->assertJsonPath('centers.0.can_manage', true);
    }

    public function test_only_students_without_payment_history_can_be_deleted(): void
    {
        $paid = $this->postJson($this->base.'/students', ['first_name' => 'Sara', 'last_name' => 'Idrissi'])->json('id');
        $mistake = $this->postJson($this->base.'/students', ['first_name' => 'Doublon', 'last_name' => 'Idrissi'])->json('id');
        $this->postJson($this->base.'/payments', ['student_id' => $paid, 'period' => '2026-11', 'amount' => 100, 'paid_on' => '2026-11-02', 'method' => 'cash'])->assertCreated();
        $this->deleteJson($this->base."/students/$paid")->assertUnprocessable();
        $this->deleteJson($this->base."/students/$mistake")->assertNoContent();
        $this->assertDatabaseMissing('training_students', ['id' => $mistake]);
    }
}
