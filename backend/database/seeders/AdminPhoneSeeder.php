<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\AdminPhones;
use Illuminate\Database\Seeder;

/**
 * Provisions the ADMIN_PHONES allowlist as real accounts.
 *
 * AuthController grants the role at sign-in anyway, so this is not what makes
 * the allowlist work — it is what makes those administrators visible in the
 * console's user list before they have ever logged in, and it is safe to run
 * on a production deploy: it only ever creates a missing account or adds a
 * missing role, and never touches a name, a phone or another user's roles.
 */
class AdminPhoneSeeder extends Seeder
{
    public function run(): void
    {
        $phones = AdminPhones::all();

        if ($phones === []) {
            $this->command?->warn('ADMIN_PHONES is empty — no administrator provisioned.');

            return;
        }

        foreach ($phones as $phone) {
            $user = User::firstOrCreate(
                ['phone' => $phone],
                ['name' => 'Administrator', 'status' => 'active'],
            );

            if (! $user->hasRole('Administrator')) {
                $user->assignRole('Administrator');
            }

            $this->command?->info("Administrator: {$phone}");
        }
    }
}
