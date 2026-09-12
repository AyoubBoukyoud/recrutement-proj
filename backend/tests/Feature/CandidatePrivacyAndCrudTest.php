<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CandidatePrivacyAndCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function candidate(): User
    {
        $candidate = User::factory()->create();
        $candidate->assignRole('User');
        CandidateProfileResolver::resolve($candidate);

        return $candidate;
    }

    private function asCandidate(User $candidate): static
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($candidate, 'sanctum');
    }

    public function test_cndp_consent_can_be_granted_withdrawn_and_granted_again(): void
    {
        $candidate = $this->candidate();
        $profile = $candidate->candidateProfile;
        $profile->update(['terms_consent_at' => now()]);
        $this->asCandidate($candidate);

        $this->getJson('/api/candidate/visibility')
            ->assertOk()
            ->assertJsonPath('visible', false)
            ->assertJsonPath('withdrawn', false);

        $this->postJson('/api/candidate/consent/grant')
            ->assertOk()
            ->assertJsonPath('visible', true)
            ->assertJsonPath('paused', false)
            ->assertJsonPath('withdrawn', false);

        $this->postJson('/api/candidate/consent/withdraw')
            ->assertOk()
            ->assertJsonPath('visible', false)
            ->assertJsonPath('paused', true)
            ->assertJsonPath('withdrawn', true);

        $this->postJson('/api/candidate/visibility/resume')->assertConflict();

        $this->postJson('/api/candidate/consent/grant')
            ->assertOk()
            ->assertJsonPath('visible', true);

        $profile->refresh();
        $this->assertNotNull($profile->cndp_consent_at);
        $this->assertNull($profile->cndp_withdrawn_at);
        $this->assertNull($profile->visibility_paused_at);
    }

    public function test_requesting_account_deletion_blocks_the_account_and_revokes_every_token(): void
    {
        $candidate = $this->candidate();
        $firstToken = $candidate->createToken('phone')->plainTextToken;
        $candidate->createToken('browser');

        $this->withToken($firstToken)
            ->deleteJson('/api/candidate/account')
            ->assertOk()
            ->assertJsonStructure(['deletion_scheduled_at']);

        $candidate->refresh();
        $this->assertSame('blocked', $candidate->status);
        $this->assertSame('Account deletion requested', $candidate->status_reason);
        $this->assertNotNull($candidate->deletion_requested_at);
        $this->assertSame(0, $candidate->tokens()->count());

        $this->getJson('/api/auth/me')->assertForbidden();
    }

    public function test_a_candidate_can_manage_only_their_own_education_records(): void
    {
        $owner = $this->candidate();
        $stranger = $this->candidate();
        $this->asCandidate($owner);

        $educationId = $this->postJson('/api/candidate/educations', [
            'level' => 'bachelor',
            'field' => 'Nursing',
            'institution' => 'Rabat Health Institute',
            'started_at' => '2020-09-01',
        ])->assertCreated()->json('id');

        $this->getJson('/api/candidate/educations')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $educationId);

        $this->putJson("/api/candidate/educations/{$educationId}", ['field' => 'Emergency nursing'])
            ->assertOk()
            ->assertJsonPath('field', 'Emergency nursing');

        $this->asCandidate($stranger)
            ->putJson("/api/candidate/educations/{$educationId}", ['field' => 'Tampered'])
            ->assertForbidden();
        $this->deleteJson("/api/candidate/educations/{$educationId}")->assertForbidden();

        $this->asCandidate($owner)
            ->deleteJson("/api/candidate/educations/{$educationId}")
            ->assertNoContent();
        $this->assertDatabaseMissing('educations', ['id' => $educationId]);
    }

    public function test_the_language_index_returns_the_candidate_languages(): void
    {
        $candidate = $this->candidate();
        $this->asCandidate($candidate);

        $this->putJson('/api/candidate/languages', [
            'language' => 'de',
            'cefr_level' => 'B2',
        ])->assertOk();

        $this->getJson('/api/candidate/languages')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.language', 'de')
            ->assertJsonPath('0.cefr_level', 'B2');
    }

    public function test_uploading_a_new_profile_video_replaces_the_previous_file(): void
    {
        Storage::fake('local');
        $candidate = $this->candidate();
        $profile = $candidate->candidateProfile;
        Storage::disk('local')->put('videos/old.mp4', 'old video');
        $profile->update(['presentation_video_path' => 'videos/old.mp4']);
        $this->asCandidate($candidate);

        $response = $this->postJson('/api/candidate/profile/video', [
            'video' => UploadedFile::fake()->create('introduction.mp4', 250, 'video/mp4'),
        ])->assertOk();

        $newPath = $response->json('presentation_video_path');
        $this->assertNotSame('videos/old.mp4', $newPath);
        Storage::disk('local')->assertMissing('videos/old.mp4');
        Storage::disk('local')->assertExists($newPath);
    }
}
