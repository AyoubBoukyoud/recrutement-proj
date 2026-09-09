<?php

namespace App\Providers;

use App\Services\Otp\OtpChannelManager;
use App\Support\PhoneNumber;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Singleton so a driver registered with extend() is visible to every
        // OtpService instance in the request.
        $this->app->singleton(OtpChannelManager::class, fn ($app) => new OtpChannelManager($app['config']));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureOtpRateLimiting();
        $this->configureApiRateLimiting();
    }

    /**
     * The outer bound on the OTP endpoints. OtpService enforces the per-number
     * cooldown and attempt ceiling; these limiters exist because those live in
     * the database and an attacker rotating numbers would otherwise be free to
     * generate rows — and, once a paid provider is wired in, messages.
     *
     * Keyed by number *and* by IP: the number alone lets one host walk a range
     * of numbers, the IP alone lets a botnet target one number.
     */
    private function configureOtpRateLimiting(): void
    {
        RateLimiter::for('otp-request', fn (Request $request) => [
            Limit::perMinute(3)->by($this->phoneKey($request)),
            Limit::perHour(10)->by($this->phoneKey($request)),
            Limit::perMinute(20)->by('otp-req-ip:'.$request->ip()),
        ]);

        RateLimiter::for('otp-verify', fn (Request $request) => [
            Limit::perMinute(10)->by($this->phoneKey($request)),
            Limit::perMinute(30)->by('otp-verify-ip:'.$request->ip()),
        ]);
    }

    /** Same normalisation the controllers apply, so spacing cannot split buckets. */
    private function phoneKey(Request $request): string
    {
        return 'otp-phone:'.PhoneNumber::normalize((string) $request->input('phone', ''));
    }

    /**
     * Everything behind auth:sanctum was previously unbounded — a signed-in
     * account could hit any endpoint as fast as the client could fire
     * requests. `api` is a generous per-user catch-all (nothing a real user
     * does should ever approach it); the named limiters below it are tighter
     * bounds on the specific endpoints that either cost money to serve
     * (OCR, transcription), expose PII (contact reveal), or are cheap to spam
     * (complaints). All are keyed by the authenticated user, since every
     * route these apply to sits behind auth:sanctum.
     */
    private function configureApiRateLimiting(): void
    {
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($this->userKey($request)));

        // Document upload/retry/rescan: each dispatches a queued OCR job
        // (Tesseract locally, Gemini on escalation) — a real candidate
        // uploads a handful of documents once during onboarding.
        RateLimiter::for('document-upload', fn (Request $request) => [
            Limit::perMinute(10)->by($this->userKey($request)),
            Limit::perHour(30)->by($this->userKey($request)),
        ]);

        // Language-assessment submission: each dispatches a transcription +
        // scoring job. A candidate retakes a handful of times per language,
        // not continuously.
        RateLimiter::for('language-assessment', fn (Request $request) => [
            Limit::perMinute(10)->by($this->userKey($request)),
            Limit::perHour(30)->by($this->userKey($request)),
        ]);

        // Recruiter search: generous enough for normal paging/filtering, but
        // bounds a script walking the whole candidate pool.
        RateLimiter::for('recruiter-search', fn (Request $request) => [
            Limit::perMinute(60)->by($this->userKey($request)),
            Limit::perMinute(120)->by('recruiter-search-ip:'.$request->ip()),
        ]);

        // Contact reveal discloses a candidate's phone/email and is logged as
        // an attributable disclosure — the tightest limiter here, since the
        // abuse case is one recruiter account harvesting contact details
        // across many candidates in a short window.
        RateLimiter::for('recruiter-contact-reveal', fn (Request $request) => [
            Limit::perMinute(20)->by($this->userKey($request)),
            Limit::perDay(200)->by($this->userKey($request)),
        ]);

        // Complaint creation: cheap to spam, no legitimate reason for a
        // candidate to file many in a short window.
        RateLimiter::for('complaint-create', fn (Request $request) => [
            Limit::perMinute(5)->by($this->userKey($request)),
            Limit::perDay(20)->by($this->userKey($request)),
        ]);
    }

    private function userKey(Request $request): string
    {
        return 'user:'.$request->user()?->id;
    }
}
