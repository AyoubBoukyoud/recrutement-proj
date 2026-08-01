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
}
