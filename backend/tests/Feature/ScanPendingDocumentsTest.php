<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use App\Services\Ocr\GeminiCvExtractor;
use App\Services\Ocr\TesseractOcrService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The catch-up path for uploads no queue worker ever picked up — the state
 * three real documents were sitting in, showing "Queued for scanning…" to a
 * candidate with nothing behind it.
 */
class ScanPendingDocumentsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        Storage::fake('public');

        // The extractors themselves are covered by GeminiCvExtractionTest;
        // what matters here is which documents get picked up.
        $gemini = $this->createMock(GeminiCvExtractor::class);
        $gemini->method('isConfigured')->willReturn(true);
        $gemini->method('extract')->willReturn(['fields' => ['full_name' => 'Yassin'], 'confidence' => 90]);
        $this->app->instance(GeminiCvExtractor::class, $gemini);

        $tesseract = $this->createMock(TesseractOcrService::class);
        $tesseract->method('isAvailable')->willReturn(false);
        $this->app->instance(TesseractOcrService::class, $tesseract);
    }

    private function document(string $status, int $minutesAgo): Document
    {
        $profile = CandidateProfileResolver::resolve(User::factory()->create());

        $document = $profile->documents()->create([
            'type' => 'cv',
            'file_path' => 'documents/cv.pdf',
            'ocr_status' => $status,
        ]);

        // `updated_at` is what "waiting since" means, and creating the row set it.
        $document->forceFill(['updated_at' => now()->subMinutes($minutesAgo)])->saveQuietly();

        return $document;
    }

    public function test_it_scans_a_document_nothing_ever_picked_up(): void
    {
        $stranded = $this->document('pending', 30);

        $this->artisan('documents:scan-pending')->assertSuccessful();

        $this->assertSame('completed', $stranded->fresh()->ocr_status);
        $this->assertSame(90, $stranded->fresh()->extraction->confidence);
    }

    public function test_it_rescues_a_document_stuck_mid_scan(): void
    {
        // What a worker killed mid-job leaves behind — just as stuck, and the
        // job that was going to finish it is gone.
        $abandoned = $this->document('processing', 30);

        $this->artisan('documents:scan-pending')->assertSuccessful();

        $this->assertSame('completed', $abandoned->fresh()->ocr_status);
    }

    public function test_it_leaves_a_fresh_upload_to_the_queue(): void
    {
        // A worker may have claimed this seconds ago; scanning it here would
        // duplicate the work and burn a second API call.
        $fresh = $this->document('pending', 1);

        $this->artisan('documents:scan-pending')->assertSuccessful();

        $this->assertSame('pending', $fresh->fresh()->ocr_status);
    }

    public function test_it_leaves_documents_that_are_already_done(): void
    {
        $done = $this->document('completed', 60);
        $failed = $this->document('failed', 60);

        $this->artisan('documents:scan-pending')
            ->expectsOutputToContain('Nothing waiting.')
            ->assertSuccessful();

        $this->assertSame('completed', $done->fresh()->ocr_status);
        $this->assertSame('failed', $failed->fresh()->ocr_status);
    }

    public function test_the_batch_size_is_bounded(): void
    {
        $this->document('pending', 30);
        $this->document('pending', 30);
        $this->document('pending', 30);

        $this->artisan('documents:scan-pending', ['--limit' => 2])->assertSuccessful();

        $this->assertSame(1, Document::where('ocr_status', 'pending')->count());
    }
}
