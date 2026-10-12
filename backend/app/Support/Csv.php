<?php

namespace App\Support;

/**
 * Cells for the CSV files the platform hands to people who open them in a
 * spreadsheet.
 *
 * Candidates and recruiters type their own names, professions, company names
 * and notes, and those end up in exports read by recruiters and
 * administrators. A cell that begins with `=`, `+`, `-`, `@`, a tab or a
 * carriage return is run as a formula by Excel and Sheets (`=HYPERLINK(...)`,
 * DDE) — a stranger's text executing on staff machines. A leading apostrophe
 * makes the application show the cell as plain text.
 *
 * Only for text a person typed. Machine-validated values (an E.164 phone,
 * dates, counts) are written as they are: the `+` of `+2126…` is data.
 */
final class Csv
{
    public static function cell(mixed $value): mixed
    {
        if (is_string($value) && $value !== '' && str_contains("=+-@\t\r", $value[0])) {
            return "'".$value;
        }

        return $value;
    }
}
