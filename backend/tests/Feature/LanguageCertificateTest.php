<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * `POST|DELETE /candidate/languages/{language}/certificate` — the two write
 * paths that turn a self-declared language level into a certified one.
 *
 * They were the last endpoints in `routes/api.php` with no test at all, and
 * they are worth covering precisely because attaching a certificate is what
 * makes a level trustworthy to a recruiter: the ownership check on
 * `document_id`, and the level the row falls back to on detach, are both
 * rules that would fail silently.
 */
class LanguageCertificateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function candidate(): User
    {
        $candidate = User::factory()->create();
        $candidate->assignRole('User');
        CandidateProfileResolver::resolve($candidate);

        return $candidate;
    }

    private function asCandidate(User $candidate): static
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($candidate, 'sanctum');
    }

    private function certificate(User $candidate, string $type = 'certificate'): Document
    {
        return $candidate->candidateProfile->documents()->create([
            'type' => $type,
            'file_path' => 'documents/proof.pdf',
            'ocr_status' => 'done',
        ]);
    }

    public function test_attaching_an_uploaded_file_creates_the_row_and_marks_it_certified(): void
    {
        Storage::fake('local');
        Queue::fake();
        $candidate = $this->candidate();

        $response = $this->asCandidate($candidate)->postJson('/api/candidate/languages/de/certificate', [
            'file' => UploadedFile::fake()->create('goethe-b2.pdf', 120, 'application/pdf'),
            'cefr_level' => 'B2',
        ]);

        // 201: the language row did not exist before this call.
        $response->assertStatus(201)
            ->assertJsonPath('language', 'de')
            ->assertJsonPath('cefr_level', 'B2')
            ->assertJsonPath('source', 'certified');

        $this->assertDatabaseHas('candidate_languages', [
            'candidate_profile_id' => $candidate->candidateProfile->id,
            'language' => 'de',
            'source' => 'certified',
        ]);
    }

    public function test_attaching_an_already_uploaded_document_updates_the_existing_row(): void
    {
        $candidate = $this->candidate();
        $candidate->candidateProfile->languages()->create([
            'language' => 'de',
            'cefr_level' => 'A2',
            'self_declared_cefr' => 'A2',
        ]);
        $document = $this->certificate($candidate);

        // 200, not 201: the row already existed and is being upgraded.
        $this->asCandidate($candidate)
            ->postJson('/api/candidate/languages/de/certificate', [
                'document_id' => $document->id,
                'cefr_level' => 'B1',
            ])
            ->assertOk()
            ->assertJsonPath('cefr_level', 'B1')
            ->assertJsonPath('source', 'certified')
            ->assertJsonPath('certificate_document_id', $document->id);
    }

    public function test_a_diploma_is_accepted_as_proof_but_a_cv_is_not(): void
    {
        $candidate = $this->candidate();

        $this->asCandidate($candidate)
            ->postJson('/api/candidate/languages/de/certificate', [
                'document_id' => $this->certificate($candidate, 'diploma')->id,
            ])
            ->assertStatus(201);

        // A CV is not proof of a language level.
        $this->asCandidate($candidate)
            ->postJson('/api/candidate/languages/en/certificate', [
                'document_id' => $this->certificate($candidate, 'cv')->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('document_id');
    }

    public function test_another_candidates_document_cannot_be_claimed_as_proof(): void
    {
        $candidate = $this->candidate();
        $stranger = $this->candidate();
        $theirDocument = $this->certificate($stranger);

        // Deliberately a 422 and not a 404: a 404 would confirm the id exists
        // on someone else's dossier.
        $this->asCandidate($candidate)
            ->postJson('/api/candidate/languages/de/certificate', [
                'document_id' => $theirDocument->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('document_id');

        $this->assertDatabaseMissing('candidate_languages', [
            'candidate_profile_id' => $candidate->candidateProfile->id,
            'certificate_document_id' => $theirDocument->id,
        ]);
    }

    public function test_an_unknown_language_is_rejected(): void
    {
        $candidate = $this->candidate();

        $this->asCandidate($candidate)
            ->postJson('/api/candidate/languages/zz/certificate', [
                'document_id' => $this->certificate($candidate)->id,
            ])
            ->assertNotFound();
    }

    public function test_attaching_requires_either_a_file_or_a_document_id(): void
    {
        $candidate = $this->candidate();

        $this->asCandidate($candidate)
            ->postJson('/api/candidate/languages/de/certificate', ['cefr_level' => 'B2'])
            ->assertStatus(422);
    }

    public function test_detaching_keeps_the_level_the_candidate_declared(): void
    {
        $candidate = $this->candidate();
        $document = $this->certificate($candidate);

        $this->asCandidate($candidate)->postJson('/api/candidate/languages/de/certificate', [
            'document_id' => $document->id,
            'cefr_level' => 'B2',
        ])->assertStatus(201);

        $this->asCandidate($candidate)
            ->deleteJson('/api/candidate/languages/de/certificate')
            ->assertOk()
            ->assertJsonPath('certificate_document_id', null)
            // The proof is gone, but the level the candidate stated stands.
            ->assertJsonPath('cefr_level', 'B2');

        $this->assertDatabaseHas('candidate_languages', [
            'candidate_profile_id' => $candidate->candidateProfile->id,
            'language' => 'de',
            'certificate_document_id' => null,
        ]);
    }

    public function test_detaching_a_language_that_was_never_recorded_is_a_404(): void
    {
        $candidate = $this->candidate();

        $this->asCandidate($candidate)
            ->deleteJson('/api/candidate/languages/de/certificate')
            ->assertNotFound();
    }

    public function test_the_endpoints_require_authentication(): void
    {
        $this->postJson('/api/candidate/languages/de/certificate', ['document_id' => 1])
            ->assertUnauthorized();

        $this->deleteJson('/api/candidate/languages/de/certificate')
            ->assertUnauthorized();
    }
}
