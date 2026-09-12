<?php

namespace Tests\Feature;

use App\Models\RecruitmentCenter;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A shared call log for training/recruitment centers: any commercial or
 * administrator can add a center and log a comment, and everyone with
 * access sees the same history.
 */
class RecruitmentCenterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function agent(): User
    {
        $user = User::factory()->create();
        $user->assignRole('Commercial Agent');

        return $user;
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('Administrator');

        return $user;
    }

    public function test_a_commercial_can_create_a_center_and_log_a_call(): void
    {
        $agent = $this->agent();

        $center = $this->actingAs($agent, 'sanctum')->postJson('/api/recruitment-centers', [
            'name' => 'Centre Atlas Formation',
            'category' => 'training_center',
            'phone' => '+212522000000',
            'city' => 'Casablanca',
        ])->assertCreated()->json();

        $this->assertSame('Centre Atlas Formation', $center['name']);
        $this->assertSame('training_center', $center['category']);
        $this->assertSame('not_called', $center['call_status']);
        $this->assertSame('pending', $center['offer_status']);
        $this->assertSame(0, $center['notes_count']);

        $this->actingAs($agent, 'sanctum')
            ->postJson("/api/recruitment-centers/{$center['id']}/notes", [
                'body' => "Appelé le 12/09, intéressés, à relancer début octobre.",
            ])
            ->assertCreated()
            ->assertJsonPath('body', "Appelé le 12/09, intéressés, à relancer début octobre.");

        $show = $this->actingAs($agent, 'sanctum')
            ->getJson("/api/recruitment-centers/{$center['id']}")->assertOk()->json();

        $this->assertCount(1, $show['notes']);
        $this->assertSame($agent->name, $show['notes'][0]['author']);
    }

    public function test_an_administrator_sees_a_note_a_commercial_wrote_and_can_add_their_own(): void
    {
        $agent = $this->agent();
        $admin = $this->admin();

        $center = RecruitmentCenter::create([
            'name' => 'Institut du Nord',
            'category' => 'training_center',
            'created_by' => $agent->id,
        ]);

        $this->actingAs($agent, 'sanctum')
            ->postJson("/api/recruitment-centers/{$center->id}/notes", ['body' => 'Premier contact, sans réponse.'])
            ->assertCreated();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/recruitment-centers/{$center->id}/notes", ['body' => 'Relancé par email.'])
            ->assertCreated();

        $notes = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/recruitment-centers/{$center->id}")->assertOk()->json('notes');

        $this->assertCount(2, $notes);
        $this->assertSame('Relancé par email.', $notes[0]['body']);
        $this->assertSame('Premier contact, sans réponse.', $notes[1]['body']);
    }

    public function test_the_index_lists_centers_with_their_last_note_and_can_be_searched(): void
    {
        $agent = $this->agent();

        $casa = RecruitmentCenter::create(['name' => 'Centre Casablanca', 'category' => 'training_center', 'city' => 'Casablanca', 'created_by' => $agent->id]);
        RecruitmentCenter::create(['name' => 'Entreprise Munich GmbH', 'category' => 'business_germany', 'city' => 'Rabat', 'created_by' => $agent->id]);

        $this->actingAs($agent, 'sanctum')
            ->postJson("/api/recruitment-centers/{$casa->id}/notes", ['body' => 'Rendez-vous fixé.'])
            ->assertCreated();

        $rows = $this->actingAs($agent, 'sanctum')
            ->getJson('/api/recruitment-centers?q=Casablanca')->assertOk()->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame('Centre Casablanca', $rows[0]['name']);
        $this->assertSame(1, $rows[0]['notes_count']);
        $this->assertSame('Rendez-vous fixé.', $rows[0]['last_note']['body']);
    }

    public function test_the_call_and_offer_status_move_forward_on_the_same_record(): void
    {
        $agent = $this->agent();

        $center = RecruitmentCenter::create([
            'name' => 'Entreprise Bayern Logistik',
            'category' => 'business_germany',
            'created_by' => $agent->id,
        ]);

        $this->assertSame('not_called', $center->refresh()->call_status);
        $this->assertSame('pending', $center->offer_status);

        $this->actingAs($agent, 'sanctum')
            ->patchJson("/api/recruitment-centers/{$center->id}", ['call_status' => 'called'])
            ->assertOk()
            ->assertJsonPath('call_status', 'called')
            ->assertJsonPath('offer_status', 'pending');

        $this->actingAs($agent, 'sanctum')
            ->patchJson("/api/recruitment-centers/{$center->id}", ['offer_status' => 'negotiating'])
            ->assertOk()
            ->assertJsonPath('call_status', 'called')
            ->assertJsonPath('offer_status', 'negotiating');

        $this->assertSame('negotiating', $center->fresh()->offer_status);
    }

    public function test_the_index_can_be_filtered_by_category_and_status(): void
    {
        $agent = $this->agent();

        $training = RecruitmentCenter::create([
            'name' => 'Centre Sud Formation', 'category' => 'training_center', 'created_by' => $agent->id,
        ]);
        RecruitmentCenter::create([
            'name' => 'Entreprise Berlin Textil', 'category' => 'business_germany',
            'offer_status' => 'accepted', 'created_by' => $agent->id,
        ]);

        $trainingOnly = $this->actingAs($agent, 'sanctum')
            ->getJson('/api/recruitment-centers?category=training_center')->assertOk()->json('data');
        $this->assertCount(1, $trainingOnly);
        $this->assertSame($training->id, $trainingOnly[0]['id']);

        $accepted = $this->actingAs($agent, 'sanctum')
            ->getJson('/api/recruitment-centers?offer_status=accepted')->assertOk()->json('data');
        $this->assertCount(1, $accepted);
        $this->assertSame('Entreprise Berlin Textil', $accepted[0]['name']);
    }

    public function test_a_candidate_cannot_access_the_recruitment_centers_log(): void
    {
        $candidate = User::factory()->create();
        $candidate->assignRole('User');

        $this->actingAs($candidate, 'sanctum')->getJson('/api/recruitment-centers')->assertForbidden();
        $this->actingAs($candidate, 'sanctum')->postJson('/api/recruitment-centers', ['name' => 'X'])->assertForbidden();
    }
}
