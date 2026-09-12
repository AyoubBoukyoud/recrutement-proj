<?php

namespace App\Services;

use App\Models\CandidateProfile;

/**
 * One definition of "how far along is this dossier", shared by the candidate's
 * own progress indicator, the final review step's submit gate, and the admin
 * dashboard checklist. They used to disagree — the admin computed a checklist
 * inline and the candidate was shown nothing at all.
 *
 * Section keys line up 1:1 with the mobile profile-builder steps, so the
 * builder can resume at the first incomplete one instead of always at step 0.
 */
class ProfileCompleteness
{
    /** Sections that must be complete before a dossier can be submitted. */
    public const REQUIRED = ['personal', 'education', 'languages', 'availability', 'consents'];

    /** Sections that count towards progress but never block submission. */
    public const OPTIONAL = ['video', 'cv', 'certificates'];

    /**
     * @return array{
     *     sections: array<int, array{key: string, complete: bool, required: bool}>,
     *     completed: int,
     *     total: int,
     *     percent: int,
     *     missing_required: array<int, string>,
     *     can_submit: bool,
     *     submitted_at: string|null,
     * }
     */
    public static function for(CandidateProfile $profile): array
    {
        $flags = self::flags($profile);

        $sections = [];
        foreach ([...self::REQUIRED, ...self::OPTIONAL] as $key) {
            $sections[] = [
                'key' => $key,
                'complete' => $flags[$key],
                'required' => in_array($key, self::REQUIRED, true),
            ];
        }

        $missingRequired = array_values(array_filter(self::REQUIRED, fn (string $key) => ! $flags[$key]));
        $completed = count(array_filter($flags));
        $total = count($flags);

        return [
            'sections' => $sections,
            'completed' => $completed,
            'total' => $total,
            'percent' => (int) round($completed / $total * 100),
            'missing_required' => $missingRequired,
            'can_submit' => $missingRequired === [],
            'submitted_at' => $profile->submitted_at?->toJSON(),
        ];
    }

    /**
     * The admin dashboard's four-item checklist, expressed in terms of the same
     * flags so the two views can never drift apart.
     *
     * @return array<string, bool>
     */
    public static function adminChecklist(CandidateProfile $profile): array
    {
        $flags = self::flags($profile);

        return [
            'profile_completed' => $flags['personal'] && $flags['availability'],
            'cv_uploaded' => $flags['cv'],
            'certificates_uploaded' => $flags['certificates'],
            'video_recorded' => $flags['video'],
        ];
    }

    /** @return array<string, bool> */
    private static function flags(CandidateProfile $profile): array
    {
        // relationLoaded checks keep this usable inside an eager-loaded admin
        // listing without firing a query per candidate per section.
        $educations = $profile->relationLoaded('educations') ? $profile->educations : $profile->educations()->get();
        $languages = $profile->relationLoaded('languages') ? $profile->languages : $profile->languages()->get();
        $documents = $profile->relationLoaded('documents') ? $profile->documents : $profile->documents()->get();

        return [
            'personal' => (bool) ($profile->first_name && $profile->last_name && $profile->date_of_birth),
            'education' => $educations->isNotEmpty(),
            'languages' => $languages->contains(fn ($language) => $language->cefr_level !== null),
            'availability' => (bool) $profile->availability_status,
            'consents' => (bool) ($profile->terms_consent_at && $profile->cndp_consent_at),
            'video' => (bool) $profile->presentation_video_path,
            'cv' => $documents->contains(fn ($d) => $d->type === 'cv' && $d->ocr_status === 'completed'),
            'certificates' => $documents->contains(fn ($d) => $d->type === 'certificate'),
        ];
    }
}
