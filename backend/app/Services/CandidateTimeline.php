<?php

namespace App\Services;

use App\Models\CandidateProfile;

/**
 * A derived timeline, not a logged one: there is no event table recording
 * exactly when each milestone was reached, so this reads the timestamps
 * already on the dossier and its documents rather than inventing a new one
 * to track. `completed_at` is null for anything not reached yet; the first
 * null in order is "in progress", everything after is "upcoming" — the
 * client decides how to render that, this only reports what happened when.
 */
class CandidateTimeline
{
    /** @return list<array{key: string, label: string, completed_at: string|null}> */
    public static function for(CandidateProfile $profile): array
    {
        $profile->loadMissing(['documents', 'languages', 'user']);

        $cv = $profile->documents->firstWhere('type', 'cv');
        $firstLanguageWithLevel = $profile->languages->first(fn ($l) => $l->cefr_level !== null);

        return [
            [
                'key' => 'registered',
                'label' => 'Inscription',
                'completed_at' => $profile->user?->created_at?->toJSON(),
            ],
            [
                'key' => 'personal_info',
                'label' => 'Informations personnelles',
                'completed_at' => ($profile->first_name && $profile->last_name && $profile->date_of_birth)
                    ? $profile->updated_at->toJSON()
                    : null,
            ],
            [
                'key' => 'cv_uploaded',
                'label' => 'CV téléchargé',
                'completed_at' => $cv?->created_at?->toJSON(),
            ],
            [
                'key' => 'languages_assessed',
                'label' => 'Langues renseignées',
                'completed_at' => $firstLanguageWithLevel?->updated_at?->toJSON(),
            ],
            [
                'key' => 'video_recorded',
                'label' => 'Vidéo de présentation',
                'completed_at' => $profile->presentation_video_path ? $profile->updated_at->toJSON() : null,
            ],
            [
                'key' => 'submitted',
                'label' => 'Dossier soumis',
                'completed_at' => $profile->submitted_at?->toJSON(),
            ],
            [
                'key' => 'verified',
                'label' => 'Dossier vérifié par un administrateur',
                'completed_at' => $profile->verified_at?->toJSON(),
            ],
        ];
    }
}
