<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ProfileCompleteness;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The role switcher's two real candidate accounts (complete and incomplete dossier). */
class AdminTestCandidateTest extends TestCase
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

    private function account(string $variant): User
    {
        return User::where('email', "candidat.{$variant}@test.amudskills.invalid")->firstOrFail();
    }

    public function test_the_complete_candidate_has_a_submitted_dossier_hidden_from_recruiters(): void
    {
        $admin = $this->admin();

        $response = $this->postJson('/api/admin/test-candidates/complete')
            ->assertSuccessful()
            ->assertJsonPath('user.roles', ['User'])
            ->assertJsonStructure(['token', 'expires_at']);

        $user = $this->account('complet');
        $profile = $user->candidateProfile;
        $completeness = ProfileCompleteness::for($profile);
        $this->assertTrue($completeness['can_submit']);
        $this->assertNotNull($profile->submitted_at);
        $this->assertNotNull($profile->visibility_paused_at);
        $this->assertSame('B1', $profile->languages()->where('language', 'de')->value('cefr_level'));
        $this->assertDatabaseHas('admin_activity_logs', ['actor_id' => $admin->id, 'subject_id' => $user->id, 'action' => 'impersonated']);

        // The token is the candidate's own session.
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$response->json('token'))
            ->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_switching_again_reuses_the_account_and_keeps_edits(): void
    {
        $this->admin();
        $this->postJson('/api/admin/test-candidates/complete')->assertSuccessful();
        $this->account('complet')->candidateProfile->update(['city' => 'Rabat']);

        $this->postJson('/api/admin/test-candidates/complete')->assertSuccessful();

        $this->assertSame(1, User::where('email', 'candidat.complet@test.amudskills.invalid')->count());
        $this->assertSame('Rabat', $this->account('complet')->candidateProfile->city);
    }

    public function test_the_incomplete_candidate_starts_from_an_empty_dossier_every_time(): void
    {
        $this->admin();
        $this->postJson('/api/admin/test-candidates/incomplete')->assertSuccessful();

        $profile = $this->account('incomplet')->candidateProfile;
        $profile->update(['first_name' => 'Rempli', 'submitted_at' => now()]);
        $profile->languages()->create(['language' => 'de', 'cefr_level' => 'A2', 'self_declared_cefr' => 'A2']);

        $this->postJson('/api/admin/test-candidates/incomplete')->assertSuccessful();

        $profile->refresh();
        $this->assertNull($profile->first_name);
        $this->assertNull($profile->submitted_at);
        $this->assertSame(0, $profile->languages()->count());
        $this->assertNotNull($profile->visibility_paused_at);
        $this->assertFalse(ProfileCompleteness::for($profile)['can_submit']);
    }

    public function test_only_administrators_can_open_them(): void
    {
        $user = User::factory()->create();
        $user->assignRole('User');
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/admin/test-candidates/complete')->assertForbidden();
        $this->assertDatabaseMissing('users', ['email' => 'candidat.complet@test.amudskills.invalid']);
    }

    public function test_an_unknown_variant_is_not_found(): void
    {
        $this->admin();

        $this->postJson('/api/admin/test-candidates/other')->assertNotFound();
    }
}
