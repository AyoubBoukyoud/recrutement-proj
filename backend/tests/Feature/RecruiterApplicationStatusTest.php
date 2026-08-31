<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `PATCH /recruiter/applications/{application}` — how a recruiter moves a
 * candidature through the pipeline.
 *
 * This was the last untested write path on the recruiter side, and it carries
 * three rules that are invisible from the response body: only the offer's
 * owner may touch it, an anonymized application is frozen, and every accepted
 * change notifies the candidate.
 */
class RecruiterApplicationStatusTest extends TestCase
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

    private function asUser(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'sanctum');
    }

    private function offer(User $company): JobOffer
    {
        return JobOffer::create([
            'user_id' => $company->id,
            'title' => 'Registered nurse',
            'description' => 'Hospital role',
            'sector' => 'Health',
            'city' => 'Berlin',
            'contract_type' => 'permanent',
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    private function application(JobOffer $offer, array $attributes = []): JobApplication
    {
        $candidate = $this->user('User');
        $profile = CandidateProfileResolver::resolve($candidate);
        $profile->update(['submitted_at' => now()]);

        return JobApplication::create([
            'job_offer_id' => $offer->id,
            'candidate_profile_id' => $profile->id,
            'status' => 'submitted',
            'applied_at' => now(),
            'status_changed_at' => now(),
            ...$attributes,
        ]);
    }

    public function test_the_offer_owner_can_advance_an_application(): void
    {
        $company = $this->user('Company');
        $application = $this->application($this->offer($company));

        $this->asUser($company)
            ->patchJson("/api/recruiter/applications/{$application->id}", ['status' => 'interview'])
            ->assertOk()
            ->assertJsonPath('status', 'interview');

        $this->assertDatabaseHas('job_applications', [
            'id' => $application->id,
            'status' => 'interview',
        ]);
    }

    public function test_each_status_change_stamps_status_changed_at(): void
    {
        $company = $this->user('Company');
        $application = $this->application($this->offer($company), [
            'status_changed_at' => now()->subDays(3),
        ]);
        $before = $application->status_changed_at;

        $this->asUser($company)
            ->patchJson("/api/recruiter/applications/{$application->id}", ['status' => 'viewed'])
            ->assertOk();

        $this->assertTrue($application->fresh()->status_changed_at->greaterThan($before));
    }

    public function test_the_candidate_is_notified_of_the_new_status(): void
    {
        $company = $this->user('Company');
        $application = $this->application($this->offer($company));
        $candidate = $application->candidateProfile->user;

        $this->asUser($company)
            ->patchJson("/api/recruiter/applications/{$application->id}", ['status' => 'accepted'])
            ->assertOk();

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $candidate->id,
            'type' => 'application.status',
        ]);

        $notification = AppNotification::where('user_id', $candidate->id)->latest('id')->first();
        $this->assertNotNull($notification);
        $this->assertSame('/candidatures', $notification->link);
    }

    public function test_a_recruiter_cannot_touch_another_companys_application(): void
    {
        $owner = $this->user('Company');
        $intruder = $this->user('Company');
        $application = $this->application($this->offer($owner));

        $this->asUser($intruder)
            ->patchJson("/api/recruiter/applications/{$application->id}", ['status' => 'rejected'])
            ->assertForbidden();

        // Unchanged: the refusal must not have applied a partial write.
        $this->assertSame('submitted', $application->fresh()->status);
    }

    public function test_an_anonymized_application_is_frozen(): void
    {
        $company = $this->user('Company');
        $application = $this->application($this->offer($company), [
            'anonymized_at' => now(),
        ]);

        $this->asUser($company)
            ->patchJson("/api/recruiter/applications/{$application->id}", ['status' => 'accepted'])
            ->assertStatus(409);

        $this->assertSame('submitted', $application->fresh()->status);
    }

    public function test_only_the_four_pipeline_statuses_are_accepted(): void
    {
        $company = $this->user('Company');
        $application = $this->application($this->offer($company));

        foreach (['viewed', 'interview', 'accepted', 'rejected'] as $status) {
            $this->asUser($company)
                ->patchJson("/api/recruiter/applications/{$application->id}", ['status' => $status])
                ->assertOk();
        }

        // `submitted` is the candidate's own starting state and `withdrawn` is
        // the candidate's decision — neither is the recruiter's to set.
        foreach (['submitted', 'withdrawn', 'hired', ''] as $status) {
            $this->asUser($company)
                ->patchJson("/api/recruiter/applications/{$application->id}", ['status' => $status])
                ->assertStatus(422)
                ->assertJsonValidationErrors('status');
        }
    }

    public function test_a_candidate_cannot_move_their_own_application(): void
    {
        $company = $this->user('Company');
        $application = $this->application($this->offer($company));
        $candidate = $application->candidateProfile->user;

        // The route sits behind the recruiter role, so this is a 403 from the
        // middleware rather than the ownership check in the controller.
        $this->asUser($candidate)
            ->patchJson("/api/recruiter/applications/{$application->id}", ['status' => 'accepted'])
            ->assertForbidden();
    }

    public function test_the_endpoint_requires_authentication(): void
    {
        $company = $this->user('Company');
        $application = $this->application($this->offer($company));

        $this->patchJson("/api/recruiter/applications/{$application->id}", ['status' => 'viewed'])
            ->assertUnauthorized();
    }
}
