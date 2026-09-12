<?php

namespace App\Services\Ocr;

/**
 * Heuristic field extraction from raw OCR text — the non-Gemini path.
 *
 * This will never match a document-understanding model, and it is not trying
 * to: everything it produces lands on a review screen the candidate confirms.
 * But "email, phone and a guessed name" left the Tesseract path with nothing
 * to pre-fill the profile from, so it now reads the same shapes Gemini does
 * (profession, experience, education, languages, date of birth) using labels
 * and keywords in the four languages this pipeline actually sees.
 *
 * Anything ambiguous is omitted. A wrong value pre-fills the review screen
 * with something that looks deliberate, which is worse than an empty field.
 */
class DocumentFieldExtractor
{
    /**
     * Label prefixes that introduce a value on the same line, per field.
     * Arabic labels are included because Tesseract now reads Arabic scans.
     *
     * @var array<string, string[]>
     */
    private const LABELS = [
        'date_of_birth' => [
            'date of birth', 'born on', 'born', 'birth date', 'birthdate',
            'date de naissance', 'né le', 'née le', 'ne le', 'nee le',
            'geburtsdatum', 'geboren am', 'geboren',
            'تاريخ الازدياد', 'تاريخ الميلاد', 'الازدياد',
        ],
        'profession' => [
            'profession', 'occupation', 'job title', 'position', 'current role', 'role',
            'poste', 'métier', 'metier', 'fonction', 'emploi',
            'beruf', 'berufsbezeichnung', 'stelle',
            'المهنة', 'الوظيفة',
        ],
        'specialization' => [
            'specialization', 'specialisation', 'speciality', 'specialty',
            'spécialité', 'specialite', 'spécialisation', 'specialisation',
            'fachrichtung', 'schwerpunkt', 'التخصص',
        ],
    ];

    /**
     * Education levels keyed by the qualification words that imply them, most
     * specific first — "master" must be tested before "licence" so a line
     * naming both is not filed under the lower one.
     *
     * @var array<string, string[]>
     */
    private const EDUCATION_LEVELS = [
        'master' => ['master', 'mastère', 'mastere', 'magistère', 'magistere', 'm.sc', 'msc', 'mba', 'diplôme d\'ingénieur', 'ingénieur d\'état', 'staatsexamen', 'ماستر', 'ماجستير'],
        'bachelor' => ['bachelor', 'licence', 'licencié', 'licencie', 'b.sc', 'bsc', 'bachelorstudium', 'إجازة', 'ليسانس', 'بكالوريوس'],
        'professional_training' => ['professional training', 'formation professionnelle', 'technicien spécialisé', 'technicien specialise', 'bts', 'dut', 'deust', 'ausbildung', 'fachschule', 'تكوين مهني', 'تقني متخصص'],
        'vocational' => ['vocational', 'apprenticeship', 'apprentissage', 'cap ', 'bep ', 'berufsschule', 'lehre', 'تدريب مهني'],
        'general_school' => ['baccalauréat', 'baccalaureat', 'bachelier', 'high school', 'secondary school', 'abitur', 'gymnasium', 'باكالوريا', 'الثانوية'],
    ];

    /**
     * Words that mark a line as naming an institution rather than a diploma.
     *
     * @var string[]
     */
    private const INSTITUTION_WORDS = [
        'university', 'school', 'institute', 'institut', 'faculty', 'college', 'academy', 'centre', 'center',
        'université', 'universite', 'école', 'ecole', 'faculté', 'faculte', 'lycée', 'lycee', 'centre de formation',
        'universität', 'universitat', 'hochschule', 'fachhochschule', 'schule', 'akademie',
        'جامعة', 'معهد', 'كلية', 'مدرسة', 'المدرسة',
    ];

    /** @var array<string, string[]> */
    private const LANGUAGE_NAMES = [
        'fr' => ['french', 'français', 'francais', 'französisch', 'franzosisch', 'الفرنسية', 'فرنسية'],
        'ar' => ['arabic', 'arabe', 'arabisch', 'العربية', 'عربية'],
        'en' => ['english', 'anglais', 'englisch', 'الإنجليزية', 'الانجليزية', 'إنجليزية'],
        'de' => ['german', 'allemand', 'deutsch', 'الألمانية', 'ألمانية', 'الالمانية'],
    ];

    /**
     * Proficiency wordings mapped to the CEFR band they most nearly mean.
     * Deliberately coarse — a CV saying "fluent" is not evidence of C2.
     *
     * @var array<string, string[]>
     */
    private const PROFICIENCY = [
        'C2' => ['native', 'mother tongue', 'langue maternelle', 'maternelle', 'muttersprache', 'اللغة الأم', 'لغة أم'],
        'C1' => ['fluent', 'proficient', 'courant', 'courante', 'fließend', 'fliessend', 'verhandlungssicher', 'بطلاقة'],
        'B2' => ['advanced', 'very good', 'avancé', 'avance', 'très bon', 'tres bon', 'fortgeschritten', 'sehr gut', 'متقدم', 'جيد جدا'],
        'B1' => ['intermediate', 'good', 'intermédiaire', 'intermediaire', 'bon niveau', 'mittelstufe', 'gut', 'متوسط', 'جيد'],
        'A2' => ['elementary', 'basic', 'élémentaire', 'elementaire', 'notions', 'grundkenntnisse', 'ابتدائي', 'أساسي'],
        'A1' => ['beginner', 'débutant', 'debutant', 'anfänger', 'anfanger', 'مبتدئ'],
    ];

    /** Longest run of text still plausibly a name, job title or institution. */
    private const MAX_VALUE = 120;

    /**
     * @return array<string, mixed>
     */
    public function extract(string $text): array
    {
        $lines = $this->lines($text);

        return array_filter([
            'dates' => $this->matchAll('/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/', $text),
            'email' => $this->matchFirst('/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/', $text),
            'phone' => $this->matchFirst('/\+?\d[\d\s().-]{7,}\d/', $text),
            'probable_name' => $this->guessName($lines),
            'date_of_birth' => $this->dateOfBirth($lines),
            'profession' => $this->labelled($lines, 'profession'),
            'specialization' => $this->labelled($lines, 'specialization'),
            'years_of_experience' => $this->yearsOfExperience($text),
            'educations' => $this->educations($lines),
            'languages' => $this->languages($lines),
        ], fn ($value) => $value !== null && $value !== []);
    }

    /** @return string[] */
    private function lines(string $text): array
    {
        $lines = preg_split('/\R/u', $text) ?: [];

        return array_values(array_filter(array_map('trim', $lines), fn (string $line) => $line !== ''));
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

    /** @param string[] $lines */
    private function guessName(array $lines): ?string
    {
        foreach ($lines as $line) {
            // A short, mostly-alphabetic line near the top of the document,
            // in Title Case or ALL CAPS, is a reasonable name guess for a CV.
            if (mb_strlen($line) > 40 || str_contains($line, '@')) {
                continue;
            }
            if (preg_match('/^[\p{L}\'-]+(\s+[\p{L}\'-]+){1,3}$/u', $line)) {
                return $line;
            }
        }

        return null;
    }

    /**
     * The value sitting after a "Profession:" style label, in any of the four
     * languages. Only same-line values are read — following the label onto the
     * next line picks up the next section heading far too often.
     *
     * @param  string[]  $lines
     */
    private function labelled(array $lines, string $field): ?string
    {
        foreach ($lines as $line) {
            $value = $this->valueAfterLabel($line, self::LABELS[$field]);
            if ($value !== null && preg_match('/\p{L}/u', $value)) {
                return $value;
            }
        }

        return null;
    }

    /** @param  string[]  $labels */
    private function valueAfterLabel(string $line, array $labels): ?string
    {
        $lower = $this->fold($line);

        foreach ($labels as $label) {
            $position = mb_strpos($lower, $this->fold($label));
            // Past the start of the line it is prose mentioning the word, not
            // a field label introducing a value.
            if ($position === false || $position > 40) {
                continue;
            }

            $rest = mb_substr($line, $position + mb_strlen($label));

            // A separator is what distinguishes "Profession: Nurse" from a
            // sentence that merely contains the word. A single space is not
            // one — without this, "mentions a profession in passing" reported
            // a profession of "in passing".
            if (preg_match('/^(?:\s*[:：\-–—>|]\s*|[ \t]{2,})(\S.*)$/u', $rest, $matched) !== 1) {
                continue;
            }

            $value = trim($matched[1]);

            return $value !== '' && mb_strlen($value) <= self::MAX_VALUE ? $value : null;
        }

        return null;
    }

    /** @param  string[]  $lines */
    private function dateOfBirth(array $lines): ?string
    {
        foreach ($lines as $line) {
            $value = $this->valueAfterLabel($line, self::LABELS['date_of_birth']);
            if ($value === null) {
                continue;
            }

            $iso = $this->toIsoDate($value);
            if ($iso !== null) {
                return $iso;
            }
        }

        return null;
    }

    /**
     * Normalise the date wordings a CV actually uses. Day-first is assumed for
     * the ambiguous d/m/Y — this pipeline's documents are Moroccan, French and
     * German, all of which write the day first.
     */
    private function toIsoDate(string $value): ?string
    {
        if (preg_match('/(\d{4})-(\d{2})-(\d{2})/', $value, $m)) {
            return checkdate((int) $m[2], (int) $m[3], (int) $m[1]) ? "{$m[1]}-{$m[2]}-{$m[3]}" : null;
        }

        if (preg_match('/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/', $value, $m)) {
            $year = (int) $m[3];
            $year += $year < 100 ? ($year > 30 ? 1900 : 2000) : 0;

            return checkdate((int) $m[2], (int) $m[1], $year)
                ? sprintf('%04d-%02d-%02d', $year, (int) $m[2], (int) $m[1])
                : null;
        }

        return null;
    }

    /**
     * "7 years of experience", "7 ans d'expérience professionnelle",
     * "12 Jahre Berufserfahrung", "5 سنوات خبرة". The word order differs per
     * language — French qualifies after the noun, German compounds it — so the
     * connector between the count and the noun is matched loosely and the
     * noun itself strictly.
     */
    private function yearsOfExperience(string $text): ?int
    {
        $pattern = '/(\d{1,2})\s*\+?\s*(?:years?|ans?|années?|annees?|jahren?|سنوات|سنة)'
            .'[\s\p{P}]{0,4}(?:(?:d[’\']|de|of|an|in)\s*)?(?:professional\s+|work\s+)?'
            .'(?:experiences?|expériences?|berufserfahrung|erfahrung|خبرة)/iu';

        if (preg_match($pattern, $text, $m) !== 1) {
            return null;
        }

        $years = (int) $m[1];

        return $years > 0 && $years <= 70 ? $years : null;
    }

    /**
     * One entry per qualification line found, with the nearest institution
     * line below it. Institutions on their own are ignored: a level is what
     * the profile builder needs, and an institution without one is not an
     * education entry the candidate can use.
     *
     * @param  string[]  $lines
     * @return array<int, array<string, string>>
     */
    private function educations(array $lines): array
    {
        $entries = [];

        foreach ($lines as $index => $line) {
            $level = $this->levelFor($line);
            if ($level === null) {
                continue;
            }

            $entry = ['level' => $level];

            $institution = $this->institutionNear($lines, $index);
            if ($institution !== null) {
                $entry['institution'] = $institution;
            }

            $year = $this->matchFirst('/\b(19|20)\d{2}\b/', $line);
            if ($year !== null) {
                $entry['ended_at'] = "{$year}-01-01";
            }

            // The qualification line itself is the closest thing to a field of
            // study the raw text offers, once the year noise is stripped.
            $field = trim(preg_replace('/\b(19|20)\d{2}\b|[|•·]/u', ' ', $line) ?? '');
            $field = trim(preg_replace('/\s{2,}/u', ' ', $field) ?? '');
            if ($field !== '' && mb_strlen($field) <= self::MAX_VALUE) {
                $entry['field'] = $field;
            }

            $entries[] = $entry;

            if (count($entries) >= 6) {
                break;
            }
        }

        return $entries;
    }

    private function levelFor(string $line): ?string
    {
        $lower = $this->fold($line);

        foreach (self::EDUCATION_LEVELS as $level => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($lower, $this->fold($keyword))) {
                    return $level;
                }
            }
        }

        return null;
    }

    /** @param  string[]  $lines */
    private function institutionNear(array $lines, int $index): ?string
    {
        // Same line first, then the two below — a CV puts the school directly
        // under the diploma far more often than above it.
        foreach ([$index, $index + 1, $index + 2] as $candidate) {
            $line = $lines[$candidate] ?? null;
            if ($line === null || mb_strlen($line) > self::MAX_VALUE) {
                continue;
            }

            $lower = $this->fold($line);
            foreach (self::INSTITUTION_WORDS as $word) {
                if (str_contains($lower, $this->fold($word))) {
                    return $line;
                }
            }
        }

        return null;
    }

    /**
     * Languages named anywhere in the document, with a level only when the
     * same line states one — as a CEFR token or a proficiency word.
     *
     * @param  string[]  $lines
     * @return array<int, array<string, string>>
     */
    private function languages(array $lines): array
    {
        $found = [];

        foreach ($lines as $line) {
            $lower = $this->fold($line);

            foreach (self::LANGUAGE_NAMES as $code => $names) {
                if (isset($found[$code])) {
                    continue;
                }
                foreach ($names as $name) {
                    if (! str_contains($lower, $this->fold($name))) {
                        continue;
                    }

                    $found[$code] = array_filter([
                        'language' => $code,
                        'cefr_level' => $this->levelIn($line),
                    ]);

                    continue 2;
                }
            }
        }

        return array_values($found);
    }

    private function levelIn(string $line): ?string
    {
        if (preg_match('/\b([ABC][12])\b/u', mb_strtoupper($line), $m) === 1) {
            return $m[1];
        }

        $lower = $this->fold($line);
        foreach (self::PROFICIENCY as $level => $wordings) {
            foreach ($wordings as $wording) {
                if (str_contains($lower, $this->fold($wording))) {
                    return $level;
                }
            }
        }

        return null;
    }

    /**
     * Lowercase and strip accents so "Spécialité", "SPECIALITE" and
     * "specialite" all match one keyword — OCR drops diacritics constantly.
     *
     * Every replacement is one character for one character: `valueAfterLabel`
     * finds an offset in the folded string and slices the original at it, so a
     * fold that changed the length would cut the value in the wrong place.
     */
    private function fold(string $value): string
    {
        $lower = mb_strtolower($value);

        return strtr($lower, [
            'à' => 'a', 'á' => 'a', 'â' => 'a', 'ä' => 'a', 'ã' => 'a',
            'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e',
            'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'ö' => 'o', 'õ' => 'o',
            'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c', 'ñ' => 'n',
        ]);
    }
}
