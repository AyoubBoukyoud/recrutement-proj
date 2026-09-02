<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\PhoneNumber;
use Database\Seeders\AdminPhoneSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Tests\TestCase;

/**
 * The allowlist is the only route into the admin console on a deployment that
 * has never had an administrator, so the ways it can silently fail all deserve
 * a test: a number written nationally, a number that already has an account,
 * and a number that is not on the list at all.
 */
class AdminPhoneAllowlistTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->withoutMiddleware(ThrottleRequests::class);

        config()->set('otp.channels', ['log']);
        config()->set('otp.expose_code_in_response', true);
        // As written in .env — national form, which is the case that would
        // quietly never match the +212… the users table stores.
        config()->set('admin.phones', [PhoneNumber::toE164('0632594914')]);
    }

    public function test_a_national_number_in_env_is_read_as_e164(): void
    {
        $this->assertSame('+212632594914', PhoneNumber::toE164('0632594914'));
        $this->assertSame('+212632594914', PhoneNumber::toE164('+212632594914'));
        $this->assertSame('+212632594914', PhoneNumber::toE164('06 32 59 49 14'));
        $this->assertSame('+212632594914', PhoneNumber::toE164('00212632594914'));
        $this->assertSame('+212632594914', PhoneNumber::toE164('212632594914'));
    }

    public function test_an_allowlisted_number_becomes_an_administrator_on_first_sign_in(): void
    {
        $this->postJson('/api/auth/otp/request', ['phone' => '+212632594914'])->assertOk();

        $user = User::where('phone', '+212632594914')->firstOrFail();

        $this->assertTrue($user->hasRole('Administrator'));
        // The candidate fallback must not also fire: a role it already holds
        // is what stops it, and "Administrator" plus "User" would route this
        // account to the candidate dashboard on some screens.
        $this->assertFalse($user->hasRole('User'));
    }

    public function test_a_number_added_to_the_allowlist_later_is_promoted_on_its_next_sign_in(): void
    {
        // Signed up as an ordinary candidate before anybody thought to make
        // them an administrator — the create path has already run for them.
        $user = User::factory()->create(['phone' => '+212632594914']);
        $user->assignRole('User');

        $this->postJson('/api/auth/otp/request', ['phone' => '+212632594914'])->assertOk();

        $this->assertTrue($user->fresh()->hasRole('Administrator'));
    }

    public function test_a_number_that_is_not_allowlisted_stays_a_candidate(): void
    {
        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000009'])->assertOk();

        $user = User::where('phone', '+212600000009')->firstOrFail();

        $this->assertFalse($user->hasRole('Administrator'));
        $this->assertTrue($user->hasRole('User'));
    }

    public function test_the_seeder_provisions_the_allowlist_before_anybody_logs_in(): void
    {
        $this->seed(AdminPhoneSeeder::class);

        $user = User::where('phone', '+212632594914')->firstOrFail();

        $this->assertTrue($user->hasRole('Administrator'));
    }

    public function test_the_seeder_is_safe_to_run_twice(): void
    {
        $this->seed(AdminPhoneSeeder::class);
        $this->seed(AdminPhoneSeeder::class);

        $this->assertSame(1, User::where('phone', '+212632594914')->count());
    }
}
