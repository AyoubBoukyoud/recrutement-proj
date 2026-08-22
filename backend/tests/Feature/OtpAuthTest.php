<?php

namespace Tests\Feature;

use App\Models\OtpCode;
use App\Models\User;
use App\Services\OtpService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OtpAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        // The rate limiters are exercised in their own test; everywhere else
        // they would just cap how many requests a scenario may make.
        $this->withoutMiddleware(ThrottleRequests::class);

        config()->set('otp.channels', ['log']);
        config()->set('otp.expose_code_in_response', true);
    }

    private function requestCode(string $phone = '+212600000001'): string
    {
        $response = $this->postJson('/api/auth/otp/request', ['phone' => $phone]);
        $response->assertOk();

        return $response->json('debug_otp_code');
    }

    public function test_a_candidate_signs_in_with_a_code(): void
    {
        $code = $this->requestCode();

        $response = $this->postJson('/api/auth/otp/verify', [
            'phone' => '+212600000001',
            'code' => $code,
            'device_name' => 'Ayoub · Pixel 8',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.phone', '+212600000001')
            ->assertJsonPath('session.device_name', 'Ayoub · Pixel 8')
            ->assertJsonStructure(['token', 'session' => ['id', 'device_name']]);

        $this->assertNotNull(User::where('phone', '+212600000001')->first()->phone_verified_at);
    }

    public function test_the_code_is_never_stored_in_the_clear(): void
    {
        $code = $this->requestCode();

        $this->assertNotSame($code, OtpCode::first()->code_hash);
        $this->assertTrue(password_verify($code, OtpCode::first()->code_hash));
    }

    public function test_the_same_number_typed_differently_is_one_account(): void
    {
        $this->requestCode('+212 600-000-001');
        $code = null;

        // Cooldown is what stops a second send; clear it, the account is what
        // is under test here.
        OtpCode::first()->forceFill(['last_sent_at' => null])->save();
        $code = $this->requestCode('00212600000001');

        $this->postJson('/api/auth/otp/verify', ['phone' => '+212600000001', 'code' => $code])
            ->assertOk();

        $this->assertSame(1, User::count());
        $this->assertSame(1, OtpCode::count());
    }

    public function test_a_number_without_a_country_code_is_rejected(): void
    {
        $this->postJson('/api/auth/otp/request', ['phone' => '0600000001'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('phone');

        $this->assertSame(0, User::count());
    }

    public function test_resending_before_the_cooldown_is_refused(): void
    {
        $this->requestCode();

        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000001'])
            ->assertStatus(429)
            ->assertJsonPath('reason', 'cooldown')
            ->assertHeader('Retry-After');

        // One send only — the refusal must not have cost a message.
        $this->assertSame(1, OtpCode::first()->sends);
    }

    public function test_resending_is_allowed_once_the_cooldown_has_passed(): void
    {
        $this->requestCode();

        $this->travel(61)->seconds();

        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000001'])->assertOk();
        $this->assertSame(2, OtpCode::first()->sends);
    }

    public function test_a_number_cannot_be_sent_more_codes_than_the_window_allows(): void
    {
        config()->set('otp.throttle.max_sends_per_window', 3);

        for ($i = 0; $i < 3; $i++) {
            $this->requestCode();
            $this->travel(61)->seconds();
        }

        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000001'])
            ->assertStatus(429)
            ->assertJsonPath('reason', 'send_limit');

        // …and the ceiling lifts once the window rolls over.
        $this->travel(61)->minutes();
        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000001'])->assertOk();
    }

    public function test_guessing_is_capped_and_the_code_dies_with_the_last_attempt(): void
    {
        config()->set('otp.throttle.max_verify_attempts', 3);

        $code = $this->requestCode();
        $wrong = $code === '000000' ? '111111' : '000000';

        $this->postJson('/api/auth/otp/verify', ['phone' => '+212600000001', 'code' => $wrong])
            ->assertStatus(422)
            ->assertJsonPath('attempts_remaining', 2);

        $this->postJson('/api/auth/otp/verify', ['phone' => '+212600000001', 'code' => $wrong])
            ->assertStatus(422)
            ->assertJsonPath('attempts_remaining', 1);

        $this->postJson('/api/auth/otp/verify', ['phone' => '+212600000001', 'code' => $wrong])
            ->assertStatus(429)
            ->assertJsonPath('reason', 'too_many_attempts');

        // The real code is now worthless — this is the whole point of the cap.
        $this->postJson('/api/auth/otp/verify', ['phone' => '+212600000001', 'code' => $code])
            ->assertStatus(429)
            ->assertJsonPath('reason', 'too_many_attempts');
    }

    public function test_an_expired_code_is_refused(): void
    {
        $code = $this->requestCode();

        $this->travel(11)->minutes();

        $this->postJson('/api/auth/otp/verify', ['phone' => '+212600000001', 'code' => $code])
            ->assertStatus(422)
            ->assertJsonPath('reason', 'expired');
    }

    public function test_a_code_cannot_be_used_twice(): void
    {
        $code = $this->requestCode();

        $this->postJson('/api/auth/otp/verify', ['phone' => '+212600000001', 'code' => $code])->assertOk();

        $this->postJson('/api/auth/otp/verify', ['phone' => '+212600000001', 'code' => $code])
            ->assertStatus(422)
            ->assertJsonPath('reason', 'not_requested');
    }

    public function test_the_code_is_not_echoed_back_when_a_real_channel_delivered_it(): void
    {
        Http::fake(['*' => Http::response(['messages' => [['id' => 'wamid.x']]])]);

        config()->set('otp.channels', ['whatsapp']);
        config()->set('otp.connections.whatsapp.token', 'test-token');
        config()->set('otp.connections.whatsapp.phone_number_id', '123456');

        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000001'])
            ->assertOk()
            ->assertJsonPath('channel', 'whatsapp')
            ->assertJsonPath('debug_otp_code', null);
    }

    public function test_the_code_is_never_exposed_outside_local_or_testing(): void
    {
        // Simulates a stray OTP_EXPOSE_CODE=true surviving into a production
        // .env (e.g. copy-pasted from staging) — exposedCode() must refuse
        // regardless of that config value once the app isn't local/testing.
        $this->app->instance('env', 'production');

        try {
            $this->postJson('/api/auth/otp/request', ['phone' => '+212600000001'])
                ->assertOk()
                ->assertJsonPath('debug_otp_code', null);
        } finally {
            $this->app->instance('env', 'testing');
        }
    }

    public function test_the_otp_request_endpoint_is_rate_limited(): void
    {
        // Undo the setUp() bypass: this test is about the limiter itself.
        $this->app->forgetInstance(ThrottleRequests::class);
        $this->withMiddleware();

        // Requests 2 and 3 are refused by the per-number cooldown but still
        // count against the limiter, so the 4th never reaches the controller.
        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000002'])->assertOk();
        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000002'])
            ->assertStatus(429)
            ->assertJsonPath('reason', 'cooldown');
        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000002'])->assertStatus(429);

        // No `reason` in the body: this refusal came from the middleware, not
        // from OtpService.
        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000002'])
            ->assertStatus(429)
            ->assertJsonMissingPath('reason');
    }
}
