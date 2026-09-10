<?php

namespace Tests\Feature;

use App\Jobs\SendWebPushNotification;
use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Web Push: registering a browser subscription, and every notification the
 * platform already creates (`Notifications::create()`) queuing a real push
 * to it — not a second notification system, the same one with a delivery
 * channel added.
 */
class PushNotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    public function test_a_user_can_subscribe_resubscribe_and_unsubscribe(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $endpoint = 'https://fcm.googleapis.com/fcm/send/abc123';

        $this->postJson('/api/push/subscriptions', [
            'endpoint' => $endpoint,
            'keys' => ['p256dh' => 'p256dh-key', 'auth' => 'auth-key'],
        ])->assertCreated();

        $this->assertDatabaseCount('push_subscriptions', 1);

        // The same device subscribing again (fresh permission grant after
        // clearing site data) updates the row instead of duplicating it.
        $this->postJson('/api/push/subscriptions', [
            'endpoint' => $endpoint,
            'keys' => ['p256dh' => 'new-p256dh', 'auth' => 'new-auth'],
        ])->assertCreated();

        $this->assertDatabaseCount('push_subscriptions', 1);
        $this->assertDatabaseHas('push_subscriptions', ['user_id' => $user->id, 'p256dh' => 'new-p256dh']);

        $this->deleteJson('/api/push/subscriptions', ['endpoint' => $endpoint])->assertNoContent();
        $this->assertDatabaseCount('push_subscriptions', 0);
    }

    public function test_an_application_status_change_queues_a_web_push_job(): void
    {
        Queue::fake();

        $company = User::factory()->create();
        $company->assignRole('Company');
        $candidateUser = User::factory()->create(['phone' => '+2126'.fake()->unique()->numerify('########')]);
        $candidate = $candidateUser->candidateProfile()->create([
            'first_name' => 'Yassin', 'last_name' => 'Benali', 'terms_consent_at' => now(), 'cndp_consent_at' => now(),
        ]);
        $offer = JobOffer::create(['user_id' => $company->id, 'title' => 'Nurse', 'description' => 'Role', 'sector' => 'Health', 'city' => 'Berlin', 'contract_type' => 'permanent']);
        $application = JobApplication::create(['candidate_profile_id' => $candidate->id, 'job_offer_id' => $offer->id, 'status' => 'submitted', 'applied_at' => now(), 'status_changed_at' => now()]);

        $this->actingAs($company, 'sanctum')->patchJson("/api/recruiter/applications/{$application->id}", ['status' => 'accepted'])->assertOk();

        Queue::assertPushed(SendWebPushNotification::class);
    }
}
