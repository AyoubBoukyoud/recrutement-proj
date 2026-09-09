<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminRecruiterEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    private function recruiter(array $company = []): User
    {
        $recruiter = User::factory()->create();
        $recruiter->assignRole('Company');

        if ($company !== []) {
            $recruiter->companyProfile()->create([
                'company_name' => 'Atlas Recruiting',
                'sector' => 'Health',
                'city' => 'Rabat',
                ...$company,
            ]);
        }

        return $recruiter;
    }

    public function test_admin_can_filter_and_open_recruiters_but_not_regular_users(): void
    {
        $this->admin();
        $atlas = $this->recruiter();
        $atlas->companyProfile()->create([
            'company_name' => 'Atlas Recruiting',
            'sector' => 'Health',
            'city' => 'Rabat',
            'verified_at' => now(),
        ]);
        $this->recruiter([
            'company_name' => 'Berlin Technik',
            'sector' => 'Industry',
            'city' => 'Casablanca',
        ]);

        $this->getJson('/api/admin/recruiters?q=Atlas&city=Rabat&verified=1')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $atlas->id)
            ->assertJsonPath('data.0.company_name', 'Atlas Recruiting');

        $this->getJson("/api/admin/recruiters/{$atlas->id}")
            ->assertOk()
            ->assertJsonPath('company.company_name', 'Atlas Recruiting');

        $regularUser = User::factory()->create();
        $this->getJson("/api/admin/recruiters/{$regularUser->id}")->assertNotFound();
    }

    public function test_admin_can_edit_verify_change_status_and_read_recruiter_activity(): void
    {
        $admin = $this->admin();
        $recruiter = $this->recruiter();

        $this->patchJson("/api/admin/recruiters/{$recruiter->id}", [
            'company_name' => 'MediStaff GmbH',
            'sector' => 'Health',
            'city' => 'Hamburg',
            'employees_count' => 80,
        ])->assertOk()
            ->assertJsonPath('company_name', 'MediStaff GmbH')
            ->assertJsonPath('employees_count', 80);

        $this->patchJson("/api/admin/recruiters/{$recruiter->id}/verify", ['verified' => true])
            ->assertOk()
            ->assertJsonPath('verified_by_id', $admin->id);

        $this->patchJson("/api/admin/recruiters/{$recruiter->id}/status", [
            'status' => 'inactive',
            'status_reason' => 'Contract review',
        ])->assertOk()
            ->assertJsonPath('status', 'inactive')
            ->assertJsonPath('status_changed_by_id', $admin->id);

        $this->getJson("/api/admin/recruiters/{$recruiter->id}/activity")
            ->assertOk()
            ->assertJsonFragment(['type' => 'company_verified'])
            ->assertJsonFragment(['type' => 'status_changed']);

        $this->assertDatabaseHas('admin_activity_logs', [
            'subject_type' => User::class,
            'subject_id' => $recruiter->id,
            'action' => 'verified',
        ]);
        $this->assertDatabaseHas('admin_activity_logs', [
            'subject_type' => User::class,
            'subject_id' => $recruiter->id,
            'action' => 'status_changed',
        ]);
    }

    public function test_bulk_recruiter_actions_update_export_and_remove_company_profiles(): void
    {
        $this->admin();
        $first = $this->recruiter(['company_name' => 'First Company']);
        $second = $this->recruiter(['company_name' => 'Second Company']);

        $this->postJson('/api/admin/recruiters/bulk', [
            'ids' => [$first->id, $second->id],
            'action' => 'block',
        ])->assertOk()
            ->assertJsonPath('updated', 2)
            ->assertJsonPath('action', 'block');

        $this->assertSame('blocked', $first->fresh()->status);
        $this->assertSame('blocked', $second->fresh()->status);

        $export = $this->post('/api/admin/recruiters/bulk', [
            'ids' => [$first->id],
            'action' => 'export',
        ], ['Accept' => 'text/csv'])->assertOk();
        $this->assertStringContainsString('First Company', $export->streamedContent());

        $this->postJson('/api/admin/recruiters/bulk', [
            'ids' => [$first->id],
            'action' => 'delete',
        ])->assertOk()->assertJsonPath('updated', 1);

        $this->assertDatabaseHas('users', ['id' => $first->id]);
        $this->assertDatabaseMissing('company_profiles', ['user_id' => $first->id]);

        $this->deleteJson("/api/admin/recruiters/{$second->id}")->assertNoContent();
        $this->assertDatabaseHas('users', ['id' => $second->id]);
        $this->assertDatabaseMissing('company_profiles', ['user_id' => $second->id]);
    }
}
