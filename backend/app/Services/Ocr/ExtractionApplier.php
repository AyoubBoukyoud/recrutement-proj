<?php

namespace App\Services\Ocr;

use App\Models\CandidateProfile;
use App\Models\Document;
use App\Services\LanguageAssessment\LanguageLevelReconciler;

/**
 * Step 3 of the pipeline: what the candidate confirmed on the review screen
 * becomes their profile.
 *
 * Until this existed the review screen was a dead end — the candidate checked
 * every extracted field, pressed confirm, and the values stayed sealed inside
 * `document_extractions.extracted_fields` while the profile stayed empty.
 *
 * The default is to *fill*, not to overwrite: anything the candidate has
 * already typed wins over anything a CV was read to say, and the skipped
 * values are reported back so the app can offer to apply them explicitly
 * rather than deciding silently.
 */
class ExtractionApplier
{
    /** Extracted key => profile column, for the plain scalar fields. */
    private const SCALARS = [
        'first_name' => 'first_name',
        'last_name' => 'last_name',
        'date_of_birth' => 'date_of_birth',
        'profession' => 'profession',
        'specialization' => 'specialization',
        'years_of_experience' => 'years_of_experience',
    ];

    private const EDUCATION_LEVELS = [
        'general_school', 'vocational', 'professional_training', 'bachelor', 'master', 'other',
    ];

    private const LANGUAGES = ['fr', 'ar', 'en', 'de'];

    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    public function __construct(private readonly LanguageLevelReconciler $reconciler) {}

    /**
     * @return array{applied: array<int, string>, skipped: array<int, string>}
     */
    public function apply(Document $document, bool $overwrite = false): array
    {
        $fields = $document->extraction?->extracted_fields ?? [];
        $profile = $document->candidateProfile;

        if ($fields === [] || ! $profile) {
            return ['applied' => [], 'skipped' => []];
        }

        $applied = [];
        $skipped = [];

        $this->applyScalars($profile, $this->withSplitName($fields), $overwrite, $applied, $skipped);
        $this->applyEducations($profile, $fields, $applied, $skipped);
        $this->applyLanguages($profile, $fields, $overwrite, $applied, $skipped);

        return ['applied' => $applied, 'skipped' => $skipped];
    }

    /**
     * Gemini returns first/last separately; the Tesseract path only ever
     * guesses one whole name off a line. Split it so both engines can fill the
     * same two columns.
     *
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    private function withSplitName(array $fields): array
    {
        if (filled($fields['first_name'] ?? null) && filled($fields['last_name'] ?? null)) {
            return $fields;
        }

        $whole = trim((string) ($fields['full_name'] ?? $fields['probable_name'] ?? ''));
        $parts = preg_split('/\s+/u', $whole, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if (count($parts) < 2) {
            return $fields;
        }

        // First token is the given name; everything after it is the family
        // name, which in Morocco is routinely two words.
        return $fields + [
            'first_name' => array_shift($parts),
            'last_name' => implode(' ', $parts),
        ];
    }

    /**
     * @param  array<string, mixed>  $fields
     * @param  array<int, string>  $applied
     * @param  array<int, string>  $skipped
     */
    private function applyScalars(
        CandidateProfile $profile,
        array $fields,
        bool $overwrite,
        array &$applied,
        array &$skipped,
    ): void {
        $changes = [];

        foreach (self::SCALARS as $key => $column) {
            $value = $this->scalarValue($key, $fields[$key] ?? null);
            if ($value === null) {
                continue;
            }

            if (filled($profile->{$column}) && ! $overwrite) {
                // Only worth mentioning when it actually disagrees.
                if ((string) $this->normalize($profile->{$column}) !== (string) $value) {
                    $skipped[] = $column;
                }

                continue;
            }

            $changes[$column] = $value;
            $applied[] = $column;
        }

        if ($changes !== []) {
            $profile->update($changes);
        }
    }

    private function normalize(mixed $value): mixed
    {
        return $value instanceof \DateTimeInterface ? $value->format('Y-m-d') : $value;
    }

    /** Re-validate here: these values came from a model, and were then handed back by a client. */
    private function scalarValue(string $key, mixed $value): string|int|null
    {
        return match ($key) {
            'years_of_experience' => $this->yearsValue($value),
            'date_of_birth' => $this->dateValue($value),
            default => $this->stringValue($value),
        };
    }

    private function yearsValue(mixed $value): ?int
    {
        if (! is_numeric($value)) {
            return null;
        }

        $years = (int) $value;

        return $years > 0 && $years <= 70 ? $years : null;
    }

    private function dateValue(mixed $value): ?string
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        $date = substr((string) $value, 0, 10);

        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1 && strtotime($date) !== false ? $date : null;
    }

    private function stringValue(mixed $value): ?string
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        $string = trim((string) $value);

        return $string !== '' && mb_strlen($string) <= 255 ? $string : null;
    }

    /**
     * Education entries are added, never replaced — a CV listing one degree
     * should not delete the two the candidate typed in by hand. Re-confirming
     * the same document is therefore idempotent rather than duplicating.
     *
     * @param  array<string, mixed>  $fields
     * @param  array<int, string>  $applied
     * @param  array<int, string>  $skipped
     */
    private function applyEducations(
        CandidateProfile $profile,
        array $fields,
        array &$applied,
        array &$skipped,
    ): void {
        $entries = is_array($fields['educations'] ?? null) ? $fields['educations'] : [];
        if ($entries === []) {
            return;
        }

        $existing = $profile->educations()->get()
            ->map(fn ($education) => $this->educationKey($education->level, $education->field, $education->institution))
            ->all();

        $added = 0;

        foreach ($entries as $entry) {
            if (! is_array($entry) || ! in_array($entry['level'] ?? null, self::EDUCATION_LEVELS, true)) {
                continue;
            }

            $row = [
                'level' => $entry['level'],
                'field' => $this->stringValue($entry['field'] ?? null),
                'institution' => $this->stringValue($entry['institution'] ?? null),
                'started_at' => $this->dateValue($entry['started_at'] ?? null),
                'ended_at' => $this->dateValue($entry['ended_at'] ?? null),
            ];

            $key = $this->educationKey($row['level'], $row['field'], $row['institution']);
            if (in_array($key, $existing, true)) {
                $skipped[] = 'educations';

                continue;
            }

            $profile->educations()->create($row);
            $existing[] = $key;
            $added++;
        }

        if ($added > 0) {
            $applied[] = 'educations';
        }

        $skipped = array_values(array_unique($skipped));
    }

    private function educationKey(?string $level, ?string $field, ?string $institution): string
    {
        return mb_strtolower(trim(($level ?? '').'|'.($field ?? '').'|'.($institution ?? '')));
    }

    /**
     * A level read off the candidate's own CV is a *self-declared* level —
     * the same standing as one they typed. It therefore goes through the
     * reconciler, so it can neither demote a certificate nor silently replace
     * a level the candidate already stated.
     *
     * @param  array<string, mixed>  $fields
     * @param  array<int, string>  $applied
     * @param  array<int, string>  $skipped
     */
    private function applyLanguages(
        CandidateProfile $profile,
        array $fields,
        bool $overwrite,
        array &$applied,
        array &$skipped,
    ): void {
        $entries = is_array($fields['languages'] ?? null) ? $fields['languages'] : [];
        if ($entries === []) {
            return;
        }

        $touched = false;

        foreach ($entries as $entry) {
            if (! is_array($entry) || ! in_array($entry['language'] ?? null, self::LANGUAGES, true)) {
                continue;
            }

            $level = in_array($entry['cefr_level'] ?? null, self::LEVELS, true) ? $entry['cefr_level'] : null;
            if ($level === null) {
                continue;
            }

            $row = $profile->languages()->firstOrNew(['language' => $entry['language']]);

            if (filled($row->self_declared_cefr) && ! $overwrite) {
                if ($row->self_declared_cefr !== $level) {
                    $skipped[] = 'languages';
                }

                continue;
            }

            $this->reconciler->applyDeclaration($row, $level);
            $touched = true;
        }

        if ($touched) {
            $applied[] = 'languages';
        }

        $skipped = array_values(array_unique($skipped));
    }
}
