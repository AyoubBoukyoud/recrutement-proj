<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RemainingEndpointSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_role_health_endpoints_report_the_authenticated_role(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');
        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/ping')
            ->assertOk()
            ->assertJson(['message' => 'pong', 'role' => 'Administrator']);

        $recruiter = User::factory()->create();
        $recruiter->assignRole('Company');
        $this->app['auth']->forgetGuards();
        $this->actingAs($recruiter, 'sanctum')
            ->getJson('/api/recruiter/ping')
            ->assertOk()
            ->assertJson(['message' => 'pong', 'role' => 'Company']);
    }

    public function test_candidate_document_and_assessment_detail_endpoints_are_owner_scoped(): void
    {
        $owner = User::factory()->create();
        $owner->assignRole('User');
        $profile = CandidateProfileResolver::resolve($owner);
        $document = $profile->documents()->create([
            'type' => 'cv',
            'file_path' => 'documents/cv.pdf',
            'ocr_status' => 'completed',
        ]);
        $assessment = $profile->languageAssessments()->create([
            'language' => 'de',
            'audio_path' => 'assessments/german.m4a',
            'status' => 'completed',
            'predicted_cefr' => 'B2',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/candidate/documents')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $document->id);
        $this->getJson("/api/candidate/language-assessments/{$assessment->id}")
            ->assertOk()
            ->assertJsonPath('predicted_cefr', 'B2');

        $stranger = User::factory()->create();
        $stranger->assignRole('User');
        CandidateProfileResolver::resolve($stranger);
        $this->app['auth']->forgetGuards();
        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/candidate/language-assessments/{$assessment->id}")
            ->assertForbidden();
    }
}
