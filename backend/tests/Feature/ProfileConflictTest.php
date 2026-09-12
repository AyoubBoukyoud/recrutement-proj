<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Two devices, one dossier.
 *
 * Sessions run on several devices at once and an offline edit can sit in the
 * queue for hours, so the last request to arrive is not necessarily the one
 * the candidate meant to keep.
 */
class ProfileConflictTest extends TestCase
{
    use RefreshDatabase;

    private User $candidate;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->candidate = User::factory()->create();
        $this->actingAs($this->candidate, 'sanctum');
    }

    public function test_an_edit_composed_against_the_current_version_is_applied(): void
    {
        $profile = CandidateProfileResolver::resolve($this->candidate);

        $this->putJson('/api/candidate/profile', [
            'first_name' => 'Yassin',
            'base_updated_at' => $profile->updated_at->toIso8601String(),
        ])->assertOk();

        $this->assertSame('Yassin', $profile->fresh()->first_name);
    }

    public function test_an_edit_composed_against_a_replaced_version_is_refused(): void
    {
        $profile = CandidateProfileResolver::resolve($this->candidate);
        $profile->update(['first_name' => 'Written on the laptop']);

        // The phone had been offline since before that write.
        $stale = $profile->updated_at->copy()->subMinutes(30);

        $this->putJson('/api/candidate/profile', [
            'first_name' => 'Written on the phone',
            'base_updated_at' => $stale->toIso8601String(),
        ])
            ->assertStatus(409)
            ->assertJsonPath('reason', 'conflict')
            // The other version comes back with the refusal, so the client can
            // show what it would have overwritten.
            ->assertJsonPath('server.first_name', 'Written on the laptop');

        $this->assertSame('Written on the laptop', $profile->fresh()->first_name);
    }

    public function test_the_candidate_can_insist_on_their_own_version(): void
    {
        $profile = CandidateProfileResolver::resolve($this->candidate);
        $profile->update(['first_name' => 'Written on the laptop']);
        $stale = $profile->updated_at->copy()->subMinutes(30);

        // What "Keep my version" sends after the queue surfaced the conflict.
        $this->putJson('/api/candidate/profile', [
            'first_name' => 'Written on the phone',
            'base_updated_at' => $stale->toIso8601String(),
            'force' => true,
        ])->assertOk();

        $this->assertSame('Written on the phone', $profile->fresh()->first_name);
    }

    public function test_a_client_that_sends_no_version_keeps_last_write_wins(): void
    {
        $profile = CandidateProfileResolver::resolve($this->candidate);
        $profile->update(['first_name' => 'Written on the laptop']);

        // Older builds of the app, and the steps that write a single field.
        $this->putJson('/api/candidate/profile', ['first_name' => 'No version sent'])->assertOk();

        $this->assertSame('No version sent', $profile->fresh()->first_name);
    }

    public function test_a_conflict_does_not_partially_apply_the_edit(): void
    {
        $profile = CandidateProfileResolver::resolve($this->candidate);
        $profile->update(['first_name' => 'Laptop', 'profession' => 'Nurse']);
        $stale = $profile->updated_at->copy()->subMinutes(30);

        $this->putJson('/api/candidate/profile', [
            'first_name' => 'Phone',
            'profession' => 'Welder',
            'specialization' => 'MIG',
            'base_updated_at' => $stale->toIso8601String(),
        ])->assertStatus(409);

        $profile->refresh();
        $this->assertSame('Nurse', $profile->profession);
        $this->assertNull($profile->specialization);
    }
}
