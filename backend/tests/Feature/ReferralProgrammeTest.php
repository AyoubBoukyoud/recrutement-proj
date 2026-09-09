<?php

namespace Tests\Feature;

use App\Models\CandidateProfile;
use App\Models\ReferralAgent;
use App\Models\ReferralRegistration;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Tests\TestCase;

/**
 * Attribution was already built; this covers what happens to a referral after
 * it is attributed — and what happens to the QR codes an agent has printed.
 */
class ReferralProgrammeTest extends TestCase
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

    private function agent(): User
    {
        $user = User::factory()->create();
        $user->assignRole('Commercial Agent');

        return $user;
    }

    /** Signs a new candidate up with a scanned token, the way the app does. */
    private function registerWith(string $token, string $phone): User
    {
        $code = $this->postJson('/api/auth/otp/request', ['phone' => $phone, 'referral_token' => $token])
            ->json('debug_otp_code');

        $this->postJson('/api/auth/otp/verify', ['phone' => $phone, 'code' => $code])->assertOk();

        return User::where('phone', $phone)->firstOrFail();
    }

    /** Fill every section submission requires, then declare it finished. */
    private function submitDossier(User $candidate): CandidateProfile
    {
        $profile = CandidateProfileResolver::resolve($candidate);
        $profile->update([
            'first_name' => 'Yassin',
            'last_name' => 'El Amrani',
            'date_of_birth' => '1996-04-02',
            'availability_status' => 'immediate',
            'terms_consent_at' => now(),
            'cndp_consent_at' => now(),
        ]);
        $profile->educations()->create(['level' => 'bachelor', 'field' => 'Nursing']);
        $profile->languages()->create(['language' => 'de', 'cefr_level' => 'B2']);

        $this->actingAs($candidate, 'sanctum')->postJson('/api/candidate/profile/submit')->assertOk();

        return $profile->fresh();
    }

    // --- Token rotation ---------------------------------------------------

    public function test_a_rotated_token_keeps_attributing_until_the_grace_period_ends(): void
    {
        config()->set('referrals.previous_token_grace_days', 30);

        $agent = $this->agent();
        $printed = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('qr_code_token');

        $response = $this->actingAs($agent, 'sanctum')->postJson('/api/referrals/agent/rotate')->assertOk();
        $this->assertNotSame($printed, $response->json('qr_code_token'));
        $this->assertNotNull($response->json('previous_token_active_until'));

        // A flyer handed out last week still works.
        $candidate = $this->registerWith($printed, '+212600000001');
        CandidateProfileResolver::resolve($candidate);
        $this->assertSame(1, ReferralRegistration::count());

        // …but not forever.
        $this->travel(31)->days();
        $late = $this->registerWith($printed, '+212600000002');
        CandidateProfileResolver::resolve($late);
        $this->assertSame(1, ReferralRegistration::count());
    }

    public function test_a_grace_period_of_zero_invalidates_the_old_token_at_once(): void
    {
        config()->set('referrals.previous_token_grace_days', 0);

        $agent = $this->agent();
        $printed = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('qr_code_token');

        $this->actingAs($agent, 'sanctum')->postJson('/api/referrals/agent/rotate')
            ->assertOk()
            ->assertJsonPath('previous_token_active_until', null);

        $candidate = $this->registerWith($printed, '+212600000001');
        CandidateProfileResolver::resolve($candidate);

        $this->assertSame(0, ReferralRegistration::count());
    }

    // --- Commission lifecycle --------------------------------------------

    public function test_a_referral_earns_nothing_until_the_candidate_submits(): void
    {
        $agent = $this->agent();
        $token = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('qr_code_token');

        $candidate = $this->registerWith($token, '+212600000001');
        CandidateProfileResolver::resolve($candidate);

        $registration = ReferralRegistration::firstOrFail();
        $this->assertSame('pending', $registration->commission_status);
        $this->assertNull($registration->commission_amount);

        $this->submitDossier($candidate);

        $registration->refresh();
        $this->assertSame('qualified', $registration->commission_status);
        $this->assertEqualsWithDelta(150, (float) $registration->commission_amount, 0.001);
        $this->assertSame('MAD', $registration->commission_currency);
        $this->assertNotNull($registration->qualified_at);
    }

    public function test_the_agents_own_rate_wins_over_the_default_and_is_stamped_on(): void
    {
        $agent = $this->agent();
        $token = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('qr_code_token');
        ReferralAgent::where('user_id', $agent->id)->update(['commission_rate' => 400]);

        $candidate = $this->registerWith($token, '+212600000001');
        CandidateProfileResolver::resolve($candidate);
        $this->submitDossier($candidate);

        $registration = ReferralRegistration::firstOrFail();
        $this->assertEqualsWithDelta(400, (float) $registration->commission_amount, 0.001);

        // Changing the rate afterwards must not move a commission already earned.
        ReferralAgent::where('user_id', $agent->id)->update(['commission_rate' => 50]);
        $this->assertEqualsWithDelta(400, (float) $registration->fresh()->commission_amount, 0.001);
    }

    public function test_resubmitting_neither_re_earns_nor_resets_an_approved_commission(): void
    {
        $agent = $this->agent();
        $token = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('qr_code_token');

        $candidate = $this->registerWith($token, '+212600000001');
        CandidateProfileResolver::resolve($candidate);
        $this->submitDossier($candidate);

        ReferralRegistration::firstOrFail()->update(['commission_status' => 'approved']);

        $this->actingAs($candidate, 'sanctum')->postJson('/api/candidate/profile/submit')->assertOk();

        $this->assertSame(1, ReferralRegistration::count());
        $this->assertSame('approved', ReferralRegistration::firstOrFail()->commission_status);
    }

    // --- What the agent sees ---------------------------------------------

    public function test_an_agent_sees_who_they_referred_and_what_they_are_owed(): void
    {
        $agent = $this->agent();
        $token = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('qr_code_token');

        $first = $this->registerWith($token, '+212600000001');
        CandidateProfileResolver::resolve($first);
        $this->submitDossier($first);

        // A second registration that never submitted: attributed, worth nothing yet.
        $second = $this->registerWith($token, '+212600000002');
        CandidateProfileResolver::resolve($second);

        $rows = $this->actingAs($agent, 'sanctum')
            ->getJson('/api/referrals/agent/registrations')->assertOk()->json('data');

        // Both were registered in the same second, so the order between them
        // is not something to assert on — the content is.
        $this->assertCount(2, $rows);
        $qualified = collect($rows)->firstWhere('commission_status', 'qualified');
        $this->assertSame('Yassin El Amrani', $qualified['candidate_name']);
        $this->assertEqualsWithDelta(150, (float) $qualified['commission_amount'], 0.001);

        $earnings = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('earnings');
        $this->assertEqualsWithDelta(150, $earnings['owed'], 0.001);
        $this->assertEqualsWithDelta(0, $earnings['paid'], 0.001);
        $this->assertSame(1, $earnings['counts']['pending']);
        $this->assertSame(1, $earnings['counts']['qualified']);
    }

    public function test_an_agent_cannot_see_another_agents_referrals(): void
    {
        $agent = $this->agent();
        $token = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('qr_code_token');
        $candidate = $this->registerWith($token, '+212600000001');
        CandidateProfileResolver::resolve($candidate);

        $other = $this->agent();
        $rows = $this->actingAs($other, 'sanctum')
            ->getJson('/api/referrals/agent/registrations')->assertOk()->json('data');

        $this->assertSame([], $rows);
    }

    // --- Payout -----------------------------------------------------------

    public function test_an_administrator_approves_and_pays_a_commission(): void
    {
        $agent = $this->agent();
        $token = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('qr_code_token');
        $candidate = $this->registerWith($token, '+212600000001');
        CandidateProfileResolver::resolve($candidate);
        $this->submitDossier($candidate);

        $admin = User::factory()->create();
        $admin->assignRole('Administrator');
        $registration = ReferralRegistration::firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/referrals/{$registration->id}", ['commission_status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('commission_status', 'approved');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/referrals/{$registration->id}", [
                'commission_status' => 'paid',
                'payout_reference' => 'BANK-4471',
            ])
            ->assertOk();

        $registration->refresh();
        $this->assertSame('paid', $registration->commission_status);
        $this->assertSame('BANK-4471', $registration->payout_reference);
        $this->assertNotNull($registration->approved_at);
        $this->assertNotNull($registration->paid_at);

        $earnings = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('earnings');
        $this->assertEqualsWithDelta(0, $earnings['owed'], 0.001);
        $this->assertEqualsWithDelta(150, $earnings['paid'], 0.001);
    }

    public function test_the_payout_queue_lists_what_is_owed_first(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');

        $agent = $this->agent();
        $token = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('qr_code_token');

        $unpaid = $this->registerWith($token, '+212600000001');
        CandidateProfileResolver::resolve($unpaid);
        $this->submitDossier($unpaid);

        $notYet = $this->registerWith($token, '+212600000002');
        CandidateProfileResolver::resolve($notYet);

        $rows = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/referrals')->assertOk()->json('data');

        $this->assertSame('qualified', $rows[0]['commission_status']);
        $this->assertCount(1, $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/referrals?status=pending')->json('data'));
    }

    public function test_an_agent_cannot_approve_their_own_commission(): void
    {
        $agent = $this->agent();
        $token = $this->actingAs($agent, 'sanctum')->getJson('/api/referrals/agent')->json('qr_code_token');
        $candidate = $this->registerWith($token, '+212600000001');
        CandidateProfileResolver::resolve($candidate);
        $this->submitDossier($candidate);

        $registration = ReferralRegistration::firstOrFail();

        $this->actingAs($agent, 'sanctum')
            ->patchJson("/api/admin/referrals/{$registration->id}", ['commission_status' => 'paid'])
            ->assertForbidden();

        $this->assertSame('qualified', $registration->fresh()->commission_status);
    }
}
