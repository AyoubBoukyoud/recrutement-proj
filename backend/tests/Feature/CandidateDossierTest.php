<?php

namespace Tests\Feature;

use App\Jobs\ProcessDocumentOcr;
use App\Models\CandidateProfile;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The parts of the dossier that turn a pile of saved fields into a submittable
 * file: certified languages, the candidate's own progress, and the final
 * review/submit gate.
 */
class CandidateDossierTest extends TestCase
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

    /** Fill every section that submission requires. */
    private function completeDossier(User $user): CandidateProfile
    {
        $profile = CandidateProfileResolver::resolve($user);
        $profile->update([
            'first_name' => 'Yassin',
            'last_name' => 'El Amrani',
            'date_of_birth' => '1996-04-02',
            'availability_status' => 'immediate',
            'terms_consent_at' => now(),
            'cndp_consent_at' => now(),
        ]);
        $profile->educations()->create(['level' => 'bachelor', 'field' => 'Nursing']);
        $profile->languages()->create(['language' => 'de', 'cefr_level' => 'B2']);

        return $profile->fresh();
    }

    // --- Language certificates -------------------------------------------

    public function test_uploading_a_certificate_certifies_the_language(): void
    {
        Storage::fake('public');
        Bus::fake([ProcessDocumentOcr::class]);
        $this->candidate();

        $response = $this->postJson('/api/candidate/languages/de/certificate', [
            'file' => UploadedFile::fake()->create('goethe-b2.pdf', 40, 'application/pdf'),
            'cefr_level' => 'B2',
        ]);

        $response->assertCreated()
            ->assertJsonPath('language', 'de')
            ->assertJsonPath('cefr_level', 'B2')
            ->assertJsonPath('source', 'certified')
            ->assertJsonPath('certificate_document.type', 'certificate');

        // The certificate has to be *viewable*, not merely recorded.
        $this->assertNotNull($response->json('certificate_document.url'));
        Storage::disk('public')->assertExists($response->json('certificate_document.file_path'));
    }

    public function test_an_already_uploaded_document_can_be_attached_to_a_language(): void
    {
        Storage::fake('public');
        Bus::fake([ProcessDocumentOcr::class]);
        $user = $this->candidate();

        $documentId = $this->postJson('/api/candidate/documents', [
            'type' => 'certificate',
            'file' => UploadedFile::fake()->create('dele.pdf', 20, 'application/pdf'),
        ])->json('id');

        $this->postJson('/api/candidate/languages/fr/certificate', ['document_id' => $documentId])
            ->assertSuccessful()
            ->assertJsonPath('source', 'certified')
            ->assertJsonPath('certificate_document.id', $documentId);

        $this->assertSame($documentId, $user->candidateProfile->languages()->first()->certificate_document_id);
    }

    public function test_a_document_belonging_to_someone_else_cannot_be_attached(): void
    {
        Storage::fake('public');
        Bus::fake([ProcessDocumentOcr::class]);

        $stranger = User::factory()->create();
        $foreign = CandidateProfileResolver::resolve($stranger)->documents()->create([
            'type' => 'certificate',
            'file_path' => 'documents/not-yours.pdf',
            'ocr_status' => 'completed',
        ]);

        $this->candidate();

        $this->postJson('/api/candidate/languages/de/certificate', ['document_id' => $foreign->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('document_id');
    }

    public function test_editing_the_level_does_not_demote_a_certified_language(): void
    {
        Storage::fake('public');
        Bus::fake([ProcessDocumentOcr::class]);
        $this->candidate();

        $this->postJson('/api/candidate/languages/de/certificate', [
            'file' => UploadedFile::fake()->create('goethe.pdf', 20, 'application/pdf'),
            'cefr_level' => 'B1',
        ])->assertCreated();

        $this->putJson('/api/candidate/languages', ['language' => 'de', 'cefr_level' => 'C1'])
            ->assertSuccessful()
            ->assertJsonPath('cefr_level', 'C1')
            ->assertJsonPath('source', 'certified');
    }

    public function test_detaching_a_certificate_returns_the_language_to_self_declared(): void
    {
        Storage::fake('public');
        Bus::fake([ProcessDocumentOcr::class]);
        $this->candidate();

        $this->postJson('/api/candidate/languages/de/certificate', [
            'file' => UploadedFile::fake()->create('goethe.pdf', 20, 'application/pdf'),
            'cefr_level' => 'B2',
        ])->assertCreated();

        $this->deleteJson('/api/candidate/languages/de/certificate')
            ->assertSuccessful()
            ->assertJsonPath('source', 'self_declared')
            ->assertJsonPath('cefr_level', 'B2')
            ->assertJsonPath('certificate_document_id', null);
    }

    public function test_an_unknown_language_code_is_rejected(): void
    {
        $this->candidate();

        $this->postJson('/api/candidate/languages/es/certificate', ['document_id' => 1])
            ->assertNotFound();
    }

    // --- Completeness -----------------------------------------------------

    public function test_a_new_profile_reports_no_progress_and_cannot_be_submitted(): void
    {
        $this->candidate();

        $response = $this->getJson('/api/candidate/profile')->assertSuccessful();

        $this->assertSame(0, $response->json('completeness.percent'));
        $this->assertFalse($response->json('completeness.can_submit'));
        $this->assertSame(
            ['personal', 'education', 'languages', 'availability', 'consents'],
            $response->json('completeness.missing_required'),
        );
    }

    public function test_completeness_tracks_the_sections_that_have_been_filled(): void
    {
        $user = $this->candidate();
        $this->completeDossier($user);

        $response = $this->getJson('/api/candidate/profile')->assertSuccessful();

        $this->assertSame([], $response->json('completeness.missing_required'));
        $this->assertTrue($response->json('completeness.can_submit'));

        $complete = collect($response->json('completeness.sections'))
            ->filter(fn ($section) => $section['complete'])
            ->pluck('key')
            ->all();

        $this->assertSame(['personal', 'education', 'languages', 'availability', 'consents'], $complete);
        // The three optional sections are still open, so this is not yet 100%.
        $this->assertSame(63, $response->json('completeness.percent'));
    }

    // --- Submit -----------------------------------------------------------

    public function test_an_incomplete_dossier_cannot_be_submitted(): void
    {
        $user = $this->candidate();
        CandidateProfileResolver::resolve($user)->update(['first_name' => 'Yassin']);

        $this->postJson('/api/candidate/profile/submit')
            ->assertStatus(422)
            ->assertJsonValidationErrors('missing_required');

        $this->assertNull($user->candidateProfile->fresh()->submitted_at);
    }

    public function test_a_complete_dossier_can_be_submitted(): void
    {
        $user = $this->candidate();
        $this->completeDossier($user);

        $this->postJson('/api/candidate/profile/submit')
            ->assertSuccessful()
            ->assertJsonPath('completeness.can_submit', true);

        $this->assertNotNull($user->candidateProfile->fresh()->submitted_at);
    }

    // --- Preview ----------------------------------------------------------

    public function test_the_preview_matches_what_a_recruiter_is_served(): void
    {
        $user = $this->candidate();
        $profile = $this->completeDossier($user);

        $preview = $this->getJson('/api/candidate/profile/preview')->assertSuccessful();
        $this->assertTrue($preview->json('visible_to_recruiters'));

        $recruiter = User::factory()->create();
        $recruiter->assignRole('Company');
        $this->actingAs($recruiter, 'sanctum');

        $recruiterView = $this->getJson("/api/recruiter/candidates/{$profile->id}")->assertSuccessful();

        // The recruiter payload also carries that recruiter's own shortlist and
        // contact-disclosure state, which is about them rather than about the
        // dossier. The dossier itself must be identical in both.
        $dossier = array_diff_key($recruiterView->json(), array_flip(['shortlist', 'contact']));

        $this->assertSame($dossier, $preview->json('profile'));
    }

    public function test_a_candidate_without_consents_is_told_they_are_not_yet_visible(): void
    {
        $this->candidate();

        $this->getJson('/api/candidate/profile/preview')
            ->assertSuccessful()
            ->assertJsonPath('visible_to_recruiters', false);
    }
}
