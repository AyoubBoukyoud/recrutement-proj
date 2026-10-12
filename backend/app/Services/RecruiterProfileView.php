<?php

namespace App\Services;

use App\Models\CandidateProfile;
use App\Models\Document;
use App\Models\User;

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
    private const RELATIONS = ['educations', 'languages.certificateDocument', 'skills', 'documents', 'languageAssessments'];

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

    /**
     * A dossier is only discoverable once both compliance consents are on
     * record, and only while the account behind it is in good standing: a
     * candidate who has asked for their account to be deleted (the 30-day
     * window) or whom an administrator has blocked disappears from recruiters
     * at once, instead of staying searchable until the purge.
     */
    public static function isVisible(CandidateProfile $profile): bool
    {
        if (! ($profile->terms_consent_at && $profile->cndp_consent_at && ! $profile->cndp_withdrawn_at && ! $profile->visibility_paused_at)) {
            return false;
        }

        // Looked up without attaching `user` to the profile: RecruiterProfileView::for()
        // serialises whatever relations are loaded, and the candidate's phone
        // and email must not ride along with this check.
        if ($profile->relationLoaded('user')) {
            $user = $profile->user;

            return $user !== null && $user->status === 'active' && $user->deletion_requested_at === null;
        }

        return User::query()
            ->whereKey($profile->user_id)
            ->where('status', 'active')
            ->whereNull('deletion_requested_at')
            ->exists();
    }
}
