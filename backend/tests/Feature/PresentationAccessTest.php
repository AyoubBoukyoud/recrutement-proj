<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Tests\TestCase;

class PresentationAccessTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-presentation-secret-0123456789abcdef';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->withoutMiddleware(ThrottleRequests::class);
        config()->set('presentation.secret', self::SECRET);
        config()->set('presentation.ttl_minutes', 240);
    }

    public function test_administrators_receive_a_signed_expiring_grant(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');
        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/presentation-access')->assertOk();
        [$payload, $signature] = explode('.', $response->json('grant'));
        $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, self::SECRET, true)), '+/', '-_'), '=');
        $this->assertTrue(hash_equals($expected, $signature));
        $data = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
        $this->assertSame(['v' => 1, 'uid' => $admin->id], ['v' => $data['v'], 'uid' => $data['uid']]);
        $this->assertEqualsWithDelta(now()->addMinutes(240)->getTimestamp(), $data['exp'], 5);
        $this->assertDatabaseHas('admin_activity_logs', ['actor_id' => $admin->id, 'action' => 'presentation_access_granted']);
    }

    public function test_other_accounts_and_anonymous_users_are_refused(): void
    {
        $this->postJson('/api/presentation-access')->assertUnauthorized();
        foreach (['Training Center', 'User', 'Company', 'Commercial Agent'] as $role) {
            $user = User::factory()->create();
            $user->assignRole($role);
            $this->actingAs($user, 'sanctum')->postJson('/api/presentation-access')->assertForbidden();
        }
    }

    public function test_missing_or_weak_secret_fails_closed(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');
        foreach ([null, '', 'too-short'] as $secret) {
            config()->set('presentation.secret', $secret);
            $this->actingAs($admin, 'sanctum')->postJson('/api/presentation-access')->assertStatus(503);
        }
    }
}
