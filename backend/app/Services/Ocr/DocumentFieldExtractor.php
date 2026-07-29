<?php

namespace App\Services\Ocr;

/**
 * Deliberately simple regex/heuristic field extraction — an MVP stand-in for
 * a real document-understanding model. Good enough to pre-fill a review
 * screen the candidate confirms, not meant to be authoritative.
 */
class DocumentFieldExtractor
{
    /**
     * @return array<string, mixed>
     */
    public function extract(string $text): array
    {
        return [
            'dates' => $this->matchAll('/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/', $text),
            'email' => $this->matchFirst('/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/', $text),
            'phone' => $this->matchFirst('/\+?\d[\d\s().-]{7,}\d/', $text),
            'probable_name' => $this->guessName($text),
        ];
    }

    private function matchFirst(string $pattern, string $text): ?string
    {
        return preg_match($pattern, $text, $m) ? trim($m[0]) : null;
    }

    /** @return string[] */
    private function matchAll(string $pattern, string $text): array
    {
        preg_match_all($pattern, $text, $m);

        return array_values(array_unique($m[0]));
    }

    private function guessName(string $text): ?string
    {
        foreach (explode("\n", $text) as $line) {
            $line = trim($line);
            // A short, mostly-alphabetic line near the top of the document,
            // in Title Case or ALL CAPS, is a reasonable name guess for a CV.
            if ($line === '' || mb_strlen($line) > 40 || str_contains($line, '@')) {
                continue;
            }
            if (preg_match('/^[\p{L}\'-]+(\s+[\p{L}\'-]+){1,3}$/u', $line)) {
                return $line;
            }
        }

        return null;
    }
}
