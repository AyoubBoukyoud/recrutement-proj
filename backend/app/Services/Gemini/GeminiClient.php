<?php

namespace App\Services\Gemini;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * The one place that talks to Gemini's interactions endpoint for structured
 * (JSON-schema) output. Used by the CV extractor, the exam item generator
 * and the exam graders, so retry semantics and response parsing cannot
 * drift between them.
 *
 * Contract of generate():
 *  - returns the model's output text ('' when the call succeeded but carried
 *    no text — the caller decides what an empty answer means);
 *  - returns null when the call failed for a reason that will not change on
 *    retry (400/401/403/404, unexpected exception) — already logged;
 *  - throws GeminiTransientFailure when the API was unreachable or busy, so
 *    a queued caller is retried.
 */
class GeminiClient
{
    public function isConfigured(): bool
    {
        return filled(config('services.gemini.key'));
    }

    /** A document, image or audio part, inlined as base64. */
    public static function filePart(string $type, string $absolutePath, string $mimeType): array
    {
        return [
            'type' => $type,
            'data' => base64_encode((string) file_get_contents($absolutePath)),
            'mime_type' => $mimeType,
        ];
    }

    public static function textPart(string $text): array
    {
        return ['type' => 'text', 'text' => $text];
    }

    /**
     * @param  list<array<string, mixed>>  $input  interaction input parts
     * @param  array<string, mixed>  $schema  JSON schema the answer must follow
     * @param  string  $label  prefix for log lines ("Gemini CV extraction")
     */
    public function generate(array $input, array $schema, string $label = 'Gemini'): ?string
    {
        try {
            $response = Http::withHeaders(['x-goog-api-key' => config('services.gemini.key')])
                ->timeout(config('services.gemini.timeout'))
                ->post(config('services.gemini.endpoint'), [
                    'model' => config('services.gemini.model'),
                    'input' => $input,
                    'response_format' => [
                        'type' => 'text',
                        'mime_type' => 'application/json',
                        'schema' => $schema,
                    ],
                ]);
        } catch (ConnectionException $e) {
            throw new GeminiTransientFailure("{$label} could not reach the API: ".$e->getMessage(), 0, $e);
        } catch (\Throwable $e) {
            Log::error("{$label} failed: ".$e->getMessage());

            return null;
        }

        if ($response->failed()) {
            $message = "{$label} returned ".$response->status().': '.$response->body();

            if (self::isTransient($response->status())) {
                throw new GeminiTransientFailure($message);
            }

            Log::error($message);

            return null;
        }

        return self::outputText($response->json() ?? []) ?? '';
    }

    /**
     * generate() and decode the JSON answer. Null when the call failed
     * permanently or the answer was not a JSON object (logged).
     *
     * @return array<string, mixed>|null
     */
    public function generateJson(array $input, array $schema, string $label = 'Gemini'): ?array
    {
        $text = $this->generate($input, $schema, $label);
        if ($text === null) {
            return null;
        }

        $decoded = json_decode($text, true);
        if (! is_array($decoded)) {
            Log::error("{$label}: output was not valid JSON.");

            return null;
        }

        return $decoded;
    }

    /**
     * Rate limiting and server-side faults are about the API's moment, not
     * the input. Everything else will fail identically on every retry.
     */
    public static function isTransient(int $status): bool
    {
        return $status === 429 || $status === 408 || $status >= 500;
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
    public static function outputText(array $body): ?string
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
}
