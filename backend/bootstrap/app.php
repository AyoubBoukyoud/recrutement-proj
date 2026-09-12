<?php

use App\Http\Middleware\EnsureAccountIsActive;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /*
         * There is no `login` route: this application is an API and sign-in
         * happens over OTP against /api/auth/*. Laravel's default guest
         * redirect calls `route('login')` regardless, so an unauthenticated
         * request that did not announce `Accept: application/json` died with
         * `Route [login] not defined` — a 500 where a 401 belongs.
         *
         * The front end always sends that header, so this never showed up in
         * normal use; a monitoring probe, a browser address bar or any other
         * client hitting a protected route did get the 500, and each one
         * logged a stack trace that looked like a server fault.
         *
         * Returning null leaves AuthenticationException without a redirect
         * target, which is what makes the handler answer 401.
         */
        $middleware->redirectGuestsTo(fn () => null);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'account.active' => EnsureAccountIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
