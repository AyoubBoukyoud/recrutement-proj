<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\Ocr\DocumentFieldExtractor;
use App\Services\Ocr\GeminiCvExtractor;
use App\Services\Ocr\TesseractOcrService;
use App\Services\Ocr\TransientOcrFailure;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProcessDocumentOcr implements ShouldQueue
{
    use Queueable;

    /**
     * A rate limit or a 503 says nothing about the document, so the extractors
     * throw TransientOcrFailure and the attempt is repeated instead of
     * condemning a readable CV on one unlucky moment.
     */
    public int $tries = 3;

    /** Keys that describe the extraction rather than the candidate. */
    private const METADATA_KEYS = ['extracted_by', 'raw_text', 'escalated_to_cloud', 'ocr_languages'];

    public function __construct(private readonly int $documentId) {}

    /** Seconds between attempts — long enough for a rate-limit window to clear. */
    public function backoff(): array
    {
        return [30, 120];
    }

    public function handle(
        TesseractOcrService $ocr,
        DocumentFieldExtractor $extractor,
        GeminiCvExtractor $gemini,
    ): void {
        $document = Document::find($this->documentId);
        if (! $document) {
            return;
        }

        $document->update(['ocr_status' => 'processing']);

        $absolutePath = Storage::disk('public')->path($document->file_path);
        $mimeType = $this->mimeType($document->file_path);

        $result = $this->shouldUseGemini($document, $mimeType, $gemini)
            ? $this->viaGemini($gemini, $absolutePath, $mimeType)
            : $this->escalateIfWeak(
                $this->viaTesseract($ocr, $extractor, $absolutePath),
                $gemini,
                $absolutePath,
                $mimeType,
            );

        $document->extraction()->updateOrCreate([], [
            'extracted_fields' => $result['fields'],
            'confidence' => $result['confidence'],
        ]);

        $document->update(['ocr_status' => $this->statusFor($result)]);
    }

    /**
     * Every attempt has been used up, or something non-retryable escaped.
     * Without this the document sits on `processing` forever and the app spins
     * a "scanning…" indicator at a candidate who is waiting for nothing.
     */
    public function failed(?Throwable $exception): void
    {
        Log::error("Document OCR gave up on document {$this->documentId}: ".($exception?->getMessage() ?? 'unknown'));

        Document::where('id', $this->documentId)->update(['ocr_status' => 'failed']);
    }

    /**
     * Gemini handles CVs, and anything in PDF form regardless of type —
     * Tesseract cannot read PDFs at all, so without Gemini those extract
     * nothing. Photographed certificates start on Tesseract, which is free
     * and adequate for pulling raw text off an image.
     */
    private function shouldUseGemini(Document $document, string $mimeType, GeminiCvExtractor $gemini): bool
    {
        if (! $gemini->isConfigured()) {
            return false;
        }

        return $document->type === 'cv' || $mimeType === 'application/pdf';
    }

    /**
     * The paid second opinion. A phone photo taken in bad light is the normal
     * reason a local pass comes back weak, and it is exactly the case the
     * cloud model handles well — so rather than dropping the candidate
     * straight into manual entry, the document is sent up and the better of
     * the two results is kept.
     *
     * @param  array{fields: array<string, mixed>, confidence: int}  $local
     * @return array{fields: array<string, mixed>, confidence: int}
     */
    private function escalateIfWeak(
        array $local,
        GeminiCvExtractor $gemini,
        string $absolutePath,
        string $mimeType,
    ): array {
        if ($local['confidence'] >= $this->threshold()) {
            return $local;
        }
        if (! config('ocr.escalate_to_cloud') || ! $gemini->isConfigured()) {
            return $local;
        }

        try {
            $cloud = $this->viaGemini($gemini, $absolutePath, $mimeType);
        } catch (TransientOcrFailure $e) {
            // The second opinion is a bonus pass. Letting it throw would retry
            // the whole job and throw away the text already read off the page,
            // which is worse than simply not having the second opinion.
            Log::warning('Document OCR escalation unavailable, keeping the local result: '.$e->getMessage());

            return $local;
        }

        if ($cloud['confidence'] <= $local['confidence']) {
            // Keep the local text: it is still the only thing read off the page.
            return $local;
        }

        $cloud['fields']['escalated_to_cloud'] = true;

        return $cloud;
    }

    /**
     * `failed` means the page could not be read and needs re-scanning.
     * `needs_review` means something was read but not confidently — the
     * candidate corrects a pre-filled form rather than starting from nothing.
     * Collapsing the two, as this used to, told everyone to re-photograph a
     * document that had already given up most of its content.
     *
     * @param  array{fields: array<string, mixed>, confidence: int}  $result
     */
    private function statusFor(array $result): string
    {
        if ($result['confidence'] >= $this->threshold()) {
            return 'completed';
        }

        return $this->hasCandidateFields($result['fields']) ? 'needs_review' : 'failed';
    }

    /** @param  array<string, mixed>  $fields */
    private function hasCandidateFields(array $fields): bool
    {
        return array_diff_key($fields, array_flip(self::METADATA_KEYS)) !== [];
    }

    private function threshold(): int
    {
        return (int) config('ocr.confidence_threshold', 60);
    }

    /**
     * @return array{fields: array<string, mixed>, confidence: int}
     */
    private function viaGemini(GeminiCvExtractor $gemini, string $absolutePath, string $mimeType): array
    {
        $result = $gemini->extract($absolutePath, $mimeType);

        return [
            'fields' => $result['fields'] + ['extracted_by' => 'gemini'],
            'confidence' => $result['confidence'],
        ];
    }

    /**
     * @return array{fields: array<string, mixed>, confidence: int}
     */
    private function viaTesseract(
        TesseractOcrService $ocr,
        DocumentFieldExtractor $extractor,
        string $absolutePath,
    ): array {
        $result = $ocr->extract($absolutePath);
        $fields = $result['text'] !== '' ? $extractor->extract($result['text']) : [];

        return [
            'fields' => $fields + [
                'raw_text' => $result['text'],
                'extracted_by' => 'tesseract',
                'ocr_languages' => $result['languages'],
            ],
            'confidence' => $result['confidence'],
        ];
    }

    private function mimeType(string $path): string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            default => 'image/jpeg',
        };
    }
}
