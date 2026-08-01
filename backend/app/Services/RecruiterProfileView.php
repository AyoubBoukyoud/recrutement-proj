<?php

namespace App\Services;

use App\Models\CandidateProfile;
use App\Models\Document;

/**
 * The dossier exactly as a recruiter receives it.
 *
 * Shared by the recruiter endpoint and the candidate's own "preview" so the
 * preview cannot quietly drift into showing something different from what is
 * actually published.
 *
 * Contact details are deliberately absent: they are released only through
 * RecruiterShortlistController::revealContact, which records who asked.
 */
class RecruiterProfileView
{
    private const RELATIONS = ['educations', 'languages.certificateDocument', 'documents', 'languageAssessments'];

    /** @return array<string, mixed> */
    public static function for(CandidateProfile $profile): array
    {
        $profile->load(self::RELATIONS);

        $data = $profile->toArray();
        $data['documents'] = self::documents($profile);

        return $data;
    }

    /**
     * Documents as evidence, not as pipeline state.
     *
     * `ocr_status` and the raw extraction used to be handed straight to
     * recruiters, who would read "failed" as a judgement on the candidate
     * rather than on our scanner. What a recruiter needs is what the document
     * is, whether anything corroborates it, and a link that opens it.
     *
     * @return list<array<string, mixed>>
     */
    private static function documents(CandidateProfile $profile): array
    {
        // A certificate counts as verified when a language row points at it:
        // the candidate attached it as proof of a specific level, which is a
        // stronger claim than an unattached file sitting in the dossier.
        $attested = $profile->languages
            ->pluck('certificate_document_id')
            ->filter()
            ->all();

        return $profile->documents
            ->map(fn (Document $document) => [
                'id' => $document->id,
                'type' => $document->type,
                'file_path' => $document->file_path,
                'url' => $document->url,
                'verified' => in_array($document->id, $attested, true),
                'uploaded_at' => $document->created_at,
            ])
            ->values()
            ->all();
    }

    /** A dossier is only discoverable once both compliance consents are on record. */
    public static function isVisible(CandidateProfile $profile): bool
    {
        return (bool) ($profile->terms_consent_at && $profile->cndp_consent_at);
    }
}
