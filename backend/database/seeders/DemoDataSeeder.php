<?php

namespace Database\Seeders;

use App\Models\CandidateProfile;
use App\Models\CandidateSkill;
use App\Models\CompanyProfile;
use App\Models\RecruiterShortlist;
use App\Models\User;
use Database\Factories\CandidateSkillFactory;
use Illuminate\Database\Seeder;

/**
 * Dev/demo-only volume: before this, the database had exactly 3 users and 0
 * candidates, so the admin Candidats/Recruteurs screens (KPIs, filters,
 * pagination, bulk actions) had nothing real to be tested against. Every row
 * here goes through the normal Eloquent factories and relations — this is
 * the standard Laravel seeding mechanism, not frontend mock data.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::role('Administrator')->first();

        $candidates = collect()
            ->concat(CandidateProfile::factory()->count(12)->draft()->create())
            ->concat(CandidateProfile::factory()->count(28)->submitted()->create())
            ->concat(CandidateProfile::factory()->count(20)->verified()->create());

        // The verifier is always the seeded admin, not whichever recruiter
        // happens to run last — verified_at alone doesn't say who vouched.
        CandidateProfile::whereNotNull('verified_at')->update(['verified_by_id' => $admin->id]);

        foreach ($candidates as $candidate) {
            foreach (collect(CandidateSkillFactory::SKILLS)->shuffle()->take(rand(0, 4)) as $skill) {
                CandidateSkill::factory()->create([
                    'candidate_profile_id' => $candidate->id,
                    'skill' => $skill,
                ]);
            }
        }

        // A handful of accounts in a non-active state, so "Bloquer/Désactiver"
        // and the account_status filter have something real to show.
        $blocked = $candidates->random(6);
        $blockedIds = $blocked->pluck('id');
        $blocked->each(fn (CandidateProfile $c) => $c->user->update(['status' => 'blocked']));

        $candidates->reject(fn (CandidateProfile $c) => $blockedIds->contains($c->id))
            ->random(4)
            ->each(fn (CandidateProfile $c) => $c->user->update(['status' => 'inactive']));

        $recruiters = collect()
            ->concat(CompanyProfile::factory()->count(5)->verified()->create())
            ->concat(CompanyProfile::factory()->count(3)->create());

        $recruiters->first()->user->update(['status' => 'blocked']);

        // Only discoverable candidates (both consents on record) are visible
        // to a recruiter in the real product — mirrors RecruiterCandidateSearch.
        $discoverable = $candidates->filter(fn (CandidateProfile $c) => $c->terms_consent_at && $c->cndp_consent_at);

        foreach ($recruiters as $recruiter) {
            foreach ($discoverable->random(min(12, $discoverable->count())) as $candidate) {
                RecruiterShortlist::factory()->create([
                    'user_id' => $recruiter->user_id,
                    'candidate_profile_id' => $candidate->id,
                ]);
            }
        }
    }
}
