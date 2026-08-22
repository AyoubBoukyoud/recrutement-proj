<?php

namespace Tests\Feature;

use App\Jobs\ProcessDocumentOcr;
use App\Jobs\ProcessLanguageAssessment;
use App\Models\CandidateProfile;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Everything behind auth:sanctum used to be unbounded — a signed-in account
 * could hit any endpoint as fast as the client could fire requests. These
 * confirm the endpoint-specific limiters (AppServiceProvider) actually engage
 * on the routes they're attached to in routes/api.php, and that the general
 * `api` fallback catches an endpoint with no specific limiter of its own.
 */
class ApiRateLimitingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function candidate(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    private function recruiter(): User
    {
        $user = User::factory()->create();
        $user->assignRole('Company');
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    /** A consented, discoverable candidate for the recruiter-facing limiters. */
    private function discoverableCandidate(): CandidateProfile
    {
        return User::factory()->create()->candidateProfile()->create([
            'first_name' => 'Yassin',
            'last_name' => 'Benali',
            'terms_consent_at' => now(),
            'cndp_consent_at' => now(),
        ]);
    }

    public function test_document_upload_is_rate_limited(): void
    {
        Storage::fake('local');
        Bus::fake([ProcessDocumentOcr::class]);
        $this->candidate();

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/candidate/documents', [
                'type' => 'cv',
                'file' => UploadedFile::fake()->create("doc{$i}.pdf", 10, 'application/pdf'),
            ])->assertCreated();
        }

        $this->postJson('/api/candidate/documents', [
            'type' => 'cv',
            'file' => UploadedFile::fake()->create('one-too-many.pdf', 10, 'application/pdf'),
        ])->assertStatus(429);
    }

    public function test_language_assessment_submission_is_rate_limited(): void
    {
        Storage::fake('local');
        Bus::fake([ProcessLanguageAssessment::class]);
        $this->candidate();

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/candidate/language-assessments', [
                'language' => 'fr',
                'audio' => UploadedFile::fake()->create("take{$i}.wav", 500, 'audio/wav'),
            ])->assertCreated();
        }

        $this->postJson('/api/candidate/language-assessments', [
            'language' => 'fr',
            'audio' => UploadedFile::fake()->create('one-too-many.wav', 500, 'audio/wav'),
        ])->assertStatus(429);
    }

    public function test_complaint_creation_is_rate_limited(): void
    {
        $this->candidate();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/complaints', [
                'type' => 'text',
                'body' => "Issue number {$i}.",
            ])->assertCreated();
        }

        $this->postJson('/api/complaints', [
            'type' => 'text',
            'body' => 'One too many.',
        ])->assertStatus(429);
    }

    public function test_recruiter_contact_reveal_is_rate_limited(): void
    {
        $this->recruiter();
        $candidate = $this->discoverableCandidate();

        // Idempotent — repeating it is exactly the abuse case (one account
        // harvesting contact details) the limiter exists to bound.
        for ($i = 0; $i < 20; $i++) {
            $this->postJson("/api/recruiter/candidates/{$candidate->id}/contact")->assertOk();
        }

        $this->postJson("/api/recruiter/candidates/{$candidate->id}/contact")->assertStatus(429);
    }

    public function test_recruiter_search_is_rate_limited(): void
    {
        $this->recruiter();

        for ($i = 0; $i < 60; $i++) {
            $this->getJson('/api/recruiter/candidates')->assertOk();
        }

        $this->getJson('/api/recruiter/candidates')->assertStatus(429);
    }

    /** No route-specific limiter exists on GET /candidate/profile — the general `api` fallback must still bound it. */
    public function test_the_general_fallback_bounds_an_endpoint_with_no_specific_limiter(): void
    {
        $this->candidate();

        for ($i = 0; $i < 120; $i++) {
            $this->getJson('/api/candidate/profile')->assertOk();
        }

        $this->getJson('/api/candidate/profile')->assertStatus(429);
    }
}
