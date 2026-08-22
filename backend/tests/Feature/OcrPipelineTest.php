<?php

namespace Tests\Feature;

use App\Jobs\ProcessDocumentOcr;
use App\Models\Document;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use App\Services\Ocr\DocumentFieldExtractor;
use App\Services\Ocr\GeminiCvExtractor;
use App\Services\Ocr\TesseractOcrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The pipeline around the extractors: what a confirmed extraction does to the
 * profile, how a weak result is escalated and classified, and the two ways a
 * candidate can get a bad scan looked at again.
 */
class OcrPipelineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.model' => 'gemini-3.6-flash',
            'services.gemini.endpoint' => 'https://generativelanguage.googleapis.com/v1beta/interactions',
            'ocr.escalate_to_cloud' => false,
        ]);
    }

    // --- Write-back to the profile ---------------------------------------

    public function test_confirming_an_extraction_fills_the_profile(): void
    {
        $user = $this->candidate();
        $document = $this->documentWithFields($user, [
            'first_name' => 'Yassin',
            'last_name' => 'El Amrani',
            'date_of_birth' => '1996-04-02',
            'profession' => 'Nurse',
            'specialization' => 'ICU',
            'years_of_experience' => 7,
            'educations' => [
                ['level' => 'bachelor', 'field' => 'Nursing', 'institution' => 'Institut Supérieur', 'ended_at' => '2015-06-30'],
            ],
            'languages' => [['language' => 'de', 'cefr_level' => 'B1']],
        ]);

        $response = $this->patchJson("/api/candidate/documents/{$document->id}/review")
            ->assertSuccessful();

        $profile = $user->candidateProfile->fresh(['educations', 'languages']);

        $this->assertSame('Yassin', $profile->first_name);
        $this->assertSame('El Amrani', $profile->last_name);
        $this->assertSame('1996-04-02', $profile->date_of_birth->format('Y-m-d'));
        $this->assertSame('Nurse', $profile->profession);
        $this->assertSame('ICU', $profile->specialization);
        $this->assertSame(7, $profile->years_of_experience);

        $this->assertSame('bachelor', $profile->educations->first()->level);
        $this->assertSame('Institut Supérieur', $profile->educations->first()->institution);

        $german = $profile->languages->firstWhere('language', 'de');
        $this->assertSame('B1', $german->cefr_level);
        // Read off the candidate's own CV: their claim, not a verified one.
        $this->assertSame('B1', $german->self_declared_cefr);
        $this->assertSame('self_declared', $german->source);

        $this->assertContains('profession', $response->json('profile_update.applied'));
        $this->assertContains('educations', $response->json('profile_update.applied'));
    }

    public function test_it_does_not_overwrite_what_the_candidate_already_typed(): void
    {
        $user = $this->candidate();
        CandidateProfileResolver::resolve($user)->update([
            'first_name' => 'Yassine',
            'profession' => 'Registered Nurse',
        ]);

        $document = $this->documentWithFields($user, [
            'first_name' => 'Yassin',
            'last_name' => 'El Amrani',
            'profession' => 'Nurse',
        ]);

        $response = $this->patchJson("/api/candidate/documents/{$document->id}/review")->assertSuccessful();

        $profile = $user->candidateProfile->fresh();

        $this->assertSame('Yassine', $profile->first_name);
        $this->assertSame('Registered Nurse', $profile->profession);
        // The blank one was still filled.
        $this->assertSame('El Amrani', $profile->last_name);

        $this->assertSame(['last_name'], $response->json('profile_update.applied'));
        $this->assertEqualsCanonicalizing(
            ['first_name', 'profession'],
            $response->json('profile_update.skipped'),
        );
    }

    public function test_overwrite_replaces_the_existing_values_when_asked(): void
    {
        $user = $this->candidate();
        CandidateProfileResolver::resolve($user)->update(['profession' => 'Registered Nurse']);

        $document = $this->documentWithFields($user, ['profession' => 'Nurse']);

        $this->patchJson("/api/candidate/documents/{$document->id}/review", ['overwrite' => true])
            ->assertSuccessful();

        $this->assertSame('Nurse', $user->candidateProfile->fresh()->profession);
    }

    public function test_confirming_the_same_document_twice_does_not_duplicate_education(): void
    {
        $user = $this->candidate();
        $document = $this->documentWithFields($user, [
            'educations' => [['level' => 'bachelor', 'field' => 'Nursing', 'institution' => 'Institut Supérieur']],
        ]);

        $this->patchJson("/api/candidate/documents/{$document->id}/review")->assertSuccessful();
        $this->patchJson("/api/candidate/documents/{$document->id}/review")->assertSuccessful();

        $this->assertCount(1, $user->candidateProfile->fresh()->educations);
    }

    public function test_a_cv_language_never_demotes_a_certified_one(): void
    {
        $user = $this->candidate();
        $profile = CandidateProfileResolver::resolve($user);
        $certificate = $profile->documents()->create([
            'type' => 'certificate', 'file_path' => 'documents/goethe.pdf', 'ocr_status' => 'completed',
        ]);
        $profile->languages()->create([
            'language' => 'de',
            'cefr_level' => 'C1',
            'self_declared_cefr' => 'C1',
            'source' => 'certified',
            'certificate_document_id' => $certificate->id,
        ]);

        $document = $this->documentWithFields($user, [
            'languages' => [['language' => 'de', 'cefr_level' => 'A2']],
        ]);

        $this->patchJson("/api/candidate/documents/{$document->id}/review")->assertSuccessful();

        $german = $profile->fresh()->languages->firstWhere('language', 'de');
        $this->assertSame('C1', $german->cefr_level);
        $this->assertSame('certified', $german->source);
    }

    public function test_the_candidates_corrections_are_what_gets_written(): void
    {
        $user = $this->candidate();
        $document = $this->documentWithFields($user, ['profession' => 'Nurse', 'first_name' => 'Yasin']);

        $this->patchJson("/api/candidate/documents/{$document->id}/review", [
            'extracted_fields' => ['profession' => 'Midwife', 'first_name' => 'Yassin'],
        ])->assertSuccessful();

        $profile = $user->candidateProfile->fresh();
        $this->assertSame('Midwife', $profile->profession);
        $this->assertSame('Yassin', $profile->first_name);
    }

    public function test_a_candidate_can_confirm_without_applying(): void
    {
        $user = $this->candidate();
        $document = $this->documentWithFields($user, ['profession' => 'Nurse']);

        $this->patchJson("/api/candidate/documents/{$document->id}/review", ['apply' => false])
            ->assertSuccessful()
            ->assertJsonPath('profile_update.applied', []);

        $this->assertNull($user->candidateProfile->fresh()->profession);
        $this->assertNotNull($document->fresh()->extraction->reviewed_at);
    }

    public function test_another_candidates_document_cannot_be_reviewed(): void
    {
        $stranger = User::factory()->create();
        $document = $this->documentWithFields($stranger, ['profession' => 'Nurse']);

        $this->candidate();

        $this->patchJson("/api/candidate/documents/{$document->id}/review")->assertForbidden();
    }

    // --- Low-confidence handling ------------------------------------------

    public function test_a_weak_local_pass_is_escalated_to_the_cloud_engine(): void
    {
        config(['ocr.escalate_to_cloud' => true]);

        Http::fake(['*' => Http::response(self::interaction(['profession' => 'Welder', 'confidence' => 82]))]);

        // Tesseract is not installed in CI, so the local pass returns 0 —
        // the same shape as an unreadable phone photo.
        $document = $this->makeDocument('certificate', 'scan.jpg');

        $this->runPipeline($document);

        $document->refresh();

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame(82, $document->extraction->confidence);
        $this->assertSame('Welder', $document->extraction->extracted_fields['profession']);
        $this->assertTrue($document->extraction->extracted_fields['escalated_to_cloud']);
    }

    public function test_escalation_keeps_the_local_result_when_the_cloud_does_no_better(): void
    {
        config(['ocr.escalate_to_cloud' => true]);

        Http::fake(['*' => Http::response(self::interaction(['confidence' => 0]))]);

        $document = $this->makeDocument('certificate', 'scan.jpg');

        $this->runPipeline($document);

        $this->assertSame('tesseract', $document->refresh()->extraction->extracted_fields['extracted_by']);
    }

    public function test_a_rate_limited_escalation_does_not_discard_the_local_result(): void
    {
        config(['ocr.escalate_to_cloud' => true]);

        Http::fake(['*' => Http::response('rate limited', 429)]);

        $document = $this->makeDocument('certificate', 'scan.jpg');

        // Must not throw: the local pass already happened, and losing it to
        // retry a bonus second opinion is the wrong trade.
        $this->runPipeline($document);

        $this->assertSame('tesseract', $document->refresh()->extraction->extracted_fields['extracted_by']);
    }

    public function test_a_document_that_yielded_nothing_is_marked_failed_for_a_re_scan(): void
    {
        Http::fake(['*' => Http::response(self::interaction(['confidence' => 10]))]);

        $document = $this->makeDocument('cv', 'cv.pdf');

        $this->runPipeline($document);

        $this->assertSame('failed', $document->refresh()->ocr_status);
    }

    public function test_a_weak_but_readable_document_asks_for_review_rather_than_a_re_scan(): void
    {
        Http::fake(['*' => Http::response(self::interaction(['profession' => 'Nurse', 'confidence' => 35]))]);

        $document = $this->makeDocument('cv', 'cv.pdf');

        $this->runPipeline($document);

        $this->assertSame('needs_review', $document->refresh()->ocr_status);
    }

    // --- Retry and re-scan -------------------------------------------------

    public function test_a_failed_document_can_be_run_again_over_the_same_file(): void
    {
        Bus::fake([ProcessDocumentOcr::class]);
        $user = $this->candidate();
        $document = CandidateProfileResolver::resolve($user)->documents()->create([
            'type' => 'cv', 'file_path' => 'documents/cv.pdf', 'ocr_status' => 'failed',
        ]);

        $this->postJson("/api/candidate/documents/{$document->id}/retry")
            ->assertSuccessful()
            ->assertJsonPath('ocr_status', 'pending');

        Bus::assertDispatched(ProcessDocumentOcr::class);
    }

    public function test_a_document_still_being_scanned_cannot_be_retried(): void
    {
        Bus::fake([ProcessDocumentOcr::class]);
        $user = $this->candidate();
        $document = CandidateProfileResolver::resolve($user)->documents()->create([
            'type' => 'cv', 'file_path' => 'documents/cv.pdf', 'ocr_status' => 'processing',
        ]);

        $this->postJson("/api/candidate/documents/{$document->id}/retry")->assertStatus(409);

        Bus::assertNotDispatched(ProcessDocumentOcr::class);
    }

    public function test_re_scanning_replaces_the_file_and_keeps_the_document_id(): void
    {
        Storage::fake('local');
        Bus::fake([ProcessDocumentOcr::class]);

        $user = $this->candidate();
        Storage::disk('local')->put('documents/old.jpg', 'BLURRY');
        $document = CandidateProfileResolver::resolve($user)->documents()->create([
            'type' => 'cv', 'file_path' => 'documents/old.jpg', 'ocr_status' => 'failed',
        ]);

        $this->postJson("/api/candidate/documents/{$document->id}/rescan", [
            'file' => UploadedFile::fake()->create('sharp.pdf', 30, 'application/pdf'),
        ])->assertSuccessful()->assertJsonPath('id', $document->id);

        $document->refresh();

        $this->assertNotSame('documents/old.jpg', $document->file_path);
        $this->assertSame('pending', $document->ocr_status);
        Storage::disk('local')->assertMissing('documents/old.jpg');
        Bus::assertDispatched(ProcessDocumentOcr::class);
    }

    // --- Helpers -----------------------------------------------------------

    private function candidate(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    /** @param array<string, mixed> $fields */
    private function documentWithFields(User $user, array $fields): Document
    {
        $document = CandidateProfileResolver::resolve($user)->documents()->create([
            'type' => 'cv',
            'file_path' => 'documents/cv.pdf',
            'ocr_status' => 'completed',
        ]);

        $document->extraction()->create(['extracted_fields' => $fields, 'confidence' => 90]);

        return $document;
    }

    private function makeDocument(string $type, string $filename): Document
    {
        Storage::fake('local');
        Storage::disk('local')->put("documents/{$filename}", 'FILE');

        $user = User::factory()->create();

        return CandidateProfileResolver::resolve($user)->documents()->create([
            'type' => $type,
            'file_path' => "documents/{$filename}",
            'ocr_status' => 'pending',
        ]);
    }

    private function runPipeline(Document $document): void
    {
        (new ProcessDocumentOcr($document->id))->handle(
            app(TesseractOcrService::class),
            app(DocumentFieldExtractor::class),
            app(GeminiCvExtractor::class),
        );
    }

    /** @param  array<string, mixed>  $payload @return array<string, mixed> */
    private static function interaction(array $payload): array
    {
        return [
            'steps' => [
                ['type' => 'model_output', 'content' => [['type' => 'text', 'text' => json_encode($payload)]]],
            ],
        ];
    }
}
