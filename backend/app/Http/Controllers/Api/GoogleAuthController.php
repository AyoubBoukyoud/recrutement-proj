<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthSession;
use App\Services\GoogleAuth\GoogleOidcProvider;
use App\Services\GoogleAuth\GoogleSignIn;
use App\Services\GoogleAuth\InvalidGoogleIdToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirect;
use Throwable;

/**
 * "Continue with Google" — the browser leaves the app for Google and comes
 * back here, then is sent on to the app's /auth-google screen with the result
 * in the URL fragment (never sent to a server, never in an access log). A
 * successful sign-in carries only a one-time exchange code there; the Sanctum
 * token itself is handed over by `exchange`, in a response body, exactly as
 * the phone-code sign-in does.
 *
 * `flow` is a random value the app generated and kept in its own tab before
 * leaving. It comes back in the fragment, and the app refuses a result that
 * does not carry it — so a link crafted by someone else cannot sign a victim
 * into the attacker's account.
 */
class GoogleAuthController extends Controller
{
    private const FLOW_SESSION_KEY = 'google_oidc_flow';

    public function __construct(
        private readonly GoogleSignIn $googleSignIn,
        private readonly AuthSession $authSession,
    ) {}

    public function redirect(Request $request): SymfonyRedirect
    {
        if (! $this->isConfigured()) {
            return $this->toApp(['error' => 'unavailable']);
        }

        $flow = (string) $request->query('flow', '');
        if (! preg_match('/^[A-Za-z0-9_-]{16,128}$/', $flow)) {
            return $this->toApp(['error' => 'failed']);
        }

        $request->session()->put(self::FLOW_SESSION_KEY, $flow);

        return $this->provider()->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $flow = $request->session()->pull(self::FLOW_SESSION_KEY);
        $back = fn (array $fragment) => $this->toApp(
            is_string($flow) ? ['flow' => $flow, ...$fragment] : $fragment,
        );

        if (! $this->isConfigured()) {
            return $back(['error' => 'unavailable']);
        }

        // The person closed the consent screen or pressed "Cancel".
        if ($request->query('error') === 'access_denied') {
            return $back(['error' => 'cancelled']);
        }

        try {
            $google = $this->provider()->user();
        } catch (InvalidStateException) {
            // Session expired or the callback was replayed/forged.
            return $back(['error' => 'expired']);
        } catch (Throwable $e) {
            // Only the class is logged: Google's error bodies and the
            // exception chain can quote codes that must not reach a log file.
            Log::warning('Google sign-in callback failed.', [
                'exception' => $e::class,
                'id_token_rejected' => $e instanceof InvalidGoogleIdToken ? $e->getMessage() : null,
            ]);

            return $back(['error' => 'failed']);
        }

        $result = $this->googleSignIn->resolve($google);

        return match ($result['outcome']) {
            'signed_in' => $back(['code' => $result['exchange_code']]),
            'confirm_phone' => $back(['link' => $result['ticket'], 'email' => $result['email']]),
            default => $back(['error' => $result['outcome']]),
        };
    }

    /**
     * Trades the callback's one-time code for the same session payload that
     * `POST /auth/otp/verify` returns.
     */
    public function exchange(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:128'],
            'device_name' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $user = $this->googleSignIn->redeemExchangeCode($data['code']);

        if (! $user) {
            return response()->json(['message' => 'This sign-in link has expired.', 'reason' => 'expired'], 422);
        }

        // Re-checked: an account can be blocked between callback and exchange.
        if (! $this->authSession->canSignIn($user)) {
            return response()->json(['message' => 'This account cannot sign in.'], 403);
        }

        return response()->json($this->authSession->issue($user, $data['device_name'] ?? null));
    }

    private function provider(): GoogleOidcProvider
    {
        /** @var GoogleOidcProvider */
        return Socialite::buildProvider(GoogleOidcProvider::class, config('services.google'));
    }

    private function isConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'))
            && filled(config('services.google.frontend_url'));
    }

    /**
     * @param  array<string, string>  $fragment
     */
    private function toApp(array $fragment): RedirectResponse
    {
        $base = rtrim((string) config('services.google.frontend_url'), '/');

        return new RedirectResponse($base.'/auth-google#'.http_build_query($fragment));
    }
}
