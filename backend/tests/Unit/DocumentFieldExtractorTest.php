<?php

namespace Tests\Unit;

use App\Services\Ocr\DocumentFieldExtractor;
use PHPUnit\Framework\TestCase;

/**
 * The non-Gemini path. Everything here lands on a review screen the candidate
 * confirms, so the bar is "useful pre-fill", not "authoritative" — but a wrong
 * value is worse than an absent one, which is what the negative cases guard.
 */
class DocumentFieldExtractorTest extends TestCase
{
    private DocumentFieldExtractor $extractor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->extractor = new DocumentFieldExtractor;
    }

    public function test_it_reads_a_french_cv(): void
    {
        $fields = $this->extractor->extract(<<<'TXT'
        Yassin El Amrani
        Date de naissance : 02/04/1996
        Profession : Infirmier
        Spécialité: Réanimation
        7 ans d'expérience professionnelle

        FORMATION
        Licence en Soins Infirmiers 2015
        Institut Supérieur des Professions Infirmières

        LANGUES
        Français : courant
        Allemand : B1
        Arabe : langue maternelle
        TXT);

        $this->assertSame('Yassin El Amrani', $fields['probable_name']);
        $this->assertSame('1996-04-02', $fields['date_of_birth']);
        $this->assertSame('Infirmier', $fields['profession']);
        $this->assertSame('Réanimation', $fields['specialization']);
        $this->assertSame(7, $fields['years_of_experience']);

        $this->assertSame('bachelor', $fields['educations'][0]['level']);
        $this->assertSame('2015-01-01', $fields['educations'][0]['ended_at']);
        $this->assertStringContainsString('Institut Supérieur', $fields['educations'][0]['institution']);

        $levels = array_column($fields['languages'], 'cefr_level', 'language');
        $this->assertSame('C1', $levels['fr']);
        $this->assertSame('B1', $levels['de']);
        $this->assertSame('C2', $levels['ar']);
    }

    public function test_it_reads_a_german_cv(): void
    {
        $fields = $this->extractor->extract(<<<'TXT'
        Lebenslauf
        Geburtsdatum: 15.03.1990
        Beruf: Krankenpfleger
        12 Jahre Berufserfahrung

        AUSBILDUNG
        Ausbildung zum Gesundheits- und Krankenpfleger 2012
        Hochschule München

        SPRACHEN
        Deutsch - fließend
        Englisch - Grundkenntnisse
        TXT);

        $this->assertSame('1990-03-15', $fields['date_of_birth']);
        $this->assertSame('Krankenpfleger', $fields['profession']);
        $this->assertSame(12, $fields['years_of_experience']);
        $this->assertSame('professional_training', $fields['educations'][0]['level']);
        $this->assertSame('Hochschule München', $fields['educations'][0]['institution']);

        $levels = array_column($fields['languages'], 'cefr_level', 'language');
        $this->assertSame('C1', $levels['de']);
        $this->assertSame('A2', $levels['en']);
    }

    public function test_it_reads_an_arabic_cv(): void
    {
        $fields = $this->extractor->extract(<<<'TXT'
        تاريخ الازدياد: 20/07/1998
        المهنة: ممرض
        5 سنوات خبرة
        اللغات
        العربية: اللغة الأم
        الفرنسية: متقدم
        TXT);

        $this->assertSame('1998-07-20', $fields['date_of_birth']);
        $this->assertSame('ممرض', $fields['profession']);
        $this->assertSame(5, $fields['years_of_experience']);

        $levels = array_column($fields['languages'], 'cefr_level', 'language');
        $this->assertSame('C2', $levels['ar']);
        $this->assertSame('B2', $levels['fr']);
    }

    public function test_a_master_line_is_not_filed_as_a_bachelor(): void
    {
        $fields = $this->extractor->extract("Master en Sciences Infirmières, Licence obtenue en 2015\nUniversité Mohammed V");

        $this->assertSame('master', $fields['educations'][0]['level']);
    }

    public function test_it_omits_what_it_cannot_read_rather_than_guessing(): void
    {
        $fields = $this->extractor->extract(<<<'TXT'
        Some prose that mentions a profession in passing and a school somewhere.
        Date de naissance : inconnue
        TXT);

        $this->assertArrayNotHasKey('date_of_birth', $fields);
        $this->assertArrayNotHasKey('profession', $fields);
        $this->assertArrayNotHasKey('years_of_experience', $fields);
        $this->assertArrayNotHasKey('educations', $fields);
    }

    public function test_an_impossible_birth_date_is_dropped(): void
    {
        $fields = $this->extractor->extract('Date de naissance : 31/02/1994');

        $this->assertArrayNotHasKey('date_of_birth', $fields);
    }

    public function test_a_language_named_without_a_level_carries_no_level(): void
    {
        $fields = $this->extractor->extract("LANGUES\nAnglais");

        $this->assertSame([['language' => 'en']], $fields['languages']);
    }

    public function test_it_still_extracts_the_contact_details_it_always_did(): void
    {
        $fields = $this->extractor->extract("Yassin El Amrani\nyassin@example.com\n+212 600 112 233");

        $this->assertSame('yassin@example.com', $fields['email']);
        $this->assertSame('+212 600 112 233', $fields['phone']);
        $this->assertSame('Yassin El Amrani', $fields['probable_name']);
    }
}
