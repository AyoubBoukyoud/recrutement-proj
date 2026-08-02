<?php

namespace Tests\Feature;

use App\Models\CandidateProfile;
use App\Models\Task;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use App\Services\TaskEngagement;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The administrative workspace: the daily internship, opening a dossier,
 * vouching for it, approving what is in it, and who is allowed to do any of it.
 */
class AdminOperationsTest extends TestCase
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
        $user = User::factory()->create();
        CandidateProfileResolver::resolve($user);

        return $user;
    }

    private function asCandidate(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'sanctum');
    }

    private function task(array $attributes = []): Task
    {
        return Task::create([
            'title' => 'Read one German news article aloud',
            'category' => 'language',
            'estimated_minutes' => 30,
            'is_active' => true,
            ...$attributes,
        ]);
    }

    // --- Access control ----------------------------------------------------

    public function test_the_admin_surface_is_closed_to_everyone_else(): void
    {
        $candidate = $this->candidate();
        $this->asCandidate($candidate);

        $this->getJson('/api/admin/metrics')->assertForbidden();
        $this->getJson('/api/admin/candidates')->assertForbidden();
        $this->getJson('/api/admin/users')->assertForbidden();
        $this->getJson('/api/admin/tasks')->assertForbidden();
    }

    public function test_an_unknown_admin_path_is_a_404_not_a_501(): void
    {
        $this->admin();

        // The catch-all used to answer 501 for everything unbuilt, which meant
        // a typo'd path claimed the feature was merely pending.
        $this->getJson('/api/admin/nothing-here')->assertNotFound();
    }

    // --- The daily internship ---------------------------------------------

    public function test_an_administrator_assigns_a_days_activities_in_one_call(): void
    {
        $admin = $this->admin();
        $candidate = $this->candidate();
        $profile = $candidate->candidateProfile;

        $first = $this->task();
        $second = $this->task(['title' => 'Practise the B1 vocabulary list', 'estimated_minutes' => 25]);

        $this->postJson("/api/admin/candidates/{$profile->id}/assignments", [
            'task_ids' => [$first->id, $second->id],
        ])->assertCreated()->assertJsonCount(2);

        $this->assertSame(2, $profile->taskAssignments()->count());
        $this->assertSame($admin->id, $profile->taskAssignments()->first()->assigned_by_id);
    }

    public function test_assigning_the_same_activity_twice_in_a_day_does_not_duplicate_it(): void
    {
        $this->admin();
        $profile = $this->candidate()->candidateProfile;
        $task = $this->task();

        $this->postJson("/api/admin/candidates/{$profile->id}/assignments", ['task_ids' => [$task->id]])
            ->assertCreated();
        $this->postJson("/api/admin/candidates/{$profile->id}/assignments", ['task_ids' => [$task->id]])
            ->assertCreated();

        $this->assertSame(1, $profile->taskAssignments()->count());
    }

    public function test_a_retired_activity_cannot_be_assigned(): void
    {
        $this->admin();
        $profile = $this->candidate()->candidateProfile;
        $task = $this->task(['is_active' => false]);

        $this->postJson("/api/admin/candidates/{$profile->id}/assignments", ['task_ids' => [$task->id]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('task_ids');
    }

    public function test_retiring_an_activity_keeps_the_assignments_that_reference_it(): void
    {
        $this->admin();
        $profile = $this->candidate()->candidateProfile;
        $task = $this->task();

        $this->postJson("/api/admin/candidates/{$profile->id}/assignments", ['task_ids' => [$task->id]]);
        $this->deleteJson("/api/admin/tasks/{$task->id}")->assertSuccessful();

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'is_active' => false]);
        $this->assertSame(1, $profile->taskAssignments()->count());
    }

    public function test_a_candidate_sees_todays_work_and_marks_it_done(): void
    {
        $this->admin();
        $candidate = $this->candidate();
        $profile = $candidate->candidateProfile;
        $task = $this->task();

        $assignmentId = $this->postJson("/api/admin/candidates/{$profile->id}/assignments", [
            'task_ids' => [$task->id],
        ])->json('0.id');

        $this->asCandidate($candidate);

        $this->getJson('/api/candidate/tasks')
            ->assertSuccessful()
            ->assertJsonCount(1, 'today')
            ->assertJsonPath('today.0.task.title', 'Read one German news article aloud');

        $this->patchJson("/api/candidate/tasks/{$assignmentId}", [
            'status' => 'completed',
            'minutes_spent' => 35,
            'candidate_note' => 'Struggled with the long compound nouns.',
        ])->assertSuccessful()->assertJsonPath('status', 'completed');

        $this->getJson('/api/candidate/tasks')
            ->assertJsonPath('engagement.completed', 1)
            ->assertJsonPath('engagement.completion_rate', 100)
            ->assertJsonPath('engagement.streak_days', 1)
            ->assertJsonPath('engagement.active_today', true)
            ->assertJsonPath('engagement.minutes_last_7_days', 35);
    }

    public function test_reopening_a_task_ticked_by_mistake_clears_its_completion(): void
    {
        $this->admin();
        $candidate = $this->candidate();
        $profile = $candidate->candidateProfile;
        $task = $this->task();

        $id = $this->postJson("/api/admin/candidates/{$profile->id}/assignments", ['task_ids' => [$task->id]])
            ->json('0.id');

        $this->asCandidate($candidate);
        $this->patchJson("/api/candidate/tasks/{$id}", ['status' => 'completed', 'minutes_spent' => 30]);
        $this->patchJson("/api/candidate/tasks/{$id}", ['status' => 'assigned'])->assertSuccessful();

        // A stale completed_at would keep it counting towards the streak.
        $this->assertNull($profile->taskAssignments()->find($id)->completed_at);
        $this->getJson('/api/candidate/tasks')->assertJsonPath('engagement.streak_days', 0);
    }

    public function test_a_candidate_cannot_touch_another_candidates_assignment(): void
    {
        $this->admin();
        $stranger = $this->candidate();
        $task = $this->task();

        $id = $this->postJson("/api/admin/candidates/{$stranger->candidateProfile->id}/assignments", [
            'task_ids' => [$task->id],
        ])->json('0.id');

        $this->asCandidate($this->candidate());

        $this->patchJson("/api/candidate/tasks/{$id}", ['status' => 'completed'])->assertForbidden();
    }

    public function test_yesterdays_unfinished_work_is_overdue_not_lost(): void
    {
        $this->admin();
        $candidate = $this->candidate();
        $profile = $candidate->candidateProfile;

        $profile->taskAssignments()->create([
            'task_id' => $this->task()->id,
            'assigned_for' => today()->subDays(3),
        ]);

        $this->asCandidate($candidate);

        $this->getJson('/api/candidate/tasks')
            ->assertSuccessful()
            ->assertJsonCount(0, 'today')
            ->assertJsonCount(1, 'overdue')
            ->assertJsonPath('engagement.overdue', 1);
    }

    public function test_a_candidate_with_no_assignments_reports_no_rate_rather_than_zero(): void
    {
        $profile = $this->candidate()->candidateProfile;

        // "Nobody assigned them anything" must not render as "did none of it".
        $this->assertNull(TaskEngagement::for($profile)['completion_rate']);
    }

    public function test_a_streak_survives_having_not_started_today_yet(): void
    {
        $profile = $this->candidate()->candidateProfile;
        $task = $this->task();

        foreach ([1, 2, 3] as $daysAgo) {
            $profile->taskAssignments()->create([
                'task_id' => $this->task(['title' => "Day {$daysAgo}"])->id,
                'assigned_for' => today()->subDays($daysAgo),
                'status' => 'completed',
                'completed_at' => today()->subDays($daysAgo)->setHour(19),
                'minutes_spent' => 20,
            ]);
        }

        $engagement = TaskEngagement::for($profile->fresh());

        $this->assertSame(3, $engagement['streak_days']);
        $this->assertFalse($engagement['active_today']);
        $this->assertSame(60, $engagement['minutes_last_7_days']);
        $this->assertSame($task->id, $task->id);
    }

    // --- Candidate detail, verification, document approval ------------------

    public function test_an_administrator_can_open_a_full_dossier(): void
    {
        $this->admin();
        $candidate = $this->candidate();
        $profile = $candidate->candidateProfile;
        $profile->update(['first_name' => 'Yassin', 'last_name' => 'El Amrani']);
        $profile->educations()->create(['level' => 'bachelor', 'field' => 'Nursing']);

        $profile->taskAssignments()->create([
            'task_id' => $this->task()->id,
            'assigned_for' => today(),
        ]);

        $this->getJson("/api/admin/candidates/{$profile->id}")
            ->assertSuccessful()
            ->assertJsonPath('first_name', 'Yassin')
            ->assertJsonPath('user.phone', $candidate->phone)
            ->assertJsonCount(1, 'educations')
            // The detail view carries what the assignment panel renders off it.
            ->assertJsonCount(1, 'task_assignments')
            ->assertJsonPath('task_assignments.0.task.title', 'Read one German news article aloud')
            ->assertJsonStructure(['completeness', 'checklist', 'engagement', 'documents']);
    }

    public function test_an_administrator_vouches_for_a_dossier(): void
    {
        $admin = $this->admin();
        $profile = $this->candidate()->candidateProfile;

        $this->patchJson("/api/admin/candidates/{$profile->id}", [
            'verified' => true,
            'admin_notes' => 'Diplomas checked against the register.',
        ])->assertSuccessful()->assertJsonPath('verified_by_id', $admin->id);

        $this->assertNotNull($profile->fresh()->verified_at);

        $this->patchJson("/api/admin/candidates/{$profile->id}", ['verified' => false])
            ->assertSuccessful();

        $profile->refresh();
        $this->assertNull($profile->verified_at);
        $this->assertNull($profile->verified_by_id);
        // Un-verifying is not un-noting.
        $this->assertSame('Diplomas checked against the register.', $profile->admin_notes);
    }

    public function test_a_document_can_be_approved_or_rejected_with_a_reason(): void
    {
        $admin = $this->admin();
        $profile = $this->candidate()->candidateProfile;

        $document = $profile->documents()->create([
            'type' => 'diploma', 'file_path' => 'documents/d.pdf', 'ocr_status' => 'completed',
        ]);

        $this->patchJson("/api/admin/documents/{$document->id}/approval", ['approval_status' => 'approved'])
            ->assertSuccessful()
            ->assertJsonPath('approval_status', 'approved')
            ->assertJsonPath('reviewed_by_id', $admin->id);

        $this->patchJson("/api/admin/documents/{$document->id}/approval", ['approval_status' => 'rejected'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('rejection_reason');

        $this->patchJson("/api/admin/documents/{$document->id}/approval", [
            'approval_status' => 'rejected',
            'rejection_reason' => 'This is a payslip, not a diploma.',
        ])->assertSuccessful()->assertJsonPath('rejection_reason', 'This is a payslip, not a diploma.');
    }

    // --- Listing, filtering, pagination -------------------------------------

    public function test_the_candidate_list_paginates_and_filters(): void
    {
        $this->admin();

        for ($i = 0; $i < 7; $i++) {
            $profile = $this->candidate()->candidateProfile;
            $profile->update(['first_name' => "Candidate{$i}"]);
        }
        CandidateProfile::first()->update(['submitted_at' => now()]);

        $this->getJson('/api/admin/candidates?per_page=5')
            ->assertSuccessful()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('total', 7)
            ->assertJsonPath('last_page', 2);

        $this->getJson('/api/admin/candidates?status=submitted')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/admin/candidates?q=Candidate3')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Candidate3');
    }

    // --- Users and roles -----------------------------------------------------

    public function test_an_administrator_grants_a_role(): void
    {
        $this->admin();
        $user = User::factory()->create();

        $this->patchJson("/api/admin/users/{$user->id}/roles", ['roles' => ['Commercial Agent']])
            ->assertSuccessful()
            ->assertJsonPath('roles', ['Commercial Agent']);

        $this->assertTrue($user->fresh()->hasRole('Commercial Agent'));
    }

    public function test_an_administrator_cannot_remove_their_own_administrator_role(): void
    {
        $admin = $this->admin();
        // Another administrator exists, so this is specifically the self-guard.
        User::factory()->create()->assignRole('Administrator');

        $this->patchJson("/api/admin/users/{$admin->id}/roles", ['roles' => ['User']])
            ->assertStatus(422)
            ->assertJsonValidationErrors('roles');

        $this->assertTrue($admin->fresh()->hasRole('Administrator'));
    }

    public function test_the_last_administrator_cannot_be_demoted(): void
    {
        $this->admin();
        $other = User::factory()->create();
        $other->assignRole('Administrator');

        // Demote the other one first, leaving exactly one administrator.
        $this->patchJson("/api/admin/users/{$other->id}/roles", ['roles' => []])->assertSuccessful();

        $lastAdmin = User::role('Administrator')->first();
        $this->assertSame(1, User::role('Administrator')->count());

        $this->patchJson("/api/admin/users/{$lastAdmin->id}/roles", ['roles' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors('roles');
    }

    public function test_the_user_list_filters_by_role(): void
    {
        $this->admin();
        User::factory()->create()->assignRole('Company');
        User::factory()->create();

        $this->getJson('/api/admin/users?role=Company')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.roles', ['Company']);
    }

    public function test_the_assignable_roles_come_from_the_database(): void
    {
        $this->admin();

        $this->getJson('/api/admin/roles')
            ->assertSuccessful()
            ->assertJsonCount(4);
    }

    // --- Metrics --------------------------------------------------------------

    public function test_metrics_summarise_the_platform(): void
    {
        $this->admin();

        $submitted = $this->candidate()->candidateProfile;
        $submitted->update(['submitted_at' => now(), 'terms_consent_at' => now(), 'cndp_consent_at' => now()]);
        $submitted->documents()->create([
            'type' => 'cv', 'file_path' => 'documents/cv.pdf', 'ocr_status' => 'completed',
        ]);

        $draft = $this->candidate()->candidateProfile;
        $draft->taskAssignments()->create([
            'task_id' => $this->task()->id,
            'assigned_for' => today(),
            'status' => 'completed',
            'completed_at' => now(),
            'minutes_spent' => 40,
        ]);

        $this->getJson('/api/admin/metrics')
            ->assertSuccessful()
            ->assertJsonPath('candidates.total', 2)
            ->assertJsonPath('candidates.submitted', 1)
            ->assertJsonPath('candidates.drafts', 1)
            ->assertJsonPath('candidates.discoverable', 1)
            ->assertJsonPath('documents.awaiting_approval', 1)
            ->assertJsonPath('internship.assigned_today', 1)
            ->assertJsonPath('internship.completed_today', 1)
            ->assertJsonPath('internship.active_candidates_today', 1);
    }
}
