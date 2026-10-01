<?php

namespace App\Services\GoogleAuth;

use App\Models\User;
use App\Services\AuthSession;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as GoogleUser;

/**
 * Decides which account a verified Google identity reaches.
 *
 * Google is a full way in, like the phone code: a first sign-in creates the
 * candidate account, and the profile is completed afterwards (the app sends a
 * new account to /profile-creation). What stays guarded is an email match
 * alone, because `users.email` can be typed in by administrators and never
 * verified by its owner:
 *
 *  1. `google_id` already linked            → signed in.
 *  2. email matches an account whose email
 *     was verified (by an earlier link)     → linked, then signed in.
 *  3. email matches an account whose email
 *     was never verified                    → the person confirms that
 *     account's phone once, then it is linked. Linking on the email alone
 *     would hand someone else's account to whoever owns that Gmail.
 *  4. no account uses this email            → a new candidate account is
 *     created (Google-verified email, no phone) and signed in.
 */
class GoogleSignIn
{
    /** How long the browser has to trade its one-time code for a session. */
    private const EXCHANGE_TTL_SECONDS = 60;

    /** How long a "confirm your phone to finish" hand-off stays usable. */
    private const LINK_TTL_MINUTES = 15;

    public const LINKED = 'linked';

    public const LINK_EXPIRED = 'expired';

    public const LINK_CONFLICT = 'conflict';

    public function __construct(private readonly AuthSession $session) {}

    /**
     * @return array{outcome: 'signed_in', exchange_code: string}
     *                                                            |array{outcome: 'confirm_phone', ticket: string, email: string}
     *                                                            |array{outcome: 'blocked'|'conflict'|'unverified_email'}
     */
    public function resolve(GoogleUser $google): array
    {
        $raw = $google->getRaw();

        // Only Google's own `email_verified` claim counts — never an address
        // the browser could have supplied.
        if (($raw['email_verified'] ?? false) !== true || ! is_string($google->getEmail())) {
            return ['outcome' => 'unverified_email'];
        }

        $sub = (string) $google->getId();
        $email = Str::lower(trim($google->getEmail()));

        $user = User::where('google_id', $sub)->first();

        if (! $user) {
            $owner = $this->userWithEmail($email);

            // That address already belongs to an account tied to a different
            // Google account: letting this one in too would split the person.
            if ($owner?->google_id) {
                return ['outcome' => 'conflict'];
            }

            if ($owner?->email_verified_at) {
                if (! $this->session->canSignIn($owner)) {
                    return ['outcome' => 'blocked'];
                }
                $owner->forceFill(['google_id' => $sub])->save();
                $user = $owner;
            } elseif ($owner) {
                return [
                    'outcome' => 'confirm_phone',
                    'ticket' => $this->issueLinkTicket($sub, $email, $google->getName()),
                    'email' => $email,
                ];
            } else {
                $user = $this->register($sub, $email, $google->getName());
            }
        }

        if (! $this->session->canSignIn($user)) {
            return ['outcome' => 'blocked'];
        }

        return ['outcome' => 'signed_in', 'exchange_code' => $this->issueExchangeCode($user)];
    }

    /**
     * The access token never travels in a URL: the callback hands the browser
     * this short-lived, single-use code instead, which the app posts back.
     */
    public function redeemExchangeCode(string $code): ?User
    {
        $userId = Cache::pull($this->exchangeKey($code));

        return $userId ? User::find($userId) : null;
    }

    /**
     * Called once the person has proved a phone number with its code. Never
     * fails the sign-in itself: the phone code alone already opened it.
     */
    public function completeLink(User $user, string $ticket): string
    {
        $identity = Cache::pull($this->linkKey($ticket));

        if (! is_array($identity)) {
            return self::LINK_EXPIRED;
        }

        if ($user->google_id !== null) {
            return $user->google_id === $identity['sub'] ? self::LINKED : self::LINK_CONFLICT;
        }

        $attributes = ['google_id' => $identity['sub']];
        $owner = $this->userWithEmail($identity['email']);

        if ($user->email === null && $owner === null) {
            $attributes['email'] = $identity['email'];
            $attributes['email_verified_at'] = Carbon::now();
        } elseif ($user->email !== null && Str::lower($user->email) === $identity['email']) {
            // Google just proved the address the account already had.
            $attributes['email_verified_at'] = Carbon::now();
        }

        if (! $user->name && $identity['name']) {
            $attributes['name'] = $identity['name'];
        }

        try {
            $user->forceFill($attributes)->save();
        } catch (UniqueConstraintViolationException) {
            // The same Google account was linked elsewhere in the meantime.
            return self::LINK_CONFLICT;
        }

        return self::LINKED;
    }

    /**
     * A first Google sign-in: the same candidate account the phone code would
     * create (`User` role, active), keyed on Google instead of a phone.
     */
    private function register(string $sub, string $email, ?string $name): User
    {
        try {
            $user = new User;
            $user->forceFill([
                'google_id' => $sub,
                'email' => $email,
                'email_verified_at' => Carbon::now(),
                'name' => $name ? Str::limit(trim($name), 255, '') : null,
                'status' => 'active',
            ])->save();
        } catch (UniqueConstraintViolationException) {
            // A second tab finished the same first sign-in a moment earlier.
            return User::where('google_id', $sub)->firstOrFail();
        }

        $user->assignRole('User');

        return $user;
    }

    private function issueExchangeCode(User $user): string
    {
        $code = Str::random(64);
        Cache::put($this->exchangeKey($code), $user->id, self::EXCHANGE_TTL_SECONDS);

        return $code;
    }

    private function issueLinkTicket(string $sub, string $email, ?string $name): string
    {
        $ticket = Str::random(64);
        Cache::put($this->linkKey($ticket), [
            'sub' => $sub,
            'email' => $email,
            'name' => $name,
        ], Carbon::now()->addMinutes(self::LINK_TTL_MINUTES));

        return $ticket;
    }

    private function userWithEmail(string $email): ?User
    {
        return User::whereRaw('LOWER(email) = ?', [$email])->first();
    }

    // Only a hash is used as the cache key, so a cache dump reveals no
    // redeemable value.
    private function exchangeKey(string $code): string
    {
        return 'google-auth:exchange:'.hash('sha256', $code);
    }

    private function linkKey(string $ticket): string
    {
        return 'google-auth:link:'.hash('sha256', $ticket);
    }
}
