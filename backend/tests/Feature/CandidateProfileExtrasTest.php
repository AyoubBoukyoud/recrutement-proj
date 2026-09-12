<?php

namespace Tests\Feature;

use App\Jobs\ProcessDocumentOcr;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Three additions built on top of the existing profile/document machinery
 * rather than new parallel systems: identity verification reuses document
 * upload + admin approval, matching preferences is a JSON column read back
 * through the same profile endpoint, and the timeline is derived from
 * timestamps that already exist elsewhere on the dossier.
 */
class CandidateProfileExtrasTest extends TestCase
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

    // --- Identity verification (document type + no OCR) --------------------

    public function test_an_identity_document_can_be_uploaded_and_skips_ocr(): void
    {
        Storage::fake('local');
        Bus::fake([ProcessDocumentOcr::class]);
        $this->candidate();

        $response = $this->postJson('/api/candidate/documents', [
            'type' => 'identity',
            'file' => UploadedFile::fake()->create('id-card.jpg', 500, 'image/jpeg'),
        ]);

        $response->assertCreated()->assertJsonPath('type', 'identity');
        Bus::assertNotDispatched(ProcessDocumentOcr::class);
    }

    public function test_an_administrator_can_approve_an_identity_document(): void
    {
        Storage::fake('local');
        Bus::fake([ProcessDocumentOcr::class]);
        $user = $this->candidate();

        $documentId = $this->postJson('/api/candidate/documents', [
            'type' => 'identity',
            'file' => UploadedFile::fake()->create('id-card.jpg', 500, 'image/jpeg'),
        ])->json('id');

        $admin = User::factory()->create();
        $admin->assignRole('Administrator');

        $this->actingAs($admin)
            ->patchJson("/api/admin/documents/{$documentId}/approval", ['approval_status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('approval_status', 'approved');
    }

    // --- Matching preferences -----------------------------------------------

    public function test_matching_preferences_round_trip_through_the_profile_endpoint(): void
    {
        $this->candidate();

        $preferences = ['regions' => ['Casablanca-Settat', 'Rabat-Salé-Kénitra'], 'sectors' => ['Santé'], 'min_salary' => 3000];

        $this->putJson('/api/candidate/profile', ['matching_preferences' => $preferences])
            ->assertOk()
            ->assertJsonPath('matching_preferences.min_salary', 3000);

        $this->getJson('/api/candidate/profile')
            ->assertOk()
            ->assertJsonPath('matching_preferences.regions', ['Casablanca-Settat', 'Rabat-Salé-Kénitra'])
            ->assertJsonPath('matching_preferences.sectors', ['Santé']);
    }

    // --- Timeline ------------------------------------------------------------

    public function test_the_timeline_reports_milestones_reached_and_not_yet_reached(): void
    {
        $user = $this->candidate();
        $profile = CandidateProfileResolver::resolve($user);
        $profile->update(['first_name' => 'Yassin', 'last_name' => 'Benali', 'date_of_birth' => '1996-04-02']);

        $response = $this->getJson('/api/candidate/profile/timeline')->assertOk();
        $steps = collect($response->json())->keyBy('key');

        $this->assertNotNull($steps['registered']['completed_at']);
        $this->assertNotNull($steps['personal_info']['completed_at']);
        $this->assertNull($steps['cv_uploaded']['completed_at']);
        $this->assertNull($steps['submitted']['completed_at']);
        $this->assertNull($steps['verified']['completed_at']);
    }
}
