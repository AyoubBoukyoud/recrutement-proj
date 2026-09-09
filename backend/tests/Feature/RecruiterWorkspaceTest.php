<?php

namespace Tests\Feature;

use App\Models\CandidateProfile;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The four recruiter-workspace additions: self-service company profile, team
 * roster, interview scheduling and "my stats" — none of which existed before
 * (only an administrator could touch `CompanyProfile`, and only status).
 */
class RecruiterWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    private User $recruiter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->recruiter = User::factory()->create();
        $this->recruiter->assignRole('Company');
        $this->actingAs($this->recruiter, 'sanctum');
    }

    private function candidate(): CandidateProfile
    {
        $user = User::factory()->create(['phone' => '+2126'.fake()->unique()->numerify('########')]);

        return $user->candidateProfile()->create([
            'first_name' => 'Yassin',
            'last_name' => 'Benali',
            'city' => 'Casablanca',
            'profession' => 'Nurse',
            'terms_consent_at' => now(),
            'cndp_consent_at' => now(),
        ]);
    }

    public function test_a_recruiter_reads_and_updates_their_own_company_profile(): void
    {
        $this->getJson('/api/recruiter/profile')->assertOk()->assertJsonPath('company_name', null);

        $this->patchJson('/api/recruiter/profile', [
            'company_name' => 'Klinikum Berlin',
            'sector' => 'Santé',
            'description' => 'Un grand hôpital.',
            'social_links' => ['linkedin' => 'https://linkedin.com/company/klinikum'],
        ])->assertOk()->assertJsonPath('company_name', 'Klinikum Berlin')->assertJsonPath('social_links.linkedin', 'https://linkedin.com/company/klinikum');

        $this->assertDatabaseHas('company_profiles', ['user_id' => $this->recruiter->id, 'company_name' => 'Klinikum Berlin']);
    }

    public function test_a_recruiter_uploads_a_logo_to_the_public_disk(): void
    {
        Storage::fake('public');
        $file = UploadedFile::fake()->image('logo.png');

        $this->postJson('/api/recruiter/profile/logo', ['logo' => $file])
            ->assertOk()
            ->assertJsonPath('logo_url', fn ($url) => str_contains($url, 'company-logos'));

        $path = $this->recruiter->companyProfile->logo_path;
        Storage::disk('public')->assertExists($path);
    }

    public function test_a_recruiter_manages_their_team_roster_but_not_someone_elses(): void
    {
        $member = $this->postJson('/api/recruiter/team', ['name' => 'Sara Amrani', 'email' => 's.amrani@example.com', 'role' => 'recruiter'])
            ->assertCreated()->json();

        $this->patchJson("/api/recruiter/team/{$member['id']}", ['status' => 'inactive'])->assertOk()->assertJsonPath('status', 'inactive');

        $otherRecruiter = User::factory()->create();
        $otherRecruiter->assignRole('Company');
        $this->actingAs($otherRecruiter, 'sanctum');
        $this->patchJson("/api/recruiter/team/{$member['id']}", ['status' => 'active'])->assertNotFound();
        $this->deleteJson("/api/recruiter/team/{$member['id']}")->assertNotFound();

        $this->assertDatabaseHas('company_team_members', ['id' => $member['id'], 'status' => 'inactive']);
    }

    public function test_scheduling_an_interview_moves_the_application_and_notifies_the_candidate(): void
    {
        $offer = JobOffer::create(['user_id' => $this->recruiter->id, 'title' => 'Nurse', 'description' => 'Role', 'sector' => 'Health', 'city' => 'Berlin', 'contract_type' => 'permanent']);
        $candidate = $this->candidate();
        $application = JobApplication::create(['candidate_profile_id' => $candidate->id, 'job_offer_id' => $offer->id, 'status' => 'submitted', 'applied_at' => now(), 'status_changed_at' => now()]);

        $interview = $this->postJson('/api/recruiter/interviews', [
            'job_application_id' => $application->id,
            'date' => now()->addDays(3)->toDateString(),
            'start_time' => '10:00',
            'end_time' => '10:30',
            'type' => 'video',
        ])->assertCreated()->json();

        $this->assertSame('interview', $application->fresh()->status);
        $this->assertDatabaseHas('app_notifications', ['user_id' => $candidate->user_id, 'type' => 'interview.scheduled']);

        $this->postJson("/api/recruiter/interviews/{$interview['id']}/feedback", [
            'overall' => 4, 'technical' => 5, 'communication' => 4, 'motivation' => 5, 'culture_fit' => 4, 'recommendation' => 'yes',
        ])->assertCreated()->assertJsonPath('recommendation', 'yes');

        // Another recruiter's own offers/applications stay out of reach.
        $stranger = User::factory()->create();
        $stranger->assignRole('Company');
        $this->actingAs($stranger, 'sanctum');
        $this->getJson("/api/recruiter/interviews/{$interview['id']}")->assertNotFound();
    }

    public function test_recruiter_stats_are_scoped_to_their_own_offers(): void
    {
        $offer = JobOffer::create(['user_id' => $this->recruiter->id, 'title' => 'Nurse', 'description' => 'Role', 'sector' => 'Health', 'city' => 'Berlin', 'contract_type' => 'permanent', 'status' => 'published']);
        $otherOffer = JobOffer::create(['user_id' => User::factory()->create()->id, 'title' => 'Cook', 'description' => 'Role', 'sector' => 'Hospitality', 'city' => 'Munich', 'contract_type' => 'permanent', 'status' => 'published']);
        $candidate = $this->candidate();
        JobApplication::create(['candidate_profile_id' => $candidate->id, 'job_offer_id' => $offer->id, 'status' => 'accepted', 'applied_at' => now()->subDays(2), 'status_changed_at' => now()]);
        JobApplication::create(['candidate_profile_id' => $candidate->id, 'job_offer_id' => $otherOffer->id, 'status' => 'accepted', 'applied_at' => now(), 'status_changed_at' => now()]);

        $this->getJson('/api/recruiter/stats')
            ->assertOk()
            ->assertJsonPath('kpis.offres_actives', 1)
            ->assertJsonPath('kpis.recrutements', 1)
            ->assertJsonPath('candidatures_par_offre.0.label', 'Nurse');
    }
}
