<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The server-side half of an admin "Bloquer"/"Désactiver": a blocked or
 * deactivated account must lose access here, not merely be hidden by the
 * frontend. Runs after auth:sanctum, so $request->user() is always set.
 */
class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $deletionRecoveryRoute = $user?->deletion_requested_at
            && $request->routeIs('candidate.account.show', 'candidate.account.cancel');

        if ($user && $user->status !== 'active' && ! $deletionRecoveryRoute) {
            $message = $user->status === 'blocked'
                ? 'This account has been blocked.'
                : 'This account has been deactivated.';

            return response()->json(['message' => $message], 403);
        }

        return $next($request);
    }
}
