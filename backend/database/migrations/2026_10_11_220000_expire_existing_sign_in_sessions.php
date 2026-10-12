<?php

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Sign-in sessions used to be issued without an expiry (see
 * config/sanctum.php). New ones now carry one; this gives the ones already out
 * there the same limit, counted from the day each was created.
 *
 * Nobody is signed out the moment this runs: a session that would already
 * have expired keeps working for one more day, then ends like any other.
 */
return new class extends Migration
{
    public function up(): void
    {
        $adminIds = DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('roles.name', 'Administrator')
            ->where('model_has_roles.model_type', User::class)
            ->pluck('model_has_roles.model_id')
            ->flip();

        $userTtl = (int) config('sanctum.session_ttl_minutes');
        $adminTtl = (int) config('sanctum.admin_session_ttl_minutes');
        $floor = CarbonImmutable::now()->addDay();

        DB::table('personal_access_tokens')
            ->whereNull('expires_at')
            ->orderBy('id')
            ->chunkById(500, function ($tokens) use ($adminIds, $userTtl, $adminTtl, $floor) {
                foreach ($tokens as $token) {
                    $ttl = isset($adminIds[$token->tokenable_id]) && $token->tokenable_type === User::class ? $adminTtl : $userTtl;
                    $expires = CarbonImmutable::parse($token->created_at ?? now())->addMinutes($ttl);

                    DB::table('personal_access_tokens')
                        ->where('id', $token->id)
                        ->update(['expires_at' => $expires->greaterThan($floor) ? $expires : $floor]);
                }
            });
    }

    public function down(): void
    {
        // An expiry cannot be told apart from one set at sign-in; nothing to undo.
    }
};
