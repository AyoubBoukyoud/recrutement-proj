<?php

namespace App\Services\LanguageTest;

/**
 * Whole numbers as German words, written the way German writes them — one
 * compound word below a million ("achtunddreißig", "zweitausendvierzehn").
 *
 * Speech recognition prints numbers as digits ("Zimmer 12-18") while a
 * read-aloud text may spell them out ("zwölf bis achtzehn"); comparing the
 * two word by word would cost a candidate points for reading perfectly.
 */
class GermanNumbers
{
    private const ONES = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
        'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];

    private const TENS = [2 => 'zwanzig', 3 => 'dreißig', 4 => 'vierzig', 5 => 'fünfzig', 6 => 'sechzig', 7 => 'siebzig', 8 => 'achtzig', 9 => 'neunzig'];

    public static function words(int $n): string
    {
        if ($n < 0 || $n >= 1_000_000) {
            return (string) $n;
        }
        if ($n < 1000) {
            return self::belowThousand($n, true);
        }

        $thousands = intdiv($n, 1000);
        $rest = $n % 1000;

        return ($thousands === 1 ? 'ein' : self::belowThousand($thousands, false)).'tausend'.($rest ? self::belowThousand($rest, true) : '');
    }

    private static function belowThousand(int $n, bool $standalone): string
    {
        if ($n === 0) {
            return 'null';
        }

        $hundreds = intdiv($n, 100);
        $rest = $n % 100;
        $out = $hundreds ? ($hundreds === 1 ? 'ein' : self::ONES[$hundreds]).'hundert' : '';

        if ($rest === 0) {
            return $out;
        }
        if ($rest === 1) {
            // "eins" alone, "ein" inside a compound (hunderteins is the exception).
            return $out.($standalone ? 'eins' : 'ein');
        }
        if ($rest < 20) {
            return $out.self::ONES[$rest];
        }

        $unit = $rest % 10;
        $tens = self::TENS[intdiv($rest, 10)];

        return $out.($unit ? ($unit === 1 ? 'ein' : self::ONES[$unit]).'und'.$tens : $tens);
    }
}
