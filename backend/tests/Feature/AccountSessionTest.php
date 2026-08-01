<?php

namespace Tests\Feature;

use App\Models\OtpCode;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Tests\TestCase;

/**
 * Multi-device session management and the two account-recovery paths.
 */
class AccountSessionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->withoutMiddleware(ThrottleRequests::class);

        config()->set('otp.channels', ['log']);
        config()->set('otp.expose_code_in_response', true);
    }

    /**
     * Act as the device holding this token.
     *
     * The auth guard caches the user it resolved, and a test reuses one
     * application instance across requests — without forgetting the guards, a
     * token revoked mid-test would still appear to authenticate.
     */
    private function asDevice(string $token): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token);
    }

    /** Signs in over the real endpoints so the token is created the way it is in production. */
    private function signIn(string $phone, string $device): string
    {
        $code = $this->postJson('/api/auth/otp/request', ['phone' => $phone])->json('debug_otp_code');

        OtpCode::where('phone', $phone)->update(['last_sent_at' => null]);

        return $this->postJson('/api/auth/otp/verify', [
            'phone' => $phone, 'code' => $code, 'device_name' => $device,
        ])->json('token');
    }

    public function test_a_candidate_sees_every_device_they_are_signed_in_on(): void
    {
        $phone = '+212600000001';
        $this->signIn($phone, 'Pixel 8');
        $second = $this->signIn($phone, 'Cybercafé PC');

        $response = $this->asDevice($second)->getJson('/api/auth/sessions')->assertOk();

        $this->assertCount(2, $response->json('sessions'));
        $this->assertSame(
            ['Cybercafé PC' => true, 'Pixel 8' => false],
            collect($response->json('sessions'))->pluck('current', 'device_name')->all(),
        );
    }

    public function test_a_candidate_can_cut_off_another_device(): void
    {
        $phone = '+212600000001';
        $stolen = $this->signIn($phone, 'Old phone');
        $current = $this->signIn($phone, 'New phone');

        $stolenId = collect($this->asDevice($current)->getJson('/api/auth/sessions')->json('sessions'))
            ->firstWhere('device_name', 'Old phone')['id'];

        $this->asDevice($current)->deleteJson("/api/auth/sessions/{$stolenId}")
            ->assertOk()
            ->assertJsonPath('was_current', false);

        $this->asDevice($stolen)->getJson('/api/auth/me')->assertUnauthorized();
        $this->asDevice($current)->getJson('/api/auth/me')->assertOk();
    }

    public function test_one_device_cannot_revoke_another_candidates_session(): void
    {
        $victim = $this->signIn('+212600000001', 'Victim phone');
        $attacker = $this->signIn('+212600000002', 'Attacker phone');

        $victimId = $this->asDevice($victim)->getJson('/api/auth/sessions')->json('sessions.0.id');

        $this->asDevice($attacker)->deleteJson("/api/auth/sessions/{$victimId}")->assertNotFound();
        $this->asDevice($victim)->getJson('/api/auth/me')->assertOk();
    }

    public function test_revoking_other_sessions_leaves_the_device_in_hand_signed_in(): void
    {
        $phone = '+212600000001';
        $first = $this->signIn($phone, 'Phone A');
        $second = $this->signIn($phone, 'Phone B');
        $third = $this->signIn($phone, 'Phone C');

        $this->asDevice($third)->deleteJson('/api/auth/sessions/others')
            ->assertOk()
            ->assertJsonPath('revoked', 2);

        $this->asDevice($first)->getJson('/api/auth/me')->assertUnauthorized();
        $this->asDevice($second)->getJson('/api/auth/me')->assertUnauthorized();
        $this->asDevice($third)->getJson('/api/auth/me')->assertOk();
    }

    public function test_a_candidate_moves_their_account_to_a_new_number(): void
    {
        $token = $this->signIn('+212600000001', 'Phone A');
        $other = $this->signIn('+212600000001', 'Phone B');

        $code = $this->asDevice($token)
            ->postJson('/api/auth/phone/change', ['phone' => '+212611111111'])
            ->assertOk()
            ->json('debug_otp_code');

        $this->asDevice($token)
            ->postJson('/api/auth/phone/change/confirm', ['phone' => '+212611111111', 'code' => $code])
            ->assertOk()
            ->assertJsonPath('user.phone', '+212611111111')
            ->assertJsonPath('sessions_revoked', 1);

        $this->assertSame(0, User::where('phone', '+212600000001')->count());

        // The device that drove the change keeps working; the other one, which
        // may be the phone that was lost with the number, does not.
        $this->asDevice($token)->getJson('/api/auth/me')->assertOk();
        $this->asDevice($other)->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_a_login_code_cannot_be_replayed_as_a_phone_change(): void
    {
        $token = $this->signIn('+212600000001', 'Phone A');

        // A code issued for signing in on a fresh number…
        $loginCode = $this->postJson('/api/auth/otp/request', ['phone' => '+212611111111'])
            ->json('debug_otp_code');

        // …must not be accepted as proof for moving an account onto it. It is
        // rejected as a number that already belongs to an account, because the
        // login request created the shell — either way the takeover fails.
        $this->asDevice($token)
            ->postJson('/api/auth/phone/change/confirm', ['phone' => '+212611111111', 'code' => $loginCode])
            ->assertStatus(422);

        $this->assertSame('+212600000001', $token ? User::first()->phone : null);
    }

    public function test_a_number_in_use_cannot_be_claimed(): void
    {
        $this->signIn('+212611111111', 'Someone else');
        $token = $this->signIn('+212600000001', 'Phone A');

        $this->asDevice($token)
            ->postJson('/api/auth/phone/change', ['phone' => '+212611111111'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('phone');
    }

    public function test_the_phone_change_endpoints_require_a_session(): void
    {
        $this->postJson('/api/auth/phone/change', ['phone' => '+212611111111'])->assertUnauthorized();
        $this->getJson('/api/auth/sessions')->assertUnauthorized();
    }

    public function test_an_administrator_recovers_an_account_whose_owner_lost_everything(): void
    {
        $lockedOut = User::factory()->create(['phone' => '+212600000001']);
        $lockedOut->assignRole('User');
        $strandedToken = $lockedOut->createToken('Lost phone')->plainTextToken;

        $admin = User::factory()->create();
        $admin->assignRole('Administrator');

        $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$lockedOut->id}/phone", [
                'phone' => '+212611111111',
                'reason' => 'Identity confirmed against the CNIE on file, ticket #482.',
            ])
            ->assertOk()
            ->assertJsonPath('user.phone', '+212611111111');

        $lockedOut->refresh();
        $this->assertSame('+212611111111', $lockedOut->phone);
        // Unverified until the candidate signs in with an OTP on the new number.
        $this->assertNull($lockedOut->phone_verified_at);
        $this->asDevice($strandedToken)->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_reassignment_demands_a_reason_and_refuses_a_taken_number(): void
    {
        $candidate = User::factory()->create(['phone' => '+212600000001']);
        User::factory()->create(['phone' => '+212611111111']);

        $admin = User::factory()->create();
        $admin->assignRole('Administrator');

        $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$candidate->id}/phone", ['phone' => '+212622222222'])
            ->assertJsonValidationErrors('reason');

        $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$candidate->id}/phone", [
                'phone' => '+212611111111',
                'reason' => 'Candidate called the support line about a lost SIM.',
            ])
            ->assertJsonValidationErrors('phone');
    }

    public function test_a_candidate_cannot_reassign_a_phone_number(): void
    {
        $candidate = User::factory()->create(['phone' => '+212600000001']);
        $candidate->assignRole('User');

        $this->actingAs($candidate)
            ->patchJson("/api/admin/users/{$candidate->id}/phone", [
                'phone' => '+212611111111',
                'reason' => 'Trying to walk in through the admin door.',
            ])
            ->assertForbidden();
    }
}
