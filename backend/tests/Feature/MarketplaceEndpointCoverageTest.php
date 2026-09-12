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

class MarketplaceEndpointCoverageTest extends TestCase
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

    private function offer(User $company, array $attributes = []): JobOffer
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
            ...$attributes,
        ]);
    }

    private function submittedCandidate(string $level = 'B2'): User
    {
        $candidate = $this->user('User');
        $profile = CandidateProfileResolver::resolve($candidate);
        $profile->update(['submitted_at' => now()]);
        $profile->languages()->create(['language' => 'de', 'cefr_level' => $level]);

        return $candidate;
    }

    public function test_only_a_published_offer_can_be_viewed_favorited_and_listed(): void
    {
        $company = $this->user('Company');
        $published = $this->offer($company);
        $draft = $this->offer($company, ['status' => 'draft', 'published_at' => null, 'title' => 'Draft']);
        $candidate = $this->user('User');
        $profile = CandidateProfileResolver::resolve($candidate);
        $this->asUser($candidate);

        $this->getJson("/api/offers/{$published->id}")
            ->assertOk()
            ->assertJsonPath('id', $published->id);
        $this->getJson("/api/offers/{$draft->id}")->assertNotFound();

        $this->postJson("/api/offers/{$published->id}/favorite")
            ->assertCreated()
            ->assertJsonPath('favorited', true);
        $this->postJson("/api/offers/{$draft->id}/favorite")->assertNotFound();

        $this->getJson('/api/candidate/favorites')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $published->id);

        $this->deleteJson("/api/offers/{$published->id}/favorite")->assertNoContent();
        $this->assertDatabaseMissing('job_offer_favorites', [
            'candidate_profile_id' => $profile->id,
            'job_offer_id' => $published->id,
        ]);
    }

    public function test_application_prerequisites_listing_and_withdrawal_are_enforced(): void
    {
        $company = $this->user('Company');
        $offer = $this->offer($company, ['required_cefr_level' => 'B1']);
        $incomplete = $this->user('User');
        CandidateProfileResolver::resolve($incomplete);

        $this->asUser($incomplete)
            ->postJson("/api/offers/{$offer->id}/apply")
            ->assertUnprocessable();

        $candidate = $this->submittedCandidate('A2');
        $this->asUser($candidate)
            ->postJson("/api/offers/{$offer->id}/apply")
            ->assertUnprocessable();

        $candidate->candidateProfile->languages()->update(['cefr_level' => 'B1']);
        $applicationId = $this->postJson("/api/offers/{$offer->id}/apply")
            ->assertCreated()
            ->json('id');

        $this->getJson('/api/candidate/applications')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $applicationId);

        $stranger = $this->submittedCandidate();
        $this->asUser($stranger)
            ->deleteJson("/api/candidate/applications/{$applicationId}")
            ->assertForbidden();

        $this->asUser($candidate)
            ->deleteJson("/api/candidate/applications/{$applicationId}")
            ->assertOk()
            ->assertJsonPath('status', 'withdrawn');
        $this->deleteJson("/api/candidate/applications/{$applicationId}")->assertConflict();
    }

    public function test_a_recruiter_can_list_update_and_delete_only_their_offers(): void
    {
        $company = $this->user('Company');
        $otherCompany = $this->user('Company');
        $mine = $this->offer($company, ['status' => 'draft', 'published_at' => null]);
        $theirs = $this->offer($otherCompany, ['title' => 'Other offer']);
        $this->asUser($company);

        $this->getJson('/api/recruiter/offers?status=draft')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $mine->id);

        $this->patchJson("/api/recruiter/offers/{$mine->id}", [
            'title' => 'Senior registered nurse',
            'status' => 'published',
        ])->assertOk()
            ->assertJsonPath('title', 'Senior registered nurse')
            ->assertJsonPath('status', 'published');

        $this->patchJson("/api/recruiter/offers/{$theirs->id}", ['title' => 'Tampered'])
            ->assertForbidden();
        $this->deleteJson("/api/recruiter/offers/{$theirs->id}")->assertForbidden();

        $deletable = $this->offer($company, ['status' => 'draft', 'published_at' => null, 'title' => 'Delete me']);
        $this->deleteJson("/api/recruiter/offers/{$deletable->id}")->assertNoContent();
        $this->assertDatabaseMissing('job_offers', ['id' => $deletable->id]);
    }

    public function test_recruiter_application_listing_is_scoped_to_owned_offers(): void
    {
        $company = $this->user('Company');
        $otherCompany = $this->user('Company');
        $candidate = $this->submittedCandidate();
        $mine = $this->offer($company);
        $theirs = $this->offer($otherCompany, ['title' => 'Other company']);

        $ownApplication = JobApplication::create([
            'candidate_profile_id' => $candidate->candidateProfile->id,
            'job_offer_id' => $mine->id,
            'status' => 'interview',
            'applied_at' => now(),
            'status_changed_at' => now(),
        ]);
        JobApplication::create([
            'candidate_profile_id' => $candidate->candidateProfile->id,
            'job_offer_id' => $theirs->id,
            'status' => 'submitted',
            'applied_at' => now(),
            'status_changed_at' => now(),
        ]);

        $this->asUser($company)
            ->getJson('/api/recruiter/applications?status=interview')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $ownApplication->id);
    }

    public function test_notifications_can_only_be_read_by_their_owner(): void
    {
        $candidate = $this->user('User');
        $other = $this->user('User');
        $first = AppNotification::create([
            'user_id' => $candidate->id,
            'type' => 'application.status',
            'title' => 'Application updated',
            'body' => 'interview',
        ]);
        $second = AppNotification::create([
            'user_id' => $candidate->id,
            'type' => 'application.status',
            'title' => 'Application updated again',
            'body' => 'accepted',
        ]);
        $foreign = AppNotification::create([
            'user_id' => $other->id,
            'type' => 'application.status',
            'title' => 'Private',
            'body' => 'submitted',
        ]);
        $this->asUser($candidate);

        $this->patchJson("/api/candidate/notifications/{$first->id}/read")
            ->assertOk()
            ->assertJsonPath('id', $first->id);
        $this->patchJson("/api/candidate/notifications/{$foreign->id}/read")->assertForbidden();
        $this->patchJson('/api/candidate/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertNotNull($first->fresh()->read_at);
        $this->assertNotNull($second->fresh()->read_at);
        $this->assertNull($foreign->fresh()->read_at);
    }
}
