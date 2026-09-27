<?php

namespace App\Services\GoogleAuth;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\InvalidStateException;
use Laravel\Socialite\Two\User;
use Throwable;

/**
 * Socialite's Google driver, held to OpenID Connect rather than plain OAuth.
 *
 * The stock driver checks `state` and exchanges the code, then asks the
 * userinfo endpoint who the access token belongs to — and throws away the ID
 * token Google returned alongside it. Identity here is taken from that ID
 * token instead, after checking what OIDC Core §3.1.3.7 asks of a client:
 * Google's signature (published JWKS), the issuer, that the audience is this
 * client, expiry, and a per-attempt nonce bound to the browser's session. PKCE
 * is on as well, so an intercepted code is useless without the verifier that
 * never left this server.
 */
class GoogleOidcProvider extends GoogleProvider
{
    private const NONCE_SESSION_KEY = 'google_oidc_nonce';

    private const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

    /** Tolerated clock drift, in seconds, between this server and Google. */
    private const LEEWAY = 60;

    protected $usesPKCE = true;

    public function redirect()
    {
        $nonce = Str::random(40);
        $this->request->session()->put(self::NONCE_SESSION_KEY, $nonce);

        // `select_account`: someone signed in to several Google accounts must
        // be able to pick, rather than be silently handed the default one.
        $this->with(['nonce' => $nonce, 'prompt' => 'select_account']);

        return parent::redirect();
    }

    public function user()
    {
        if ($this->user) {
            return $this->user;
        }

        if ($this->hasInvalidState()) {
            throw new InvalidStateException;
        }

        // Pulled, not read: a nonce is good for exactly one callback.
        $nonce = $this->request->session()->pull(self::NONCE_SESSION_KEY);

        $response = $this->getAccessTokenResponse($this->getCode());

        $idToken = Arr::get($response, 'id_token');
        if (! is_string($idToken) || $idToken === '') {
            throw new InvalidGoogleIdToken('Google returned no ID token.');
        }

        return $this->user = $this->mapUserToObject($this->verifiedClaims($idToken, $nonce));
    }

    /**
     * @return array<string, mixed>
     */
    private function verifiedClaims(string $idToken, mixed $expectedNonce): array
    {
        $previousLeeway = JWT::$leeway;
        JWT::$leeway = self::LEEWAY;

        try {
            // Signature, `exp`, `nbf` and `iat` — against Google's current keys.
            $claims = (array) JWT::decode($idToken, JWK::parseKeySet($this->getGoogleJwks()));
        } catch (Throwable $e) {
            throw new InvalidGoogleIdToken('ID token signature or lifetime rejected.', previous: $e);
        } finally {
            JWT::$leeway = $previousLeeway;
        }

        if (! in_array($claims['iss'] ?? null, self::ISSUERS, true)) {
            throw new InvalidGoogleIdToken('Unexpected ID token issuer.');
        }

        if (($claims['aud'] ?? null) !== $this->clientId) {
            throw new InvalidGoogleIdToken('ID token was issued to another client.');
        }

        if (isset($claims['azp']) && $claims['azp'] !== $this->clientId) {
            throw new InvalidGoogleIdToken('ID token was requested by another client.');
        }

        // JWT::decode only checks `exp` when present; an ID token must carry it.
        if (! isset($claims['exp'])) {
            throw new InvalidGoogleIdToken('ID token has no expiry.');
        }

        if (! is_string($expectedNonce) || ! is_string($claims['nonce'] ?? null)
            || ! hash_equals($expectedNonce, $claims['nonce'])) {
            throw new InvalidGoogleIdToken('ID token nonce does not match this sign-in attempt.');
        }

        if (! is_string($claims['sub'] ?? null) || $claims['sub'] === '') {
            throw new InvalidGoogleIdToken('ID token has no subject.');
        }

        return $claims;
    }

    protected function mapUserToObject(array $user)
    {
        return (new User)->setRaw($user)->map([
            'id' => $user['sub'],
            'name' => $user['name'] ?? null,
            'email' => $user['email'] ?? null,
            'avatar' => $user['picture'] ?? null,
        ]);
    }
}
