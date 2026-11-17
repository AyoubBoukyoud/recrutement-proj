<?php

namespace Tests\Feature;

use App\Models\RecruitmentCenter;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Str;
use Tests\TestCase;

class TimetableTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private RecruitmentCenter $center;

    private array $draft;

    private string $base;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->withoutMiddleware(ThrottleRequests::class);
        $this->admin = User::factory()->create();
        $this->admin->assignRole('Administrator');
        $this->center = RecruitmentCenter::create(['name' => 'Centre réel', 'category' => 'training_center', 'created_by' => $this->admin->id]);
        $this->base = '/api/timetable/centers/'.$this->center->id;
        $this->actingAs($this->admin, 'sanctum');
        $ids = [];
        foreach (['teachers', 'modules', 'groups', 'rooms'] as $kind) {
            $ids[$kind] = $this->postJson($this->base.'/resources/'.$kind, ['name' => $kind.' 1'])->assertCreated()->json('id');
        }
        $this->draft = ['teacher_id' => $ids['teachers'], 'module_id' => $ids['modules'], 'group_id' => $ids['groups'], 'room_id' => $ids['rooms'], 'date' => '2026-11-16', 'start_time' => '08:30', 'end_time' => '10:30', 'request_key' => (string) Str::uuid()];
    }

    public function test_create_reload_update_delete_and_audit(): void
    {
        $session = $this->postJson($this->base.'/sessions', $this->draft)->assertCreated()->assertJsonPath('version', 1)->json();
        $this->getJson($this->base.'/sessions?from=2026-11-16&to=2026-11-22')->assertOk()->assertJsonCount(1, 'sessions')->assertJsonPath('sessions.0.start_time', '08:30');
        $changed = [...$this->draft, 'date' => '2026-11-17', 'start_time' => '09:00', 'end_time' => '12:00', 'version' => 1];
        $this->putJson($this->base.'/sessions/'.$session['id'], $changed)->assertOk()->assertJsonPath('version', 2)->assertJsonPath('end_time', '12:00');
        $this->deleteJson($this->base.'/sessions/'.$session['id'], ['version' => 2])->assertNoContent();
        $this->assertDatabaseCount('training_sessions', 0);
        $this->assertDatabaseCount('training_schedule_events', 3);
    }

    public function test_all_conflicts_are_blocked_and_adjacent_sessions_are_allowed(): void
    {
        $this->postJson($this->base.'/sessions', $this->draft)->assertCreated();
        $overlap = [...$this->draft, 'start_time' => '09:30', 'end_time' => '11:30', 'request_key' => (string) Str::uuid()];
        $response = $this->postJson($this->base.'/sessions', $overlap)->assertUnprocessable()->assertJsonCount(3, 'conflicts')->assertJsonPath('available', false)->assertJsonCount(3, 'alternatives');
        $this->assertEqualsCanonicalizing(['teacher_id', 'room_id', 'group_id'], array_column($response->json('conflicts'), 'type'));
        $this->postJson($this->base.'/availability', $overlap)->assertOk()->assertJsonPath('available', false);
        $this->postJson($this->base.'/sessions', [...$overlap, 'start_time' => '10:30', 'end_time' => '12:30'])->assertCreated();
        $this->assertDatabaseCount('training_sessions', 2);
    }

    public function test_each_resource_conflict_is_checked_independently_on_create_and_move(): void
    {
        $session = $this->postJson($this->base.'/sessions', $this->draft)->assertCreated()->json();
        $other = $this->draft;
        foreach (['teacher_id' => 'teachers', 'group_id' => 'groups', 'room_id' => 'rooms'] as $field => $kind) {
            $other[$field] = $this->postJson($this->base.'/resources/'.$kind, ['name' => $kind.' 2'])->assertCreated()->json('id');
        }
        foreach (['teacher_id', 'group_id', 'room_id'] as $field) {
            $candidate = [...$other, $field => $this->draft[$field], 'request_key' => (string) Str::uuid()];
            $this->postJson($this->base.'/sessions', $candidate)->assertUnprocessable()->assertJsonCount(1, 'conflicts')->assertJsonPath('conflicts.0.type', $field);
        }
        $second = $this->postJson($this->base.'/sessions', [...$this->draft, 'start_time' => '12:00', 'end_time' => '13:00', 'request_key' => (string) Str::uuid()])->assertCreated()->json();
        $this->putJson($this->base.'/sessions/'.$second['id'], [...$this->draft, 'version' => 1])->assertUnprocessable();
        $this->postJson($this->base.'/availability', [...$this->draft, 'exclude_id' => $session['id']])->assertOk()->assertJsonPath('available', true);
        $this->assertDatabaseHas('training_sessions', ['id' => $second['id'], 'start_time' => '12:00:00', 'version' => 1]);
    }

    public function test_stale_updates_and_deletes_cannot_overwrite_a_colleague(): void
    {
        $id = $this->postJson($this->base.'/sessions', $this->draft)->assertCreated()->json('id');
        $this->putJson($this->base.'/sessions/'.$id, [...$this->draft, 'end_time' => '11:00', 'version' => 1])->assertOk();
        $this->putJson($this->base.'/sessions/'.$id, [...$this->draft, 'version' => 1])->assertConflict();
        $this->deleteJson($this->base.'/sessions/'.$id, ['version' => 1])->assertConflict();
        $this->assertDatabaseCount('training_sessions', 1);
    }

    public function test_retry_is_idempotent_and_resources_cannot_be_duplicated_or_deleted_while_used(): void
    {
        $first = $this->postJson($this->base.'/sessions', $this->draft)->assertCreated()->json('id');
        $this->postJson($this->base.'/sessions', $this->draft)->assertCreated()->assertJsonPath('id', $first);
        $this->postJson($this->base.'/sessions', [...$this->draft, 'end_time' => '11:00'])->assertConflict();
        $this->postJson($this->base.'/resources/rooms', ['name' => '  ROOMS   1 '])->assertUnprocessable();
        $this->deleteJson($this->base.'/resources/rooms/'.$this->draft['room_id'])->assertUnprocessable();
        $this->assertDatabaseCount('training_sessions', 1);
        $this->assertDatabaseCount('training_schedule_events', 1);
    }

    public function test_unauthenticated_and_unassigned_users_cannot_access_schedules(): void
    {
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/timetable/centers')->assertUnauthorized();
        $user = User::factory()->create();
        $user->assignRole('Training Center');
        $this->actingAs($user, 'sanctum');
        $this->getJson('/api/timetable/centers')->assertOk()->assertJsonCount(0, 'centers');
        $this->getJson($this->base.'/resources')->assertForbidden();
        $this->postJson($this->base.'/sessions', $this->draft)->assertForbidden();
        $this->putJson($this->base.'/members', ['user_id' => $user->id, 'role' => 'CENTER_OWNER'])->assertForbidden();
    }

    public function test_memberships_are_server_owned_and_read_only_roles_cannot_write(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Training Center');
        $this->putJson($this->base.'/members', ['user_id' => $user->id, 'role' => 'TEACHER'])->assertOk();
        $this->actingAs($user, 'sanctum');
        $this->getJson('/api/timetable/centers')->assertOk()->assertJsonPath('centers.0.can_manage', false);
        $this->getJson($this->base.'/resources')->assertOk();
        $this->postJson($this->base.'/sessions', $this->draft)->assertForbidden();
        $this->postJson($this->base.'/resources/rooms', ['name' => 'Une salle'])->assertForbidden();
        $this->actingAs($this->admin, 'sanctum');
        $this->putJson($this->base.'/members', ['user_id' => $user->id, 'role' => 'COORDINATOR'])->assertOk();
        $this->actingAs($user, 'sanctum');
        $this->postJson($this->base.'/sessions', $this->draft)->assertCreated();
        $this->actingAs($this->admin, 'sanctum');
        $this->putJson($this->base.'/members', ['user_id' => $user->id, 'role' => null])->assertOk();
        $this->actingAs($user, 'sanctum');
        $this->getJson($this->base.'/resources')->assertForbidden();
    }

    public function test_cross_center_references_sessions_and_filters_are_rejected(): void
    {
        $other = RecruitmentCenter::create(['name' => 'Autre centre', 'category' => 'training_center', 'created_by' => $this->admin->id]);
        $room = $this->postJson('/api/timetable/centers/'.$other->id.'/resources/rooms', ['name' => 'Autre salle'])->assertCreated()->json('id');
        $this->postJson($this->base.'/sessions', [...$this->draft, 'room_id' => $room])->assertUnprocessable();
        $id = $this->postJson($this->base.'/sessions', $this->draft)->assertCreated()->json('id');
        $this->putJson('/api/timetable/centers/'.$other->id.'/sessions/'.$id, [...$this->draft, 'version' => 1])->assertUnprocessable();
        $this->deleteJson('/api/timetable/centers/'.$other->id.'/sessions/'.$id, ['version' => 1])->assertNotFound();
        $this->getJson($this->base.'/sessions?from=2026-11-16&to=2026-11-22&room_id='.$room)->assertUnprocessable();
    }

    public function test_week_boundaries_filters_and_wall_clock_validation(): void
    {
        $this->postJson($this->base.'/sessions', $this->draft)->assertCreated();
        $this->postJson($this->base.'/sessions', [...$this->draft, 'date' => '2026-11-22', 'start_time' => '22:00', 'end_time' => '23:59', 'request_key' => (string) Str::uuid()])->assertCreated();
        $this->postJson($this->base.'/sessions', [...$this->draft, 'date' => '2026-11-23', 'request_key' => (string) Str::uuid()])->assertCreated();
        $this->getJson($this->base.'/sessions?from=2026-11-16&to=2026-11-22&group_id='.$this->draft['group_id'].'&room_id='.$this->draft['room_id'])->assertOk()->assertJsonCount(2, 'sessions');
        foreach ([['start_time' => '24:00'], ['end_time' => '08:30'], ['date' => '2026-02-30'], ['end_time' => '02:00']] as $patch) {
            $this->postJson($this->base.'/sessions', [...$this->draft, ...$patch])->assertUnprocessable();
        }
        $this->getJson($this->base.'/sessions?from=2026-01-01&to=2026-12-31')->assertUnprocessable();
        $this->getJson($this->base.'/sessions?from=2026-11-22&to=2026-11-16')->assertUnprocessable();
    }
}
