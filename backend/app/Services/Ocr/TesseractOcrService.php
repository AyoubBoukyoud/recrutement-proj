<?php

namespace App\Services\Ocr;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

/**
 * Thin wrapper around the local `tesseract` CLI (free, no API key). If the
 * binary isn't installed, extraction fails gracefully (confidence 0) instead
 * of crashing the job, so document upload still works end-to-end and the
 * document just falls into the "needs manual entry" state until the binary
 * is installed on this machine.
 */
class TesseractOcrService
{
    public function isAvailable(): bool
    {
        return Process::run('command -v tesseract')->successful();
    }

    /**
     * @return array{text: string, confidence: int}
     */
    public function extract(string $absolutePath): array
    {
        if (! $this->isAvailable()) {
            Log::warning('Tesseract OCR requested but the `tesseract` binary is not installed.');

            return ['text' => '', 'confidence' => 0];
        }

        $textResult = Process::run(['tesseract', $absolutePath, 'stdout', '--psm', '3']);
        $tsvResult = Process::run(['tesseract', $absolutePath, 'stdout', '--psm', '3', 'tsv']);

        if (! $textResult->successful()) {
            Log::error('Tesseract OCR failed: '.$textResult->errorOutput());

            return ['text' => '', 'confidence' => 0];
        }

        return [
            'text' => trim($textResult->output()),
            'confidence' => $this->averageConfidence($tsvResult->output()),
        ];
    }

    private function averageConfidence(string $tsv): int
    {
        $lines = explode("\n", trim($tsv));
        array_shift($lines); // header row

        $scores = [];
        foreach ($lines as $line) {
            $columns = explode("\t", $line);
            $conf = (float) ($columns[10] ?? -1);
            if ($conf >= 0) {
                $scores[] = $conf;
            }
        }

        if (empty($scores)) {
            return 0;
        }

        return (int) round(array_sum($scores) / count($scores));
    }
}
