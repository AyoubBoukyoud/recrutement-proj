<?php

namespace Tests\Feature;

use App\Models\JobOffer;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminEndpointCoverageTest extends TestCase
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

    private function candidate(): User
    {
        $candidate = User::factory()->create();
        $candidate->assignRole('User');
        CandidateProfileResolver::resolve($candidate);

        return $candidate;
    }

    public function test_candidate_status_activity_bulk_export_and_deletion_are_covered(): void
    {
        $admin = $this->admin();
        $first = $this->candidate()->candidateProfile;
        $first->update(['first_name' => 'Amina', 'last_name' => 'Tazi']);
        $second = $this->candidate()->candidateProfile;

        $this->patchJson("/api/admin/candidates/{$first->id}/status", [
            'status' => 'inactive',
            'status_reason' => 'Documents expired',
        ])->assertOk()
            ->assertJsonPath('status', 'inactive')
            ->assertJsonPath('status_changed_by_id', $admin->id);

        $this->getJson("/api/admin/candidates/{$first->id}/activity")
            ->assertOk()
            ->assertJsonFragment(['type' => 'status_changed']);

        $this->postJson('/api/admin/candidates/bulk', [
            'ids' => [$first->id, $second->id],
            'action' => 'activate',
        ])->assertOk()
            ->assertJsonPath('updated', 2)
            ->assertJsonPath('action', 'activate');

        $this->assertSame('active', $first->user->fresh()->status);
        $this->assertSame('active', $second->user->fresh()->status);

        $export = $this->post('/api/admin/candidates/bulk', [
            'ids' => [$first->id],
            'action' => 'export',
        ], ['Accept' => 'text/csv'])->assertOk();
        $this->assertStringContainsString('Amina Tazi', $export->streamedContent());

        $this->postJson('/api/admin/candidates/bulk', [
            'ids' => [$first->id],
            'action' => 'delete',
        ])->assertOk()->assertJsonPath('updated', 1);
        $this->assertDatabaseMissing('candidate_profiles', ['id' => $first->id]);

        $this->deleteJson("/api/admin/candidates/{$second->id}")->assertNoContent();
        $this->assertDatabaseMissing('candidate_profiles', ['id' => $second->id]);
    }

    public function test_admin_can_manage_the_task_catalogue_and_candidate_assignments(): void
    {
        $this->admin();
        $profile = $this->candidate()->candidateProfile;

        $taskId = $this->postJson('/api/admin/tasks', [
            'title' => 'Practise German vocabulary',
            'description' => 'Review twenty words.',
            'category' => 'language',
            'estimated_minutes' => 20,
        ])->assertCreated()->json('id');

        $this->getJson('/api/admin/tasks')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $taskId);

        $this->patchJson("/api/admin/tasks/{$taskId}", [
            'estimated_minutes' => 30,
        ])->assertOk()->assertJsonPath('estimated_minutes', 30);

        $assignmentId = $this->postJson("/api/admin/candidates/{$profile->id}/assignments", [
            'task_ids' => [$taskId],
        ])->assertCreated()->json('0.id');

        $this->getJson("/api/admin/candidates/{$profile->id}/assignments")
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $assignmentId);

        $this->patchJson("/api/admin/assignments/{$assignmentId}", [
            'status' => 'completed',
            'admin_feedback' => 'Good progress.',
        ])->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('admin_feedback', 'Good progress.');

        $this->deleteJson("/api/admin/assignments/{$assignmentId}")->assertNoContent();
        $this->assertDatabaseMissing('task_assignments', ['id' => $assignmentId]);
    }

    public function test_the_global_admin_activity_endpoint_returns_filtered_audit_events(): void
    {
        $admin = $this->admin();
        $company = User::factory()->create();
        $company->assignRole('Company');
        $offer = JobOffer::create([
            'user_id' => $company->id,
            'title' => 'Electrician',
            'description' => 'Industrial maintenance',
            'sector' => 'Industry',
            'city' => 'Munich',
            'contract_type' => 'permanent',
            'status' => 'draft',
        ]);

        $this->patchJson("/api/admin/offers/{$offer->id}", ['status' => 'published'])
            ->assertOk();

        $this->getJson("/api/admin/activity?action=offer_status_changed&actor_id={$admin->id}")
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.action', 'offer_status_changed')
            ->assertJsonPath('data.0.actor_id', $admin->id);
    }
}
