<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Models\Task;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CandidateRoleCompletionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function user(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    private function candidate(): User
    {
        $user = $this->user('User');
        CandidateProfileResolver::resolve($user);

        return $user;
    }

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'sanctum');
    }

    public function test_candidate_notifications_are_emitted_with_translatable_payloads(): void
    {
        $candidate = $this->candidate();
        $admin = $this->user('Administrator');
        $document = $candidate->candidateProfile->documents()->create([
            'type' => 'cv',
            'file_path' => 'documents/cv.pdf',
            'ocr_status' => 'completed',
        ]);
        $complaint = $candidate->complaints()->create([
            'type' => 'text',
            'body' => 'Please help',
            'status' => 'open',
        ]);
        $task = Task::create([
            'title' => 'German practice',
            'category' => 'language',
            'estimated_minutes' => 30,
            'created_by_id' => $admin->id,
        ]);

        $this->as($admin)
            ->patchJson("/api/admin/documents/{$document->id}/approval", [
                'approval_status' => 'rejected',
                'rejection_reason' => 'The scan is unreadable.',
            ])->assertOk();
        $this->patchJson("/api/admin/complaints/{$complaint->id}", [
            'response' => 'Please upload a new scan.',
        ])->assertOk();
        $this->postJson("/api/admin/candidates/{$candidate->candidateProfile->id}/assignments", [
            'task_ids' => [$task->id],
            'assigned_for' => today()->toDateString(),
        ])->assertCreated();

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $candidate->id,
            'type' => 'document.reviewed',
        ]);
        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $candidate->id,
            'type' => 'complaint.answered',
        ]);
        $tasksNotification = AppNotification::where('user_id', $candidate->id)
            ->where('type', 'tasks.assigned')->firstOrFail();
        $this->assertSame(1, $tasksNotification->payload['count']);
        $this->assertSame(today()->toDateString(), $tasksNotification->payload['date']);
    }

    public function test_publishing_a_matching_offer_notifies_the_candidate_and_returns_a_score(): void
    {
        $candidate = $this->candidate();
        $candidate->candidateProfile->update([
            'matching_preferences' => [
                'sectors' => ['Health'],
                'regions' => ['Berlin'],
                'min_salary' => 2500,
            ],
        ]);
        $company = $this->user('Company');

        $offerId = $this->as($company)->postJson('/api/recruiter/offers', [
            'title' => 'Registered nurse',
            'description' => 'Hospital role',
            'sector' => 'Health',
            'city' => 'Berlin',
            'salary_min' => 2800,
            'contract_type' => 'permanent',
            'status' => 'published',
        ])->assertCreated()->json('id');

        $notification = AppNotification::where('user_id', $candidate->id)
            ->where('type', 'offer.matched')->firstOrFail();
        $this->assertSame(100, $notification->payload['match_score']);

        $this->as($candidate)->getJson("/api/offers/{$offerId}")
            ->assertOk()
            ->assertJsonPath('match_score', 100);
    }

    public function test_a_blocked_candidate_can_cancel_a_pending_deletion(): void
    {
        $candidate = $this->candidate();
        $candidate->update([
            'status' => 'blocked',
            'deletion_requested_at' => now()->addDays(30),
        ]);

        $this->as($candidate)->postJson('/api/candidate/account/cancel-deletion')
            ->assertOk()
            ->assertJsonPath('cancelled', true);

        $candidate->refresh();
        $this->assertSame('active', $candidate->status);
        $this->assertNull($candidate->deletion_requested_at);
    }

    public function test_the_purge_command_erases_files_and_keeps_only_an_anonymized_application(): void
    {
        Storage::fake('local');
        $candidate = $this->candidate();
        $profile = $candidate->candidateProfile;
        $company = $this->user('Company');
        $offer = JobOffer::create([
            'user_id' => $company->id,
            'title' => 'Nurse',
            'description' => 'Hospital role',
            'sector' => 'Health',
            'city' => 'Berlin',
            'contract_type' => 'permanent',
            'status' => 'published',
            'published_at' => now(),
        ]);
        $application = JobApplication::create([
            'candidate_profile_id' => $profile->id,
            'job_offer_id' => $offer->id,
            'status' => 'submitted',
            'applied_at' => now(),
            'status_changed_at' => now(),
        ]);

        foreach (['videos/profile.mp4', 'documents/cv.pdf', 'assessments/de.wav', 'complaints/message.m4a'] as $path) {
            Storage::disk('local')->put($path, 'private data');
        }
        $profile->update(['presentation_video_path' => 'videos/profile.mp4']);
        $profile->documents()->create([
            'type' => 'cv',
            'file_path' => 'documents/cv.pdf',
            'ocr_status' => 'completed',
        ]);
        $profile->languageAssessments()->create([
            'language' => 'de',
            'audio_path' => 'assessments/de.wav',
            'status' => 'completed',
        ]);
        $candidate->complaints()->create([
            'type' => 'voice',
            'audio_path' => 'complaints/message.m4a',
            'status' => 'open',
        ]);
        $candidate->update([
            'status' => 'blocked',
            'deletion_requested_at' => now()->subDay(),
        ]);

        $this->artisan('candidates:purge-deleted')->assertSuccessful();

        $this->assertDatabaseMissing('users', ['id' => $candidate->id]);
        $this->assertDatabaseMissing('candidate_profiles', ['id' => $profile->id]);
        $this->assertDatabaseHas('job_applications', [
            'id' => $application->id,
            'candidate_profile_id' => null,
        ]);
        $this->assertNotNull($application->fresh()->anonymized_at);
        Storage::disk('local')->assertMissing('videos/profile.mp4');
        Storage::disk('local')->assertMissing('documents/cv.pdf');
        Storage::disk('local')->assertMissing('assessments/de.wav');
        Storage::disk('local')->assertMissing('complaints/message.m4a');
    }

    public function test_candidate_skills_are_crud_and_owner_scoped(): void
    {
        $candidate = $this->candidate();
        $other = $this->candidate();
        $skillId = $this->as($candidate)->postJson('/api/candidate/skills', [
            'skill' => 'Emergency nursing',
            'level' => 'avance',
            'years_of_experience' => 4,
        ])->assertCreated()->json('id');

        $this->getJson('/api/candidate/skills')
            ->assertOk()
            ->assertJsonPath('0.skill', 'Emergency nursing');
        $this->as($other)->deleteJson("/api/candidate/skills/{$skillId}")->assertForbidden();
        $this->as($candidate)->deleteJson("/api/candidate/skills/{$skillId}")->assertNoContent();
    }
}
