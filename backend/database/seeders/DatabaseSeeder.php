<?php

namespace Database\Seeders;

use App\Models\CandidateProfile;
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

        // The real administrators from ADMIN_PHONES, before the fake ones below.
        $this->call(AdminPhoneSeeder::class);

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

        $candidate = User::factory()->create([
            'name' => 'Test Candidate',
            'email' => 'candidate@example.com',
            'phone' => '+212600000004',
        ]);
        $candidate->assignRole('User');
        $candidateProfile = CandidateProfile::factory()->verified()->create(['user_id' => $candidate->id]);
        // `verified()` only stamps submission/verification dates — the profile
        // also needs at least one education row and one assessed language to
        // clear ProfileCompleteness::REQUIRED, or the candidate layout keeps
        // redirecting this documented demo account back to profile-creation
        // instead of the dashboard.
        $candidateProfile->educations()->create([
            'level' => 'vocational',
            'field' => 'Soins infirmiers',
            'institution' => 'ISPITS Casablanca',
            'started_at' => '2016-09-01',
            'ended_at' => '2019-06-30',
        ]);
        $candidateProfile->languages()->create([
            'language' => 'fr',
            'cefr_level' => 'B2',
            'source' => 'self_declared',
        ]);

        // Dev/demo volume for the admin Candidats/Recruteurs screens — see
        // DemoDataSeeder. Needs the admin above to already exist (it stamps
        // verified_by_id), so it runs last.
        $this->call(DemoDataSeeder::class);
    }
}
