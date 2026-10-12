<?php

namespace Tests\Feature;

use App\Models\AdminActivityLog;
use App\Models\CandidateProfile;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Models\OtpCode;
use App\Models\RecruiterShortlist;
use App\Models\User;
use App\Services\OtpService;
use App\Support\Csv;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Tests\TestCase;

/**
 * One regression test per finding of the security audit — each of these was a
 * reproducible hole before it was closed. The assertions are about what a
 * request must NOT get back, so they live together rather than being spread
 * across the feature tests that exercise the happy paths.
 */
class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    private const CANDIDATE_PHONE = '+212622222222';

    private const CANDIDATE_EMAIL = 'candidate@example.test';

    private const RECRUITER_PHONE = '+212611111111';

    private const RECRUITER_EMAIL = 'boss@corp.example.test';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function user(string $role, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $user->assignRole($role);

        return $user;
    }

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'sanctum');
    }

    private function recruiter(): User
    {
        return $this->user('Company', ['phone' => self::RECRUITER_PHONE, 'email' => self::RECRUITER_EMAIL]);
    }

    private function candidate(array $profile = [], array $account = []): CandidateProfile
    {
        $user = $this->user('User', ['phone' => self::CANDIDATE_PHONE, 'email' => self::CANDIDATE_EMAIL, ...$account]);

        return $user->candidateProfile()->create([
            'first_name' => 'Yassin',
            'last_name' => 'Benali',
            'profession' => 'Nurse',
            'submitted_at' => now(),
            'terms_consent_at' => now(),
            'cndp_consent_at' => now(),
            ...$profile,
        ]);
    }

    private function offerBy(User $recruiter): JobOffer
    {
        return JobOffer::create([
            'user_id' => $recruiter->id,
            'title' => 'Registered nurse',
            'description' => 'Hospital role',
            'sector' => 'Health',
            'city' => 'Berlin',
            'contract_type' => 'permanent',
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    private function applicationTo(JobOffer $offer, CandidateProfile $profile): JobApplication
    {
        return JobApplication::create([
            'job_offer_id' => $offer->id,
            'candidate_profile_id' => $profile->id,
            'status' => 'submitted',
            'applied_at' => now(),
            'status_changed_at' => now(),
        ]);
    }

    /** The raw body, so a leak cannot hide under a key the assertions did not think of. */
    private function assertNoContactDetailsIn(TestResponse $response, string ...$secrets): void
    {
        $body = $response->baseResponse instanceof StreamedResponse
            ? $response->streamedContent()
            : $response->getContent();

        foreach ($secrets as $secret) {
            $this->assertStringNotContainsString($secret, $body, "The response leaked {$secret}.");
        }
    }

    // --- Recruiters' sign-in numbers were readable by every candidate -------

    public function test_candidates_never_see_a_recruiters_phone_or_email_on_offers(): void
    {
        $recruiter = $this->recruiter();
        $profile = $this->candidate();
        $offer = $this->offerBy($recruiter);
        $this->applicationTo($offer, $profile);

        $list = $this->as($profile->user)->getJson('/api/offers')->assertOk();
        $this->assertNoContactDetailsIn($list, self::RECRUITER_PHONE, self::RECRUITER_EMAIL);

        $show = $this->as($profile->user)->getJson("/api/offers/{$offer->id}")->assertOk();
        $this->assertNoContactDetailsIn($show, self::RECRUITER_PHONE, self::RECRUITER_EMAIL);

        $applications = $this->as($profile->user)->getJson('/api/candidate/applications')->assertOk();
        $this->assertNoContactDetailsIn($applications, self::RECRUITER_PHONE, self::RECRUITER_EMAIL);
    }

    public function test_the_offer_still_names_its_employer(): void
    {
        $recruiter = $this->recruiter();
        $recruiter->forceFill(['name' => 'Charité HR'])->save();
        $profile = $this->candidate();
        $this->offerBy($recruiter);

        $this->as($profile->user)->getJson('/api/offers')
            ->assertOk()
            ->assertJsonPath('data.0.employer.name', 'Charité HR');
    }

    // --- Candidates' contact details bypassed the attributable reveal -------

    public function test_a_recruiters_application_list_does_not_carry_candidate_contact_details(): void
    {
        $recruiter = $this->recruiter();
        $this->applicationTo($this->offerBy($recruiter), $this->candidate());

        $response = $this->as($recruiter)->getJson('/api/recruiter/applications')->assertOk();

        $this->assertNoContactDetailsIn($response, self::CANDIDATE_PHONE, self::CANDIDATE_EMAIL);
        $response->assertJsonPath('data.0.candidate_profile.first_name', 'Yassin');
    }

    public function test_changing_an_application_status_does_not_echo_candidate_contact_details(): void
    {
        $recruiter = $this->recruiter();
        $application = $this->applicationTo($this->offerBy($recruiter), $this->candidate());

        $response = $this->as($recruiter)
            ->patchJson("/api/recruiter/applications/{$application->id}", ['status' => 'interview'])
            ->assertOk();

        $this->assertNoContactDetailsIn($response, self::CANDIDATE_PHONE, self::CANDIDATE_EMAIL);
    }

    public function test_interviews_do_not_carry_candidate_contact_details(): void
    {
        $recruiter = $this->recruiter();
        $application = $this->applicationTo($this->offerBy($recruiter), $this->candidate());

        $created = $this->as($recruiter)->postJson('/api/recruiter/interviews', [
            'job_application_id' => $application->id,
            'date' => now()->addDays(3)->toDateString(),
            'start_time' => '10:00',
            'end_time' => '10:30',
            'type' => 'video',
        ])->assertCreated();
        $this->assertNoContactDetailsIn($created, self::CANDIDATE_PHONE, self::CANDIDATE_EMAIL);

        $interview = Interview::firstOrFail();

        $this->assertNoContactDetailsIn(
            $this->as($recruiter)->getJson('/api/recruiter/interviews')->assertOk(),
            self::CANDIDATE_PHONE, self::CANDIDATE_EMAIL,
        );
        $this->assertNoContactDetailsIn(
            $this->as($recruiter)->getJson("/api/recruiter/interviews/{$interview->id}")->assertOk(),
            self::CANDIDATE_PHONE, self::CANDIDATE_EMAIL,
        );
        $this->assertNoContactDetailsIn(
            $this->as($recruiter)->patchJson("/api/recruiter/interviews/{$interview->id}", ['status' => 'confirmed'])->assertOk(),
            self::CANDIDATE_PHONE, self::CANDIDATE_EMAIL,
        );
    }

    // --- Administrators' private notes reached candidates and recruiters ----

    public function test_admin_notes_are_visible_to_administrators_only(): void
    {
        $profile = $this->candidate(['admin_notes' => 'Diploma looks doctored — do not forward.']);
        $recruiter = $this->recruiter();
        $admin = $this->user('Administrator');

        $this->assertNoContactDetailsIn(
            $this->as($profile->user)->getJson('/api/candidate/profile')->assertOk(),
            'doctored',
        );
        $this->assertNoContactDetailsIn(
            $this->as($recruiter)->getJson("/api/recruiter/candidates/{$profile->id}")->assertOk(),
            'doctored',
        );
        $this->assertNoContactDetailsIn(
            $this->as($profile->user)->getJson('/api/candidate/profile/preview')->assertOk(),
            'doctored',
        );

        $this->as($admin)->getJson("/api/admin/candidates/{$profile->id}")
            ->assertOk()
            ->assertJsonPath('admin_notes', 'Diploma looks doctored — do not forward.');
    }

    public function test_a_visible_dossier_never_carries_the_candidates_account(): void
    {
        $recruiter = $this->recruiter();
        $profile = $this->candidate();

        // The visibility check looks at the account behind the dossier; it
        // must not leave that account attached to what the recruiter is sent.
        $dossier = $this->as($recruiter)->getJson("/api/recruiter/candidates/{$profile->id}")->assertOk();
        $this->assertNoContactDetailsIn($dossier, self::CANDIDATE_PHONE, self::CANDIDATE_EMAIL);
        $this->assertArrayNotHasKey('user', $dossier->json());

        $this->assertNoContactDetailsIn(
            $this->as($recruiter)->putJson("/api/recruiter/candidates/{$profile->id}/shortlist", ['stage' => 'saved'])->assertCreated(),
            self::CANDIDATE_PHONE, self::CANDIDATE_EMAIL,
        );
    }

    public function test_internal_user_bookkeeping_is_not_serialised(): void
    {
        $recruiter = $this->recruiter();
        $recruiter->forceFill(['status_changed_by_id' => $this->user('Administrator')->id])->save();
        $profile = $this->candidate();
        $this->offerBy($recruiter);

        $body = $this->as($profile->user)->getJson('/api/offers')->assertOk()->getContent();

        $this->assertStringNotContainsString('status_changed_by_id', $body);
        $this->assertStringNotContainsString('pending_referral_agent_id', $body);
    }

    // --- Leaving or blocked candidates stayed discoverable ------------------

    public function test_a_candidate_who_asked_for_deletion_disappears_from_recruiters_at_once(): void
    {
        $recruiter = $this->recruiter();
        $profile = $this->candidate();

        $this->as($recruiter)->getJson('/api/recruiter/candidates')->assertOk()->assertJsonCount(1, 'data');

        $profile->user->forceFill(['deletion_requested_at' => now()->addDays(30), 'status' => 'blocked'])->save();

        $this->as($recruiter)->getJson('/api/recruiter/candidates')->assertOk()->assertJsonCount(0, 'data');
        $this->as($recruiter)->getJson("/api/recruiter/candidates/{$profile->id}")->assertNotFound();
        $this->as($recruiter)->putJson("/api/recruiter/candidates/{$profile->id}/shortlist")->assertNotFound();
        $this->as($recruiter)->postJson("/api/recruiter/candidates/{$profile->id}/contact")->assertNotFound();
    }

    public function test_a_blocked_candidate_is_not_discoverable(): void
    {
        $recruiter = $this->recruiter();
        $profile = $this->candidate(account: ['status' => 'blocked']);

        $this->as($recruiter)->getJson('/api/recruiter/candidates')->assertOk()->assertJsonCount(0, 'data');
        $this->as($recruiter)->getJson("/api/recruiter/candidates/{$profile->id}")->assertNotFound();
    }

    public function test_contact_details_a_recruiter_took_vanish_when_the_candidate_withdraws(): void
    {
        $recruiter = $this->recruiter();
        $profile = $this->candidate();

        $this->as($recruiter)->postJson("/api/recruiter/candidates/{$profile->id}/contact")
            ->assertOk()
            ->assertJsonPath('contact.phone', self::CANDIDATE_PHONE);
        $this->as($recruiter)->getJson('/api/recruiter/shortlist')
            ->assertOk()
            ->assertJsonPath('data.0.contact.phone', self::CANDIDATE_PHONE);

        $profile->update(['cndp_withdrawn_at' => now()]);

        $list = $this->as($recruiter)->getJson('/api/recruiter/shortlist')->assertOk();
        $this->assertNoContactDetailsIn($list, self::CANDIDATE_PHONE, self::CANDIDATE_EMAIL);

        $export = $this->as($recruiter)->get('/api/recruiter/shortlist/export')->assertOk();
        $this->assertNoContactDetailsIn($export, self::CANDIDATE_PHONE, self::CANDIDATE_EMAIL);
    }

    // --- CSV injection ------------------------------------------------------

    public function test_exports_neutralise_spreadsheet_formulas_typed_by_candidates(): void
    {
        $recruiter = $this->recruiter();
        $profile = $this->candidate([
            'profession' => '=HYPERLINK("http://evil.example","open")',
            'specialization' => '@SUM(1+1)*cmd|\' /C calc\'!A0',
        ]);
        RecruiterShortlist::create(['user_id' => $recruiter->id, 'candidate_profile_id' => $profile->id, 'stage' => 'saved', 'contact_revealed_at' => now(), 'notes' => '+1 call back']);

        $csv = $this->as($recruiter)->get('/api/recruiter/shortlist/export')->assertOk()->streamedContent();

        $this->assertStringContainsString("\"'=HYPERLINK(", $csv);
        $this->assertStringContainsString("\"'@SUM(", $csv);
        $this->assertStringContainsString("'+1 call back", $csv);
        $this->assertStringNotContainsString(',=HYPERLINK', $csv);
        // The phone is data, not a formula: its `+` must survive.
        $this->assertStringContainsString(self::CANDIDATE_PHONE, $csv);
        $this->assertStringNotContainsString("'".self::CANDIDATE_PHONE, $csv);
    }

    public function test_the_admin_exports_neutralise_formulas_too(): void
    {
        $admin = $this->user('Administrator');
        $profile = $this->candidate(['first_name' => '=2+5', 'last_name' => 'Doe', 'city' => '-1+1']);

        $csv = $this->as($admin)->postJson('/api/admin/candidates/bulk', [
            'ids' => [$profile->id],
            'action' => 'export',
        ])->assertOk()->streamedContent();

        $this->assertStringContainsString("'=2+5 Doe", $csv);
        $this->assertStringContainsString("'-1+1", $csv);
    }

    public function test_the_csv_helper_only_touches_text_that_would_run_as_a_formula(): void
    {
        foreach (['=1+1', '+1', '-1', '@a', "\tx", "\rx"] as $dangerous) {
            $this->assertSame("'".$dangerous, Csv::cell($dangerous));
        }

        foreach (['Yassin', '', null, 12, 3.5, 'a=b', 'email@x.test'] as $safe) {
            $this->assertSame($safe, Csv::cell($safe));
        }
    }

    // --- Server-side request forgery through push subscriptions -------------

    public function test_push_endpoints_must_be_a_known_push_service(): void
    {
        $user = $this->user('User');
        $keys = ['p256dh' => 'BKey', 'auth' => 'secret'];

        foreach ([
            'http://169.254.169.254/latest/meta-data/',
            'https://169.254.169.254/latest/meta-data/',
            'http://fcm.googleapis.com/fcm/send/abc',
            'https://localhost/anything',
            'https://backend-web:8080/api/admin/users',
            'https://evolution-go:4000/send/text',
            'https://evil.example/fcm.googleapis.com',
            'https://fcm.googleapis.com.evil.example/fcm/send/abc',
            'https://user:pw@fcm.googleapis.com/fcm/send/abc',
            'https://fcm.googleapis.com:8443/fcm/send/abc',
            'gopher://fcm.googleapis.com/x',
            'not a url',
        ] as $endpoint) {
            $this->as($user)->postJson('/api/push/subscriptions', ['endpoint' => $endpoint, 'keys' => $keys])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('endpoint');
        }

        $this->assertDatabaseCount('push_subscriptions', 0);
    }

    public function test_real_push_services_are_accepted(): void
    {
        $user = $this->user('User');
        $keys = ['p256dh' => 'BKey', 'auth' => 'secret'];

        foreach ([
            'https://fcm.googleapis.com/fcm/send/abc123',
            'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
            'https://web.push.apple.com/QGxyz',
            'https://db5p.notify.windows.com/w/?token=abc',
        ] as $endpoint) {
            $this->as($user)->postJson('/api/push/subscriptions', ['endpoint' => $endpoint, 'keys' => $keys])->assertCreated();
        }
    }

    // --- Rate limits keyed on the proxy instead of the visitor --------------

    public function test_per_ip_limits_follow_the_visitor_behind_the_proxy_not_the_proxy(): void
    {
        $post = fn (string $forwardedFor, string $remote = '172.18.0.5') => $this
            ->withServerVariables(['REMOTE_ADDR' => $remote])
            ->withHeader('X-Forwarded-For', $forwardedFor)
            ->postJson('/api/contact', []);

        // The contact form allows three a minute per visitor. Three from one
        // visitor are answered (422, nothing to store) and the fourth is not…
        foreach (range(1, 3) as $_) {
            $post('203.0.113.9')->assertUnprocessable();
        }
        $post('203.0.113.9')->assertStatus(429);

        // …but a different visitor behind the same proxy is unaffected.
        $post('203.0.113.77')->assertUnprocessable();
    }

    public function test_a_forged_forwarded_for_header_from_the_open_internet_is_ignored(): void
    {
        $post = fn (string $forwardedFor) => $this
            ->withServerVariables(['REMOTE_ADDR' => '198.51.100.20'])
            ->withHeader('X-Forwarded-For', $forwardedFor)
            ->postJson('/api/contact', []);

        // Rotating the header does not buy a fresh bucket: the connection
        // itself is not a trusted proxy, so the header is not believed.
        $post('203.0.113.1')->assertUnprocessable();
        $post('203.0.113.2')->assertUnprocessable();
        $post('203.0.113.3')->assertUnprocessable();
        $post('203.0.113.4')->assertStatus(429);
    }

    // --- CORS ---------------------------------------------------------------

    public function test_other_websites_are_not_granted_cross_origin_access_to_the_api(): void
    {
        $preflight = fn (string $origin) => $this->call('OPTIONS', '/api/auth/otp/request', [], [], [], [
            'HTTP_ORIGIN' => $origin,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type',
        ])->headers->get('Access-Control-Allow-Origin');

        // The framework default was `*`, which let any site call the API.
        config()->set('cors.allowed_origins', ['https://amudskills.com']);
        $this->assertSame('https://amudskills.com', $preflight('https://amudskills.com'));
        // With a single allowed origin the header names that origin; a
        // browser on any other site sees a mismatch and refuses the response.
        $this->assertNotContains($preflight('https://evil.example'), ['*', 'https://evil.example']);

        config()->set('cors.allowed_origins', ['https://amudskills.com', 'https://staging.amudskills.com']);
        $this->assertSame('https://staging.amudskills.com', $preflight('https://staging.amudskills.com'));
        $this->assertNull($preflight('https://evil.example'));
    }

    // --- Sessions that never expired ----------------------------------------

    public function test_sign_in_sessions_carry_an_expiry_and_administrators_get_a_shorter_one(): void
    {
        config()->set('otp.channels', ['log']);
        config()->set('otp.expose_code_in_response', true);

        $signIn = function (string $phone): array {
            $code = $this->postJson('/api/auth/otp/request', ['phone' => $phone])->assertOk()->json('debug_otp_code');

            return $this->postJson('/api/auth/otp/verify', ['phone' => $phone, 'code' => $code])->assertOk()->json();
        };

        $candidate = $signIn('+212600000101');
        $this->assertEqualsWithDelta(
            now()->addMinutes(config('sanctum.session_ttl_minutes'))->timestamp,
            Carbon::parse($candidate['session']['expires_at'])->timestamp,
            60,
        );

        $this->user('Administrator', ['phone' => '+212600000102']);
        $admin = $signIn('+212600000102');
        $this->assertEqualsWithDelta(
            now()->addMinutes(config('sanctum.admin_session_ttl_minutes'))->timestamp,
            Carbon::parse($admin['session']['expires_at'])->timestamp,
            60,
        );
        $this->assertLessThan(
            Carbon::parse($candidate['session']['expires_at'])->timestamp,
            Carbon::parse($admin['session']['expires_at'])->timestamp,
        );
    }

    public function test_an_expired_session_is_refused(): void
    {
        $user = $this->user('User');
        $token = $user->createToken('old phone', ['*'], now()->subMinute())->plainTextToken;
        $fresh = $user->createToken('this phone', ['*'], now()->addDay())->plainTextToken;

        $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();

        $this->app['auth']->forgetGuards();
        $this->withToken($fresh)->getJson('/api/auth/me')->assertOk();
    }

    // --- OTP guessing -------------------------------------------------------

    public function test_a_code_locks_after_its_attempts_and_the_counter_never_overshoots(): void
    {
        config()->set('otp.channels', ['log']);
        $service = app(OtpService::class);
        $service->send('+212600000201');

        for ($i = 0; $i < 12; $i++) {
            try {
                $service->verify('+212600000201', '000000');
            } catch (\Throwable) {
                // Wrong code or locked — both expected here.
            }
        }

        $this->assertSame(
            (int) config('otp.throttle.max_verify_attempts'),
            OtpCode::where('phone', '+212600000201')->value('attempts'),
        );
    }

    // --- Privileged changes leave a trace -----------------------------------

    public function test_role_changes_and_account_creation_are_audit_logged(): void
    {
        $admin = $this->user('Administrator');
        $target = $this->user('User');

        $this->as($admin)->patchJson("/api/admin/users/{$target->id}/roles", ['roles' => ['Company']])->assertOk();

        $log = AdminActivityLog::where('action', 'roles_changed')->firstOrFail();
        $this->assertSame($admin->id, $log->actor_id);
        $this->assertSame($target->id, $log->subject_id);
        $this->assertSame(['User'], $log->meta['from']);
        $this->assertSame(['Company'], $log->meta['to']);

        $this->as($admin)->postJson('/api/admin/users', [
            'name' => 'New Agent',
            'phone' => '+212600000301',
            'roles' => ['Commercial Agent'],
        ])->assertCreated();

        $created = AdminActivityLog::where('action', 'user_created')->firstOrFail();
        $this->assertSame(['Commercial Agent'], $created->meta['roles']);
    }
}
