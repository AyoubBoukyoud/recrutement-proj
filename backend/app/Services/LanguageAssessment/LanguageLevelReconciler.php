<?php

namespace App\Services\LanguageAssessment;

use App\Models\CandidateLanguage;
use App\Models\CandidateProfile;
use Illuminate\Support\Carbon;

/**
 * Decides what a candidate's level actually is once two sources disagree.
 *
 * The rule, in order:
 *
 *   1. A certificate wins and is never overwritten. It is the only evidence
 *      an employer can verify; a 45-second recording does not get to demote it.
 *   2. Otherwise the effective level is the *higher* of what the candidate
 *      declared and what the assessment predicted. A noisy room, a clipped
 *      microphone or a nervous first attempt must not silently delete a
 *      candidate's own account of themselves — which is exactly what the
 *      unconditional overwrite used to do, including when it predicted A1.
 *   3. Both values are kept and shown side by side, tagged with which source
 *      produced the effective one, and a gap of two bands or more is flagged
 *      so a recruiter can see the disagreement rather than inherit it silently.
 */
class LanguageLevelReconciler
{
    private const ORDER = ['A1' => 1, 'A2' => 2, 'B1' => 3, 'B2' => 4, 'C1' => 5, 'C2' => 6];

    /** Bands apart before a self-declared level and an AI estimate are "in conflict". */
    public const DISCREPANCY_BANDS = 2;

    public function applyAssessment(CandidateProfile $profile, string $language, string $predicted): CandidateLanguage
    {
        $row = $profile->languages()->firstOrNew(['language' => $language]);

        // Older rows predate the split columns: whatever is on a self-declared
        // row was, by definition, self-declared.
        if ($row->self_declared_cefr === null && $row->source !== 'ai_assessed') {
            $row->self_declared_cefr = $row->cefr_level;
        }

        $row->ai_cefr = $predicted;
        $row->ai_assessed_at = Carbon::now();

        if ($row->source === 'certified') {
            // Recorded, not applied — the certificate stands.
            $row->save();

            return $row;
        }

        $this->resolveEffective($row);
        $row->save();

        return $row;
    }

    /**
     * The candidate editing their own declared level, from the profile builder.
     * Runs through the same rule so the two write paths cannot drift: a
     * declaration does not erase an assessment any more than the reverse.
     */
    public function applyDeclaration(CandidateLanguage $row, ?string $declared): CandidateLanguage
    {
        $row->self_declared_cefr = $declared;

        // `source` is derived from the evidence on file, never from which
        // endpoint happened to write the row.
        if ($row->certificate_document_id) {
            $row->cefr_level = $declared;
            $row->source = 'certified';
        } else {
            $this->resolveEffective($row);
        }

        $row->save();

        return $row;
    }

    /** Higher of the two sources wins; `source` names which one that was. */
    private function resolveEffective(CandidateLanguage $row): void
    {
        $declared = $row->self_declared_cefr;
        $predicted = $row->ai_cefr;

        if ($predicted !== null && ($declared === null || self::rank($predicted) >= self::rank($declared))) {
            $row->cefr_level = $predicted;
            $row->source = 'ai_assessed';

            return;
        }

        $row->cefr_level = $declared;
        $row->source = 'self_declared';
    }

    /** 0 for an unknown or absent level, so comparisons never blow up. */
    public static function rank(?string $level): int
    {
        return self::ORDER[$level] ?? 0;
    }

    public static function isDiscrepant(?string $declared, ?string $predicted): bool
    {
        if ($declared === null || $predicted === null) {
            return false;
        }

        return abs(self::rank($declared) - self::rank($predicted)) >= self::DISCREPANCY_BANDS;
    }
}
