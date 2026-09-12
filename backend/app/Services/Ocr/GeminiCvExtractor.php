<?php

namespace App\Services\Ocr;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Reads a CV with Gemini and returns fields shaped like the candidate profile.
 *
 * This exists because Tesseract cannot read PDFs at all — it only handles
 * images — and a CV is the one document candidates almost always upload as a
 * PDF. Gemini takes the file directly, so there is no separate OCR step and
 * no rasterising, and it understands layout well enough to tell an education
 * entry from an employment one.
 *
 * Like TesseractOcrService, a missing key or a failed call degrades to
 * confidence 0 rather than throwing, so document upload keeps working and the
 * document simply falls back to manual entry.
 */
class GeminiCvExtractor
{
    /** Only what the profile builder can actually pre-fill. */
    private const SCHEMA = [
        'type' => 'object',
        'properties' => [
            'full_name' => ['type' => 'string', 'description' => 'Candidate full name as written'],
            'first_name' => ['type' => 'string'],
            'last_name' => ['type' => 'string'],
            'email' => ['type' => 'string'],
            'phone' => ['type' => 'string', 'description' => 'In international format when possible'],
            'date_of_birth' => ['type' => 'string', 'maxLength' => 10, 'description' => 'YYYY-MM-DD, empty if absent'],
            'profession' => ['type' => 'string', 'description' => 'e.g. Nurse, Electrician'],
            'specialization' => ['type' => 'string', 'description' => 'e.g. ICU'],
            'years_of_experience' => ['type' => 'integer'],
            'educations' => [
                'type' => 'array',
                'items' => [
                    'type' => 'object',
                    'properties' => [
                        'level' => [
                            'type' => 'string',
                            'enum' => ['general_school', 'vocational', 'professional_training', 'bachelor', 'master', 'other'],
                        ],
                        'field' => ['type' => 'string'],
                        'institution' => ['type' => 'string'],
                        'started_at' => ['type' => 'string', 'maxLength' => 10, 'description' => 'YYYY-MM-DD, empty if unknown'],
                        'ended_at' => ['type' => 'string', 'maxLength' => 10, 'description' => 'YYYY-MM-DD, empty if ongoing'],
                    ],
                    'required' => ['level', 'field', 'institution', 'started_at', 'ended_at'],
                ],
            ],
            'languages' => [
                'type' => 'array',
                'items' => [
                    'type' => 'object',
                    'properties' => [
                        'language' => ['type' => 'string', 'enum' => ['fr', 'ar', 'en', 'de']],
                        'cefr_level' => ['type' => 'string', 'enum' => ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']],
                    ],
                    'required' => ['language'],
                ],
            ],
            'confidence' => [
                'type' => 'integer',
                'description' => '0-100: how legible the document was and how sure you are of these fields',
            ],
        ],
        // Nearly everything is required so the model emits the key (empty when
        // the CV does not say). With only `confidence` required it silently
        // omitted name, email, phone and profession that were plainly present.
        'required' => [
            'full_name', 'first_name', 'last_name', 'email', 'phone',
            'date_of_birth', 'profession', 'specialization', 'years_of_experience',
            'educations', 'languages', 'confidence',
        ],
    ];

    /**
     * Every field must contain a value and nothing else. The explicit ban on
     * reasoning inside a field is not decorative: given a rule to apply, the
     * model has been observed writing its deliberation into a date field and
     * looping there for kilobytes.
     */
    private const PROMPT = <<<'TXT'
    Extract the candidate's details from this CV.

    Output rules — follow exactly:
    - Every field contains a value and nothing else. Never write explanation,
      reasoning, restated instructions, or commentary inside a field.
    - Dates are exactly 10 characters long, in YYYY-MM-DD form. When only a
      year or month is known, use the first day of that period. When a date is
      absent or unclear, return an empty string.
    - Only report what the document states. Return an empty value rather than
      inferring, rounding, or translating a qualification into something else.
    - `languages` covers only French, Arabic, English and German. Map a stated
      proficiency to the closest CEFR level; omit the level if the CV gives no
      basis for one.
    - `years_of_experience` is total professional experience in whole years.
    - Set `confidence` low when the document is hard to read, is not a CV, or
      you had to guess at the structure.
    TXT;

    /** Longer than any real name, institution, or job title on a CV. */
    private const MAX_STRING = 200;

    private const ENUMS = [
        'level' => ['general_school', 'vocational', 'professional_training', 'bachelor', 'master', 'other'],
        'language' => ['fr', 'ar', 'en', 'de'],
        'cefr_level' => ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    ];

    private const DATE_KEYS = ['date_of_birth', 'started_at', 'ended_at'];

    public function isConfigured(): bool
    {
        return filled(config('services.gemini.key'));
    }

    /**
     * Rate limiting and server-side faults are about the API's moment, not the
     * document. Everything else — 400, 401, 403, 404 — will fail identically
     * on every retry, so it degrades to confidence 0 instead of burning the
     * queue's attempts.
     */
    private function isTransient(int $status): bool
    {
        return $status === 429 || $status === 408 || $status >= 500;
    }

    /**
     * @return array{fields: array<string, mixed>, confidence: int}
     */
    public function extract(string $absolutePath, string $mimeType): array
    {
        if (! $this->isConfigured()) {
            Log::warning('Gemini CV extraction requested but GEMINI_API_KEY is not set.');

            return $this->empty();
        }

        if (! is_readable($absolutePath)) {
            Log::error("Gemini CV extraction: unreadable file at {$absolutePath}.");

            return $this->empty();
        }

        try {
            $response = Http::withHeaders(['x-goog-api-key' => config('services.gemini.key')])
                ->timeout(config('services.gemini.timeout'))
                ->post(config('services.gemini.endpoint'), [
                    'model' => config('services.gemini.model'),
                    'input' => [
                        [
                            'type' => 'document',
                            'data' => base64_encode(file_get_contents($absolutePath)),
                            'mime_type' => $mimeType,
                        ],
                        ['type' => 'text', 'text' => self::PROMPT],
                    ],
                    'response_format' => [
                        'type' => 'text',
                        'mime_type' => 'application/json',
                        'schema' => self::SCHEMA,
                    ],
                ]);
        } catch (ConnectionException $e) {
            // The request never completed — nothing was learned about the
            // document, so this is the queue's problem, not the candidate's.
            throw new TransientOcrFailure('Gemini CV extraction could not reach the API: '.$e->getMessage(), 0, $e);
        } catch (\Throwable $e) {
            Log::error('Gemini CV extraction failed: '.$e->getMessage());

            return $this->empty();
        }

        if ($response->failed()) {
            $message = 'Gemini CV extraction returned '.$response->status().': '.$response->body();

            if ($this->isTransient($response->status())) {
                throw new TransientOcrFailure($message);
            }

            Log::error($message);

            return $this->empty();
        }

        return $this->parse($this->outputText($response->json() ?? []));
    }

    /**
     * Pull the model's text out of an interactions response.
     *
     * The payload is a list of steps — reasoning ones first, then the answer —
     * so the text lives at steps[type=model_output].content[type=text].text.
     * `output_text` is checked first only because the documentation describes
     * a flat field of that name; live responses do not include one.
     *
     * @param  array<string, mixed>  $body
     */
    private function outputText(array $body): ?string
    {
        if (is_string($body['output_text'] ?? null)) {
            return $body['output_text'];
        }

        foreach ($body['steps'] ?? [] as $step) {
            if (($step['type'] ?? null) !== 'model_output') {
                continue;
            }
            foreach ($step['content'] ?? [] as $part) {
                if (($part['type'] ?? null) === 'text' && is_string($part['text'] ?? null)) {
                    return $part['text'];
                }
            }
        }

        return null;
    }

    /**
     * @return array{fields: array<string, mixed>, confidence: int}
     */
    private function parse(?string $outputText): array
    {
        if (! is_string($outputText) || trim($outputText) === '') {
            Log::error('Gemini CV extraction: response contained no model output text.');

            return $this->empty();
        }

        $decoded = json_decode($outputText, true);

        if (! is_array($decoded)) {
            Log::error('Gemini CV extraction: output_text was not valid JSON.');

            return $this->empty();
        }

        // The schema is advisory, not a guarantee — clamp rather than trust.
        $confidence = max(0, min(100, (int) ($decoded['confidence'] ?? 0)));
        unset($decoded['confidence']);

        $this->rejected = 0;
        $fields = $this->pruneEmpty($this->sanitize($decoded));

        if ($this->rejected > 0) {
            // A malformed value means the response degenerated, whatever the
            // model claimed about itself. Drop below the job's threshold so
            // the document lands in "enter manually" instead of looking clean.
            Log::warning("Gemini CV extraction: rejected {$this->rejected} malformed value(s).");
            $confidence = min($confidence, 40);
        }

        return ['fields' => $fields, 'confidence' => $confidence];
    }

    private int $rejected = 0;

    /**
     * Drop values the model had no business returning.
     *
     * Structured output is best-effort, not enforced: dates come back as
     * prose, enums as invented variants, and a single string can run to
     * kilobytes when generation loops. Anything that fails its shape is
     * discarded rather than stored, since a wrong value pre-fills the review
     * screen with something that looks deliberate.
     *
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    private function sanitize(array $fields): array
    {
        $clean = [];

        foreach ($fields as $key => $value) {
            if (is_array($value)) {
                $clean[$key] = $this->sanitize($value);

                continue;
            }

            if (is_string($value)) {
                $value = trim($value);

                if (mb_strlen($value) > self::MAX_STRING) {
                    $this->rejected++;

                    continue;
                }
                if (in_array($key, self::DATE_KEYS, true) && $value !== '' && ! $this->isIsoDate($value)) {
                    $this->rejected++;

                    continue;
                }
                if (isset(self::ENUMS[$key]) && $value !== '' && ! in_array($value, self::ENUMS[$key], true)) {
                    $this->rejected++;

                    continue;
                }
            }

            if ($key === 'years_of_experience' && (! is_int($value) || $value < 0 || $value > 70)) {
                $this->rejected++;

                continue;
            }

            $clean[$key] = $value;
        }

        return $clean;
    }

    private function isIsoDate(string $value): bool
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            return false;
        }

        [$y, $m, $d] = array_map('intval', explode('-', $value));

        return checkdate($m, $d, $y);
    }

    /**
     * Empty strings are how the model says "not present"; storing them would
     * pre-fill the review screen with blanks that look like real answers.
     *
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    private function pruneEmpty(array $fields): array
    {
        $pruned = [];

        foreach ($fields as $key => $value) {
            if (is_array($value)) {
                $value = $this->pruneEmpty($value);
            }
            if ($value === null || $value === '' || $value === []) {
                continue;
            }
            $pruned[$key] = $value;
        }

        // Dropping an entry from a list would leave a gap, and a gapped array
        // encodes to a JSON object instead of an array.
        return array_is_list($fields) ? array_values($pruned) : $pruned;
    }

    /**
     * @return array{fields: array<string, mixed>, confidence: int}
     */
    private function empty(): array
    {
        return ['fields' => [], 'confidence' => 0];
    }
}
