<?php

namespace Tests\Feature;

use App\Jobs\ProcessDocumentOcr;
use App\Services\CandidateProfileResolver;
use App\Models\Document;
use App\Models\User;
use App\Services\Ocr\GeminiCvExtractor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GeminiCvExtractionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.model' => 'gemini-3.6-flash',
            'services.gemini.endpoint' => 'https://generativelanguage.googleapis.com/v1beta/interactions',
        ]);
    }

    public function test_it_extracts_profile_fields_from_a_pdf_cv(): void
    {
        Http::fake([
            '*' => Http::response(self::interaction([
                    'full_name' => 'Yassin El Amrani',
                    'first_name' => 'Yassin',
                    'last_name' => 'El Amrani',
                    'email' => 'yassin@example.com',
                    'phone' => '+212600112233',
                    'profession' => 'Nurse',
                    'specialization' => 'ICU',
                    'years_of_experience' => 7,
                    'date_of_birth' => '',
                    'educations' => [
                        [
                            'level' => 'bachelor',
                            'field' => 'Nursing',
                            'institution' => 'Institut Supérieur',
                            'started_at' => '2012-09-01',
                            'ended_at' => '2015-06-30',
                        ],
                    ],
                    'languages' => [
                        ['language' => 'fr', 'cefr_level' => 'C1'],
                        ['language' => 'de', 'cefr_level' => 'B1'],
                    ],
                    'confidence' => 88,
            ])),
        ]);

        $document = $this->makeDocument('cv', 'cv.pdf');

        (new ProcessDocumentOcr($document->id))->handle(
            app(\App\Services\Ocr\TesseractOcrService::class),
            app(\App\Services\Ocr\DocumentFieldExtractor::class),
            app(GeminiCvExtractor::class),
        );

        $document->refresh();
        $fields = $document->extraction->extracted_fields;

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame(88, $document->extraction->confidence);
        $this->assertSame('Nurse', $fields['profession']);
        $this->assertSame(7, $fields['years_of_experience']);
        $this->assertSame('gemini', $fields['extracted_by']);
        $this->assertSame('bachelor', $fields['educations'][0]['level']);
        $this->assertCount(2, $fields['languages']);

        // Empty strings mean "not present" and must not be stored as answers.
        $this->assertArrayNotHasKey('date_of_birth', $fields);
    }

    public function test_it_sends_the_pdf_inline_with_the_api_key(): void
    {
        Http::fake(['*' => Http::response(self::interaction(['confidence' => 50]))]);

        $document = $this->makeDocument('cv', 'cv.pdf', 'PDFBYTES');

        (new ProcessDocumentOcr($document->id))->handle(
            app(\App\Services\Ocr\TesseractOcrService::class),
            app(\App\Services\Ocr\DocumentFieldExtractor::class),
            app(GeminiCvExtractor::class),
        );

        Http::assertSent(function (Request $request) {
            $body = $request->data();

            return $request->url() === 'https://generativelanguage.googleapis.com/v1beta/interactions'
                && $request->hasHeader('x-goog-api-key', 'test-key')
                && $body['model'] === 'gemini-3.6-flash'
                && $body['input'][0]['type'] === 'document'
                && $body['input'][0]['mime_type'] === 'application/pdf'
                && base64_decode($body['input'][0]['data']) === 'PDFBYTES'
                && $body['response_format']['mime_type'] === 'application/json';
        });
    }

    public function test_a_failed_call_marks_the_document_failed_without_throwing(): void
    {
        Http::fake(['*' => Http::response('rate limited', 429)]);

        $document = $this->makeDocument('cv', 'cv.pdf');

        (new ProcessDocumentOcr($document->id))->handle(
            app(\App\Services\Ocr\TesseractOcrService::class),
            app(\App\Services\Ocr\DocumentFieldExtractor::class),
            app(GeminiCvExtractor::class),
        );

        $document->refresh();

        $this->assertSame('failed', $document->ocr_status);
        $this->assertSame(0, $document->extraction->confidence);
    }

    public function test_it_falls_back_to_tesseract_when_no_key_is_configured(): void
    {
        config(['services.gemini.key' => null]);
        Http::fake();

        $document = $this->makeDocument('cv', 'cv.pdf');

        (new ProcessDocumentOcr($document->id))->handle(
            app(\App\Services\Ocr\TesseractOcrService::class),
            app(\App\Services\Ocr\DocumentFieldExtractor::class),
            app(GeminiCvExtractor::class),
        );

        Http::assertNothingSent();
        $this->assertSame('tesseract', $document->refresh()->extraction->extracted_fields['extracted_by']);
    }

    public function test_image_certificates_still_use_tesseract(): void
    {
        Http::fake();

        $document = $this->makeDocument('certificate', 'scan.jpg');

        (new ProcessDocumentOcr($document->id))->handle(
            app(\App\Services\Ocr\TesseractOcrService::class),
            app(\App\Services\Ocr\DocumentFieldExtractor::class),
            app(GeminiCvExtractor::class),
        );

        Http::assertNothingSent();
        $this->assertSame('tesseract', $document->refresh()->extraction->extracted_fields['extracted_by']);
    }

    /**
     * The real /v1beta/interactions response nests the model's text under
     * steps[type=model_output]; there is no top-level `output_text`, despite
     * the documentation describing one. Faking the documented shape would let
     * a broken parser pass.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private static function interaction(array $payload): array
    {
        return [
            'id' => 'v1_test',
            'status' => 'completed',
            'model' => 'gemini-3.6-flash',
            'steps' => [
                ['type' => 'thought', 'signature' => 'redacted'],
                ['type' => 'model_output', 'content' => [['type' => 'text', 'text' => json_encode($payload)]]],
            ],
        ];
    }

    public function test_it_still_reads_a_flat_output_text_if_one_is_ever_returned(): void
    {
        Http::fake(['*' => Http::response(['output_text' => json_encode(['profession' => 'Nurse', 'confidence' => 70])])]);

        $document = $this->makeDocument('cv', 'cv.pdf');

        (new ProcessDocumentOcr($document->id))->handle(
            app(\App\Services\Ocr\TesseractOcrService::class),
            app(\App\Services\Ocr\DocumentFieldExtractor::class),
            app(GeminiCvExtractor::class),
        );

        $this->assertSame('Nurse', $document->refresh()->extraction->extracted_fields['profession']);
    }

    public function test_it_rejects_malformed_values_and_lowers_confidence(): void
    {
        // Shapes actually seen from the live API: a date field that ran away
        // into prose, an invented enum, and an impossible experience count.
        Http::fake(['*' => Http::response(self::interaction([
            'profession' => 'Nurse',
            'years_of_experience' => 999,
            'educations' => [[
                'level' => 'phd',
                'institution' => 'Institut Supérieur',
                'started_at' => '2012-01-01'.str_repeat(' reasoning about the format', 200),
            ]],
            'confidence' => 100,
        ]))]);

        $document = $this->makeDocument('cv', 'cv.pdf');

        (new ProcessDocumentOcr($document->id))->handle(
            app(\App\Services\Ocr\TesseractOcrService::class),
            app(\App\Services\Ocr\DocumentFieldExtractor::class),
            app(GeminiCvExtractor::class),
        );

        $document->refresh();
        $fields = $document->extraction->extracted_fields;

        $this->assertSame('Nurse', $fields['profession']);
        $this->assertArrayNotHasKey('years_of_experience', $fields);
        $this->assertArrayNotHasKey('started_at', $fields['educations'][0]);
        $this->assertArrayNotHasKey('level', $fields['educations'][0]);
        $this->assertSame('Institut Supérieur', $fields['educations'][0]['institution']);

        // Self-reported 100 must not survive a degenerate response.
        $this->assertSame(40, $document->extraction->confidence);
        $this->assertSame('failed', $document->ocr_status);
    }

    public function test_it_rejects_a_date_that_is_shaped_right_but_impossible(): void
    {
        Http::fake(['*' => Http::response(self::interaction([
            'date_of_birth' => '1994-02-31',
            'profession' => 'Nurse',
            'confidence' => 90,
        ]))]);

        $document = $this->makeDocument('cv', 'cv.pdf');

        (new ProcessDocumentOcr($document->id))->handle(
            app(\App\Services\Ocr\TesseractOcrService::class),
            app(\App\Services\Ocr\DocumentFieldExtractor::class),
            app(GeminiCvExtractor::class),
        );

        $this->assertArrayNotHasKey('date_of_birth', $document->refresh()->extraction->extracted_fields);
    }

    private function makeDocument(string $type, string $filename, string $contents = 'FILE'): Document
    {
        Storage::fake('public');
        Storage::disk('public')->put("documents/{$filename}", $contents);

        $user = User::create(['phone' => '+2126'.random_int(10000000, 99999999)]);
        $profile = CandidateProfileResolver::resolve($user);

        return $profile->documents()->create([
            'type' => $type,
            'file_path' => "documents/{$filename}",
            'ocr_status' => 'pending',
        ]);
    }
}
