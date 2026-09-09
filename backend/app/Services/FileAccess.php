<?php

namespace App\Services;

use App\Models\CandidateProfile;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

/**
 * Single authorization gate for every private candidate file — CV/diploma/ID
 * documents, presentation video, language-assessment audio, complaint voice
 * notes — all stored on the `local` disk (config/filesystems.php), which
 * `php artisan storage:link` never exposes and which Laravel's built-in
 * ServeFile route (see FilesystemServiceProvider) refuses without a valid
 * signature.
 *
 * A stored path alone must never grant access: `temporaryUrl()` is only ever
 * called once the current viewer has already been checked against the
 * resource, and the signature it produces expires shortly after — a leaked
 * link stops working on its own rather than becoming a permanent bearer
 * token.
 */
class FileAccess
{
    private const EXPIRES_AFTER_MINUTES = 10;

    /**
     * CV, diploma, ID documents, presentation video, language-assessment
     * audio — the dossier's own evidence. Visible to the candidate who owns
     * it, an administrator, or a recruiter for whom this dossier is
     * discoverable (the same Terms+CNDP consent gate that governs recruiter
     * search — see RecruiterProfileView::isVisible). Matches the existing
     * product design: recruiters browse a candidate's documents as evidence
     * before spending a contact-reveal, not after.
     */
    public static function dossierUrl(?string $path, CandidateProfile $profile, ?User $viewer): ?string
    {
        if (! $path || ! self::canViewDossier($profile, $viewer)) {
            return null;
        }

        return self::sign($path);
    }

    /**
     * Complaint voice notes. Unlike dossier files, these are never
     * recruiter-visible — a complaint is a conversation between the
     * candidate who filed it and the administrators triaging it, not part of
     * what a recruiter evaluates.
     */
    public static function complaintUrl(?string $path, int $complainantUserId, ?User $viewer): ?string
    {
        if (! $path || ! $viewer) {
            return null;
        }

        if ($viewer->id !== $complainantUserId && ! $viewer->hasRole('Administrator')) {
            return null;
        }

        return self::sign($path);
    }

    private static function canViewDossier(CandidateProfile $profile, ?User $viewer): bool
    {
        if (! $viewer) {
            return false;
        }

        if ($viewer->id === $profile->user_id) {
            return true;
        }

        if ($viewer->hasRole('Administrator')) {
            return true;
        }

        if ($viewer->hasRole('Company')) {
            return RecruiterProfileView::isVisible($profile);
        }

        return false;
    }

    private static function sign(string $path): string
    {
        return Storage::disk('local')->temporaryUrl($path, now()->addMinutes(self::EXPIRES_AFTER_MINUTES));
    }
}
