<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CandidateTaskTest extends TestCase
{
    use RefreshDatabase;

    private function candidate(): array
    {
        $user = User::factory()->create();
        $profile = CandidateProfileResolver::resolve($user);

        return [$user, $profile];
    }

    public function test_a_candidate_only_sees_their_own_assignments(): void
    {
        [$candidate, $profile] = $this->candidate();
        [, $otherProfile] = $this->candidate();
        $task = Task::create(['title' => 'Réviser le vocabulaire', 'category' => 'language', 'estimated_minutes' => 20]);

        $own = TaskAssignment::create([
            'candidate_profile_id' => $profile->id,
            'task_id' => $task->id,
            'assigned_for' => today(),
        ]);
        $other = TaskAssignment::create([
            'candidate_profile_id' => $otherProfile->id,
            'task_id' => $task->id,
            'assigned_for' => today()->addDay(),
        ]);

        $this->actingAs($candidate, 'sanctum')
            ->getJson('/api/candidate/tasks')
            ->assertOk()
            ->assertJsonPath('today.0.id', $own->id)
            ->assertJsonMissing(['id' => $other->id]);
    }

    public function test_a_candidate_can_complete_their_assignment(): void
    {
        [$candidate, $profile] = $this->candidate();
        $task = Task::create(['title' => 'Préparer les documents', 'category' => 'documents', 'estimated_minutes' => 15]);
        $assignment = TaskAssignment::create([
            'candidate_profile_id' => $profile->id,
            'task_id' => $task->id,
            'assigned_for' => today(),
        ]);

        $this->actingAs($candidate, 'sanctum')
            ->patchJson("/api/candidate/tasks/{$assignment->id}", ['status' => 'completed', 'minutes_spent' => 12])
            ->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('minutes_spent', 12);

        $this->assertNotNull($assignment->fresh()->completed_at);
    }

    public function test_a_candidate_cannot_update_another_candidates_assignment(): void
    {
        [$candidate] = $this->candidate();
        [, $otherProfile] = $this->candidate();
        $task = Task::create(['title' => 'Culture allemande']);
        $assignment = TaskAssignment::create([
            'candidate_profile_id' => $otherProfile->id,
            'task_id' => $task->id,
            'assigned_for' => today(),
        ]);

        $this->actingAs($candidate, 'sanctum')
            ->patchJson("/api/candidate/tasks/{$assignment->id}", ['status' => 'completed'])
            ->assertForbidden();

        $this->assertSame('assigned', $assignment->fresh()->status);
    }
}
