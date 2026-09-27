<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\GoogleAuth\GoogleOidcProvider;
use App\Services\GoogleAuth\InvalidGoogleIdToken;
use Database\Seeders\RoleSeeder;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Illuminate\Testing\TestResponse;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    private const FLOW = 'flow_0123456789abcdef';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->withoutMiddleware(ThrottleRequests::class);

        config()->set('otp.channels', ['log']);
        config()->set('otp.expose_code_in_response', true);
        config()->set('services.google', [
            'client_id' => 'client-123.apps.googleusercontent.com',
            'client_secret' => 'test-secret',
            'redirect' => 'http://localhost:8000/api/auth/google/callback',
            'frontend_url' => 'http://localhost:3000',
        ]);
    }

    // ---------------------------------------------------------------- helpers

    /** Makes the callback see this identity, as Google + the ID-token checks would. */
    private function googleReturns(array $claims): void
    {
        $user = (new SocialiteUser)->setRaw($claims)->map([
            'id' => $claims['sub'],
            'name' => $claims['name'] ?? null,
            'email' => $claims['email'] ?? null,
        ]);

        $provider = Mockery::mock(GoogleOidcProvider::class);
        $provider->shouldReceive('user')->andReturn($user);
        Socialite::shouldReceive('buildProvider')->andReturn($provider);
    }

    /** @return array<string, string> the fragment the app is sent back with */
    private function googleCallback(array $query = ['code' => 'c', 'state' => 's']): array
    {
        $response = $this->withSession(['google_oidc_flow' => self::FLOW])
            ->get('/api/auth/google/callback?'.http_build_query($query));

        $response->assertRedirect();
        $location = $response->headers->get('Location');
        $this->assertStringStartsWith('http://localhost:3000/auth-google#', $location);
        parse_str((string) parse_url($location, PHP_URL_FRAGMENT), $fragment);

        return $fragment;
    }

    private function claims(array $overrides = []): array
    {
        return [
            'sub' => 'google-sub-1',
            'email' => 'amina@gmail.com',
            'email_verified' => true,
            'name' => 'Amina El Idrissi',
            ...$overrides,
        ];
    }

    private function signInWithCode(string $phone, ?string $ticket = null): TestResponse
    {
        $code = $this->postJson('/api/auth/otp/request', ['phone' => $phone])->assertOk()->json('debug_otp_code');

        return $this->postJson('/api/auth/otp/verify', array_filter([
            'phone' => $phone,
            'code' => $code,
            'google_link_ticket' => $ticket,
        ]));
    }

    // --------------------------------------------------------------- redirect

    public function test_redirect_sends_the_browser_to_google_with_state_nonce_and_pkce(): void
    {
        $response = $this->get('/api/auth/google/redirect?flow='.self::FLOW);

        $response->assertRedirect();
        $url = $response->headers->get('Location');
        $this->assertStringStartsWith('https://accounts.google.com/o/oauth2/auth?', $url);
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        $this->assertSame('client-123.apps.googleusercontent.com', $query['client_id']);
        $this->assertSame('http://localhost:8000/api/auth/google/callback', $query['redirect_uri']);
        $this->assertSame('code', $query['response_type']);
        $this->assertStringContainsString('openid', $query['scope']);
        $this->assertNotEmpty($query['state']);
        $this->assertNotEmpty($query['nonce']);
        $this->assertSame('S256', $query['code_challenge_method']);
        $this->assertStringNotContainsString('test-secret', $url);
        $response->assertSessionHas('google_oidc_flow', self::FLOW);
    }

    public function test_redirect_reports_missing_configuration_instead_of_failing(): void
    {
        config()->set('services.google.client_secret', null);

        $this->get('/api/auth/google/redirect?flow='.self::FLOW)
            ->assertRedirect('http://localhost:3000/auth-google#error=unavailable');
    }

    public function test_redirect_refuses_a_malformed_flow_value(): void
    {
        $this->get('/api/auth/google/redirect?flow=<script>')
            ->assertRedirect('http://localhost:3000/auth-google#error=failed');
    }

    // --------------------------------------------------------------- callback

    public function test_cancelling_on_google_returns_cleanly(): void
    {
        $fragment = $this->googleCallback(['error' => 'access_denied', 'state' => 's']);

        $this->assertSame(['flow' => self::FLOW, 'error' => 'cancelled'], $fragment);
    }

    public function test_a_forged_or_stale_state_is_rejected(): void
    {
        $provider = Mockery::mock(GoogleOidcProvider::class);
        $provider->shouldReceive('user')->andThrow(new InvalidStateException);
        Socialite::shouldReceive('buildProvider')->andReturn($provider);

        $this->assertSame('expired', $this->googleCallback()['error']);
    }

    public function test_a_rejected_id_token_is_a_generic_failure(): void
    {
        $provider = Mockery::mock(GoogleOidcProvider::class);
        $provider->shouldReceive('user')->andThrow(new InvalidGoogleIdToken('bad aud'));
        Socialite::shouldReceive('buildProvider')->andReturn($provider);

        $this->assertSame('failed', $this->googleCallback()['error']);
    }

    public function test_an_unverified_google_email_is_refused(): void
    {
        $this->googleReturns($this->claims(['email_verified' => false]));

        $this->assertSame('unverified_email', $this->googleCallback()['error']);
    }

    public function test_a_linked_google_account_signs_in_with_the_same_kind_of_session(): void
    {
        $user = User::factory()->create(['phone' => '+212600000001', 'google_id' => 'google-sub-1']);
        $user->assignRole('User');
        $this->googleReturns($this->claims());

        $fragment = $this->googleCallback();
        $this->assertSame(self::FLOW, $fragment['flow']);
        $this->assertArrayNotHasKey('token', $fragment);

        $session = $this->postJson('/api/auth/google/exchange', [
            'code' => $fragment['code'],
            'device_name' => 'Amud Skills PWA',
        ])->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.phone', '+212600000001')
            ->assertJsonPath('user.roles', ['User'])
            ->assertJsonPath('session.device_name', 'Amud Skills PWA')
            ->assertJsonPath('deletion_pending', false);

        // An ordinary Sanctum token: /auth/me, then logout revokes it.
        $this->withToken($session->json('token'))->getJson('/api/auth/me')->assertOk()->assertJsonMissingPath('google_id');
        $this->withToken($session->json('token'))->postJson('/api/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->withToken($session->json('token'))->getJson('/api/auth/me')->assertUnauthorized();

        // Single use.
        $this->postJson('/api/auth/google/exchange', ['code' => $fragment['code']])
            ->assertStatus(422)->assertJsonPath('reason', 'expired');
    }

    public function test_a_blocked_account_cannot_sign_in_with_google(): void
    {
        User::factory()->create(['google_id' => 'google-sub-1', 'status' => 'blocked']);
        $this->googleReturns($this->claims());

        $this->assertSame('blocked', $this->googleCallback()['error']);
    }

    public function test_an_account_blocked_between_callback_and_exchange_is_refused(): void
    {
        $user = User::factory()->create(['google_id' => 'google-sub-1']);
        $this->googleReturns($this->claims());
        $code = $this->googleCallback()['code'];

        $user->forceFill(['status' => 'blocked'])->save();

        $this->postJson('/api/auth/google/exchange', ['code' => $code])->assertForbidden();
    }

    public function test_a_verified_email_match_is_linked_without_creating_a_second_account(): void
    {
        $user = User::factory()->create(['email' => 'Amina@Gmail.com', 'email_verified_at' => now()]);
        $this->googleReturns($this->claims());

        $this->assertArrayHasKey('code', $this->googleCallback());
        $this->assertSame('google-sub-1', $user->fresh()->google_id);
        $this->assertSame(1, User::count());
    }

    public function test_an_unverified_email_match_is_not_trusted_on_its_own(): void
    {
        // Emails are typed in by administrators and never verified by their
        // owner: a typo must not hand this account to a stranger's Google.
        $user = User::factory()->unverified()->create(['phone' => '+212600000002', 'email' => 'amina@gmail.com']);
        $this->googleReturns($this->claims());

        $fragment = $this->googleCallback();

        $this->assertArrayHasKey('link', $fragment);
        $this->assertSame('amina@gmail.com', $fragment['email']);
        $this->assertNull($user->fresh()->google_id);

        // Proving the account's phone finishes the link — and verifies the email.
        $this->signInWithCode('+212600000002', $fragment['link'])
            ->assertOk()->assertJsonPath('google_link', 'linked')->assertJsonPath('user.id', $user->id);

        $this->assertSame('google-sub-1', $user->fresh()->google_id);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertSame(1, User::count());
    }

    public function test_a_new_person_registers_through_the_usual_phone_code_and_is_linked(): void
    {
        $this->googleReturns($this->claims());
        $ticket = $this->googleCallback()['link'];
        $this->assertSame(0, User::count());

        $this->signInWithCode('+212600000003', $ticket)
            ->assertOk()
            ->assertJsonPath('google_link', 'linked')
            ->assertJsonPath('user.roles', ['User']);

        $user = User::sole();
        $this->assertSame('google-sub-1', $user->google_id);
        $this->assertSame('amina@gmail.com', $user->email);
        $this->assertSame('Amina El Idrissi', $user->name);

        // Next time Google alone is enough.
        $this->assertArrayHasKey('code', $this->googleCallback());
        $this->assertSame(1, User::count());
    }

    public function test_a_link_ticket_is_single_use_and_never_blocks_the_phone_sign_in(): void
    {
        $this->googleReturns($this->claims());
        $ticket = $this->googleCallback()['link'];

        $this->signInWithCode('+212600000004', $ticket)->assertOk()->assertJsonPath('google_link', 'linked');
        $this->signInWithCode('+212600000005', $ticket)->assertOk()->assertJsonPath('google_link', 'expired');

        $this->assertNull(User::where('phone', '+212600000005')->first()->google_id);
    }

    public function test_a_phone_account_already_linked_to_another_google_account_is_a_conflict(): void
    {
        User::factory()->create(['phone' => '+212600000006', 'google_id' => 'someone-else']);
        $this->googleReturns($this->claims());
        $ticket = $this->googleCallback()['link'];

        $this->signInWithCode('+212600000006', $ticket)->assertOk()->assertJsonPath('google_link', 'conflict');
    }

    public function test_an_email_owned_by_an_account_linked_elsewhere_is_a_conflict(): void
    {
        User::factory()->create(['email' => 'amina@gmail.com', 'google_id' => 'someone-else']);
        $this->googleReturns($this->claims());

        $this->assertSame('conflict', $this->googleCallback()['error']);
    }

    public function test_phone_sign_in_without_google_is_unchanged(): void
    {
        $this->signInWithCode('+212600000007')
            ->assertOk()
            ->assertJsonPath('google_link', null)
            ->assertJsonStructure(['token', 'session' => ['id', 'device_name'], 'user' => ['id', 'phone', 'roles'], 'deletion_pending']);
    }

    // --------------------------------------------------------- ID token checks

    public function test_the_id_token_is_verified_against_signature_issuer_audience_expiry_and_nonce(): void
    {
        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($key, $privatePem);
        $details = openssl_pkey_get_details($key)['rsa'];
        $b64 = fn (string $bin) => rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
        $jwks = ['keys' => [['kty' => 'RSA', 'alg' => 'RS256', 'use' => 'sig', 'kid' => 'k1', 'n' => $b64($details['n']), 'e' => $b64($details['e'])]]];

        $otherKey = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($otherKey, $otherPem);

        $valid = [
            'iss' => 'https://accounts.google.com',
            'aud' => 'client-123.apps.googleusercontent.com',
            'azp' => 'client-123.apps.googleusercontent.com',
            'sub' => 'google-sub-1',
            'email' => 'amina@gmail.com',
            'email_verified' => true,
            'nonce' => 'expected-nonce',
            'iat' => time(),
            'exp' => time() + 3600,
        ];

        $verify = function (array $claims, string $pem = '') use ($privatePem, $jwks) {
            $idToken = JWT::encode($claims, $pem ?: $privatePem, 'RS256', 'k1');

            $session = new Store('test', new ArraySessionHandler(10));
            $session->put('state', 'the-state');
            $session->put('google_oidc_nonce', 'expected-nonce');
            $session->put('code_verifier', 'verifier');
            $request = Request::create('/api/auth/google/callback', 'GET', ['state' => 'the-state', 'code' => 'auth-code']);
            $request->setLaravelSession($session);

            $provider = new class($request, 'client-123.apps.googleusercontent.com', 'test-secret', 'http://localhost:8000/api/auth/google/callback') extends GoogleOidcProvider
            {
                public string $idToken;

                public array $jwks;

                public function getAccessTokenResponse($code)
                {
                    return ['access_token' => 'at', 'id_token' => $this->idToken];
                }

                protected function getGoogleJwks()
                {
                    return $this->jwks;
                }
            };
            $provider->idToken = $idToken;
            $provider->jwks = $jwks;

            return $provider->user();
        };

        $this->assertSame('google-sub-1', $verify($valid)->getId());
        $this->assertSame('amina@gmail.com', $verify($valid)->getEmail());

        foreach ([
            'wrong audience' => [['aud' => 'another-client'], ''],
            'wrong issuer' => [['iss' => 'https://evil.example'], ''],
            'wrong nonce' => [['nonce' => 'replayed'], ''],
            'expired' => [['exp' => time() - 3600, 'iat' => time() - 7200], ''],
            'foreign signature' => [[], $otherPem],
        ] as $case => [$overrides, $pem]) {
            try {
                $verify([...$valid, ...$overrides], $pem);
                $this->fail("ID token with {$case} was accepted.");
            } catch (InvalidGoogleIdToken) {
                $this->addToAssertionCount(1);
            }
        }

        $withoutNonce = $valid;
        unset($withoutNonce['nonce']);
        $this->expectException(InvalidGoogleIdToken::class);
        $verify($withoutNonce);
    }
}
