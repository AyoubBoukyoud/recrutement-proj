<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\Ocr\DocumentFieldExtractor;
use App\Services\Ocr\GeminiCvExtractor;
use App\Services\Ocr\TesseractOcrService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ProcessDocumentOcr implements ShouldQueue
{
    use Queueable;

    private const CONFIDENCE_THRESHOLD = 60;

    public function __construct(private readonly int $documentId) {}

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
            : $this->viaTesseract($ocr, $extractor, $absolutePath);

        $document->extraction()->updateOrCreate([], [
            'extracted_fields' => $result['fields'],
            'confidence' => $result['confidence'],
        ]);

        $document->update([
            'ocr_status' => $result['confidence'] >= self::CONFIDENCE_THRESHOLD ? 'completed' : 'failed',
        ]);
    }

    /**
     * Gemini handles CVs, and anything in PDF form regardless of type —
     * Tesseract cannot read PDFs at all, so without Gemini those extract
     * nothing. Photographed certificates stay on Tesseract, which is free
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
            'fields' => $fields + ['raw_text' => $result['text'], 'extracted_by' => 'tesseract'],
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
