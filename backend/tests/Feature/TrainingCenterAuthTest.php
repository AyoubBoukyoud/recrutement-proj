<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Tests\TestCase;

class TrainingCenterAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->withoutMiddleware(ThrottleRequests::class);
        config()->set('otp.channels', ['log']);
        config()->set('otp.expose_code_in_response', true);
        config()->set('admin.phones', []);
    }

    public function test_a_provisioned_center_can_sign_in_without_becoming_a_candidate(): void
    {
        $center = User::factory()->create(['phone' => '+212611223344']);
        $center->assignRole('Training Center');

        $code = $this->postJson('/api/auth/otp/request', ['phone' => $center->phone])
            ->assertOk()->json('debug_otp_code');

        $this->postJson('/api/auth/otp/verify', ['phone' => $center->phone, 'code' => $code])
            ->assertOk()->assertJsonPath('user.roles.0', 'Training Center');

        $this->assertFalse($center->fresh()->hasRole('User'));
        $this->assertNull($center->fresh()->candidateProfile);
    }

    public function test_selecting_center_intent_does_not_grant_the_role(): void
    {
        $phone = '+212611223345';
        $this->postJson('/api/auth/otp/request', ['phone' => $phone, 'intent' => 'training_center'])
            ->assertOk();

        $user = User::where('phone', $phone)->firstOrFail();
        $this->assertTrue($user->hasRole('User'));
        $this->assertFalse($user->hasRole('Training Center'));
    }

    public function test_center_role_does_not_grant_recruiter_or_admin_access(): void
    {
        $center = User::factory()->create();
        $center->assignRole('Training Center');
        $this->actingAs($center, 'sanctum');

        $this->getJson('/api/admin/users')->assertForbidden();
        $this->getJson('/api/recruiter/candidates')->assertForbidden();
    }
}
