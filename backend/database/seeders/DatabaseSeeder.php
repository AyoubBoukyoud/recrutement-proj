<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $admin = User::factory()->create([
            'name' => 'Test Admin',
            'email' => 'admin@example.com',
            'phone' => '+212600000001',
        ]);
        $admin->assignRole('Administrator');

        $company = User::factory()->create([
            'name' => 'Test Recruiter',
            'email' => 'recruiter@example.com',
            'phone' => '+212600000002',
        ]);
        $company->assignRole('Company');

        $agent = User::factory()->create([
            'name' => 'Test Agent',
            'email' => 'agent@example.com',
            'phone' => '+212600000003',
        ]);
        $agent->assignRole('Commercial Agent');
    }
}
