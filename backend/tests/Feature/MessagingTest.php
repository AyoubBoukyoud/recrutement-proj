<?php

namespace Tests\Feature;

use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessagingTest extends TestCase
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

    /** @return array{candidate: User, recruiter: User, application: JobApplication} */
    private function application(): array
    {
        $candidate = $this->user('User');
        $recruiter = $this->user('Company');
        $profile = CandidateProfileResolver::resolve($candidate);
        $profile->update(['submitted_at' => now()]);
        $offer = JobOffer::create([
            'user_id' => $recruiter->id,
            'title' => 'Infirmier',
            'description' => 'Poste en clinique',
            'sector' => 'Santé',
            'city' => 'Casablanca',
            'contract_type' => 'permanent',
            'status' => 'published',
        ]);
        $application = JobApplication::create([
            'candidate_profile_id' => $profile->id,
            'job_offer_id' => $offer->id,
            'status' => 'submitted',
            'applied_at' => now(),
            'status_changed_at' => now(),
        ]);

        return compact('candidate', 'recruiter', 'application');
    }

    public function test_candidate_and_recruiter_can_message_only_about_the_application(): void
    {
        ['candidate' => $candidate, 'recruiter' => $recruiter, 'application' => $application] = $this->application();

        $this->actingAs($recruiter, 'sanctum')
            ->postJson('/api/messages', ['application_id' => $application->id, 'body' => 'Bonjour, votre profil nous intéresse.'])
            ->assertCreated()
            ->assertJsonPath('message.is_mine', true);

        $recruiterThreads = $this->getJson('/api/messages')
            ->assertOk()
            ->assertJsonPath('data.0.unread_count', 0);
        $this->assertStringNotContainsString($candidate->phone, $recruiterThreads->getContent());
        $conversationId = $recruiterThreads->json('data.0.id');

        $candidateThreads = $this->actingAs($candidate, 'sanctum')
            ->getJson('/api/messages')
            ->assertOk()
            ->assertJsonPath('data.0.unread_count', 1)
            ->assertJsonPath('data.0.offer_title', 'Infirmier');
        $this->assertStringNotContainsString($recruiter->phone, $candidateThreads->getContent());

        $this->getJson("/api/messages/{$conversationId}")
            ->assertOk()
            ->assertJsonPath('messages.0.body', 'Bonjour, votre profil nous intéresse.');

        $this->patchJson("/api/messages/{$conversationId}/read")->assertOk();
        $this->assertDatabaseMissing('messages', ['conversation_id' => $conversationId, 'read_at' => null]);
    }

    public function test_an_unrelated_user_cannot_read_or_start_a_conversation(): void
    {
        ['candidate' => $candidate, 'recruiter' => $recruiter, 'application' => $application] = $this->application();
        $outsider = $this->user('User');

        $this->actingAs($outsider, 'sanctum')
            ->postJson('/api/messages', ['application_id' => $application->id, 'body' => 'Accès interdit'])
            ->assertForbidden();

        $this->actingAs($recruiter, 'sanctum')
            ->postJson('/api/messages', ['application_id' => $application->id, 'body' => 'Bonjour'])
            ->assertCreated();
        $conversationId = $this->getJson('/api/messages')->json('data.0.id');

        $this->actingAs($outsider, 'sanctum')->getJson("/api/messages/{$conversationId}")->assertForbidden();
        $this->actingAs($candidate, 'sanctum')->postJson("/api/messages/{$conversationId}/messages", ['body' => 'Réponse'])->assertCreated();
    }
}
