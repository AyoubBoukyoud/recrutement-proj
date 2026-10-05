<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The quote form on the public company page and the administrator's
 * follow-up queue for what it collects.
 */
class QuoteRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('Administrator');

        return $user;
    }

    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Salma',
            'email' => 'salma@entreprise.com',
            'service' => 'mobile-apps',
            'message' => 'Nous voulons une application de suivi de livraison.',
            ...$overrides,
        ];
    }

    public function test_a_visitor_with_no_account_can_request_a_quote(): void
    {
        $response = $this->postJson('/api/quote-requests', $this->payload())->assertCreated();

        $this->assertDatabaseHas('quote_requests', [
            'id' => $response->json('id'),
            'name' => 'Salma',
            'email' => 'salma@entreprise.com',
            'service' => 'mobile-apps',
            'status' => 'new',
        ]);
        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_the_form_rejects_an_unknown_service(): void
    {
        $this->postJson('/api/quote-requests', $this->payload(['service' => 'plumbing']))
            ->assertStatus(422)->assertJsonValidationErrors('service');
    }

    public function test_the_form_rejects_a_missing_email(): void
    {
        $this->postJson('/api/quote-requests', $this->payload(['email' => null]))
            ->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_a_non_administrator_cannot_read_quote_requests(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/quote-requests')
            ->assertForbidden();
    }

    public function test_an_administrator_sees_requests_and_moves_one_along(): void
    {
        $admin = $this->admin();

        $submitted = $this->postJson('/api/quote-requests', $this->payload())->assertCreated()->json();

        $list = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/quote-requests')
            ->assertOk()->json();

        $this->assertSame('Salma', $list['data'][0]['name']);
        $this->assertSame('mobile-apps', $list['data'][0]['service']);
        $this->assertSame('new', $list['data'][0]['status']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/quote-requests/{$submitted['id']}", ['status' => 'contacted'])
            ->assertOk()
            ->assertJsonPath('status', 'contacted');
    }

    public function test_the_queue_can_be_filtered_by_status_and_service(): void
    {
        $admin = $this->admin();

        $this->postJson('/api/quote-requests', $this->payload(['name' => 'Apps', 'service' => 'mobile-apps']))->assertCreated();
        $games = $this->postJson('/api/quote-requests', $this->payload(['name' => 'Jeux', 'service' => 'games']))->assertCreated()->json();
        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/quote-requests/{$games['id']}", ['status' => 'closed'])->assertOk();

        $byService = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/quote-requests?service=games')->assertOk()->json('data');
        $this->assertCount(1, $byService);
        $this->assertSame('Jeux', $byService[0]['name']);

        $byStatus = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/quote-requests?status=new')->assertOk()->json('data');
        $this->assertCount(1, $byStatus);
        $this->assertSame('Apps', $byStatus[0]['name']);
    }

    public function test_the_quote_form_is_rate_limited_per_ip(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/quote-requests', $this->payload())->assertCreated();
        }

        $this->postJson('/api/quote-requests', $this->payload())->assertStatus(429);
    }
}
