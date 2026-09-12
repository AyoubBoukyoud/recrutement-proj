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
    /** @var string[]|null */
    private ?array $installedLanguages = null;

    public function isAvailable(): bool
    {
        return Process::run('command -v '.$this->binary())->successful();
    }

    /**
     * @return array{text: string, confidence: int, languages: string[]}
     */
    public function extract(string $absolutePath): array
    {
        if (! $this->isAvailable()) {
            Log::warning('Tesseract OCR requested but the `tesseract` binary is not installed.');

            return ['text' => '', 'confidence' => 0, 'languages' => []];
        }

        $languages = $this->languages();
        $arguments = $languages === [] ? [] : ['-l', implode('+', $languages)];

        $textResult = Process::run([...$this->command($absolutePath), ...$arguments]);
        $tsvResult = Process::run([...$this->command($absolutePath), ...$arguments, 'tsv']);

        if (! $textResult->successful()) {
            Log::error('Tesseract OCR failed: '.$textResult->errorOutput());

            return ['text' => '', 'confidence' => 0, 'languages' => $languages];
        }

        return [
            'text' => trim($textResult->output()),
            'confidence' => $this->averageConfidence($tsvResult->output()),
            'languages' => $languages,
        ];
    }

    /**
     * Candidates upload documents in four languages, and without `-l`
     * Tesseract assumes English — which is why French, Arabic and German
     * scans came back as noise. Packs are OS-level installs, so the wanted
     * list is intersected with what is actually present rather than passed
     * blindly: naming a missing pack makes tesseract exit non-zero and lose
     * the whole page, including the parts it could have read.
     *
     * @return string[]
     */
    public function languages(): array
    {
        $wanted = array_values(array_filter((array) config('ocr.tesseract.languages', [])));
        if ($wanted === []) {
            return [];
        }

        $available = $this->installedLanguages();

        // Nothing enumerable (older builds print nothing useful) — trust the
        // config rather than silently dropping back to English.
        if ($available === []) {
            return $wanted;
        }

        foreach (array_diff($wanted, $available) as $missing) {
            Log::warning("Tesseract language pack '{$missing}' is not installed; documents in that language will OCR poorly.");
        }

        return array_values(array_intersect($wanted, $available));
    }

    /** @return string[] */
    private function command(string $absolutePath): array
    {
        return [$this->binary(), $absolutePath, 'stdout', '--psm', (string) config('ocr.tesseract.psm', '3')];
    }

    private function binary(): string
    {
        return (string) config('ocr.tesseract.binary', 'tesseract');
    }

    /** @return string[] */
    private function installedLanguages(): array
    {
        if ($this->installedLanguages !== null) {
            return $this->installedLanguages;
        }

        $result = Process::run([$this->binary(), '--list-langs']);
        if (! $result->successful()) {
            return $this->installedLanguages = [];
        }

        // First line is a header ("List of available languages (4):"); the
        // codes themselves never contain a space.
        $lines = array_map('trim', explode("\n", trim($result->output())));
        $lines = array_filter($lines, fn (string $line) => $line !== '' && ! str_contains($line, ' '));

        return $this->installedLanguages = array_values($lines);
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
