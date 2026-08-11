<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

/**
 * Grant, revoke and list the Administrator role.
 *
 * Until this existed there was no way to make an administrator at all: the
 * seeder creates the four roles but never assigns one, and `POST /auth/otp/request`
 * gives every new number the plain `User` role. The only route to the admin
 * console was editing `model_has_roles` by hand in MySQL — which also meant
 * the console could only ever be reached from a phone number that happened to
 * already be in the database.
 *
 * The number matters as much as the role: an administrator signs in with the
 * same phone-and-code flow as everyone else, so the account has to be a phone
 * that can actually receive the code.
 */
class ManageAdmins extends Command
{
    protected $signature = 'admin:make
        {phone? : Phone number in international format, e.g. +212600000000}
        {--revoke : Take the Administrator role away instead of granting it}
        {--list : Show who currently holds it, and grant nothing}';

    protected $description = 'Grant, revoke or list the Administrator role for a phone number';

    private const ROLE = 'Administrator';

    public function handle(): int
    {
        if ($this->option('list')) {
            return $this->listAdmins();
        }

        $phone = (string) $this->argument('phone');

        if ($phone === '') {
            $this->error('A phone number is required. Use --list to see the current administrators.');

            return self::FAILURE;
        }

        try {
            $phone = $this->normalise($phone);
        } catch (ValidationException) {
            $this->error("[{$phone}] is not a phone number in international format. Example: +212600000000");

            return self::FAILURE;
        }

        if (! Role::where('name', self::ROLE)->exists()) {
            $this->error('The Administrator role does not exist yet. Run `php artisan db:seed --class=RoleSeeder` first.');

            return self::FAILURE;
        }

        return $this->option('revoke') ? $this->revoke($phone) : $this->grant($phone);
    }

    /**
     * Same normalisation as the login endpoint, so the account this touches is
     * the one that number will actually sign in as — "+212 600-000-001" and
     * "00212600000001" must not create a second, roleless account.
     */
    private function normalise(string $phone): string
    {
        $normalised = PhoneNumber::normalize($phone);

        validator(['phone' => $normalised], ['phone' => ['required', 'string', 'max:20', PhoneNumber::E164_RULE]])
            ->validate();

        return $normalised;
    }

    private function grant(string $phone): int
    {
        // Created rather than required: an administrator is usually appointed
        // before they have ever opened the app.
        $user = User::firstOrCreate(['phone' => $phone]);

        if ($user->hasRole(self::ROLE)) {
            $this->info("{$phone} is already an administrator.");

            return self::SUCCESS;
        }

        $user->assignRole(self::ROLE);

        $this->info("{$phone} is now an administrator.");
        $this->line('  Sign in at /auth-phone with that number — the console is at /admin/dashboard.');

        return self::SUCCESS;
    }

    private function revoke(string $phone): int
    {
        $user = User::where('phone', $phone)->first();

        if (! $user || ! $user->hasRole(self::ROLE)) {
            $this->warn("{$phone} is not an administrator — nothing to revoke.");

            return self::SUCCESS;
        }

        // The account itself is left alone: an ex-administrator is still a
        // person with a dossier, complaints and sessions attached.
        $user->removeRole(self::ROLE);

        $this->info("{$phone} is no longer an administrator.");

        return self::SUCCESS;
    }

    private function listAdmins(): int
    {
        $admins = User::role(self::ROLE)->orderBy('id')->get(['id', 'phone', 'email']);

        if ($admins->isEmpty()) {
            $this->warn('No administrator yet. Grant one with: php artisan admin:make +212600000000');

            return self::SUCCESS;
        }

        $this->table(
            ['ID', 'Phone', 'Email'],
            $admins->map(fn (User $user) => [$user->id, $user->phone ?? '—', $user->email ?? '—'])->all(),
        );

        return self::SUCCESS;
    }
}
