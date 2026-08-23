<?php

namespace App\Services;

use App\Models\AdminActivityLog;
use App\Models\CandidateProfile;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * "Activités"/"Historique" have no table of their own for candidates and
 * recruiters — they're derived, on read, from timestamps that already exist
 * across several models (documents, tasks, shortlist entries…), merged with
 * the durable AdminActivityLog trail for admin-initiated events. Kept out of
 * the controllers because both AdminCandidateController and
 * AdminRecruiterController need the same shape.
 */
class ActivityFeed
{
    /** @return list<array{at: string, type: string, label: string, meta: array}> */
    public static function forCandidate(CandidateProfile $profile): array
    {
        $profile->loadMissing([
            'user:id,name,phone,created_at',
            'documents.reviewedBy:id,name,phone',
            'taskAssignments.task',
            'shortlistEntries.user:id,name,phone',
            'verifiedBy:id,name,phone',
        ]);

        $events = collect([
            self::event($profile->user->created_at, 'registration', 'Compte créé'),
            self::event($profile->submitted_at, 'profile_submitted', 'Profil soumis pour vérification'),
            self::event(
                $profile->verified_at,
                'profile_verified',
                'Profil vérifié par '.self::personName($profile->verifiedBy),
            ),
        ]);

        foreach ($profile->documents as $document) {
            $events->push(self::event($document->created_at, 'document_uploaded', ucfirst($document->type).' téléversé'));

            if ($document->reviewed_at) {
                $verb = $document->approval_status === 'approved' ? 'approuvé' : 'rejeté';
                $events->push(self::event(
                    $document->reviewed_at,
                    'document_reviewed',
                    ucfirst($document->type)." {$verb} par ".self::personName($document->reviewedBy),
                ));
            }
        }

        foreach ($profile->taskAssignments as $assignment) {
            if ($assignment->completed_at) {
                $events->push(self::event(
                    $assignment->completed_at,
                    'task_completed',
                    'Tâche complétée : '.($assignment->task->title ?? '—'),
                ));
            }
        }

        foreach ($profile->shortlistEntries as $entry) {
            $recruiterName = self::personName($entry->user);
            $events->push(self::event(
                $entry->created_at,
                'shortlisted',
                "{$recruiterName} a ajouté ce candidat à sa sélection",
            ));

            if ($entry->contact_revealed_at) {
                $events->push(self::event(
                    $entry->contact_revealed_at,
                    'contact_revealed',
                    "{$recruiterName} a consulté les coordonnées",
                ));
            }

            // Mirrors the same approximation used in forRecruiter() — no
            // stage-history table exists, so updated_at is the best available
            // signal for "the pipeline stage last moved here".
            if ($entry->stage !== 'saved' && $entry->updated_at?->gt($entry->created_at)) {
                $events->push(self::event(
                    $entry->updated_at,
                    'stage_changed',
                    "{$recruiterName} a modifié le statut de la candidature : « {$entry->stage} »",
                ));
            }
        }

        foreach (AdminActivityLog::forSubject($profile) as $log) {
            $events->push(self::event($log->created_at, $log->action, self::adminLabel($log)));
        }

        return self::sorted($events);
    }

    /** @return list<array{at: string, type: string, label: string, meta: array}> */
    public static function forRecruiter(User $recruiter): array
    {
        $recruiter->loadMissing([
            'companyProfile.verifiedBy:id,name,phone',
            'shortlist.candidateProfile:id,first_name,last_name',
        ]);

        $events = collect([
            self::event($recruiter->created_at, 'registration', 'Compte créé'),
        ]);

        if ($recruiter->companyProfile?->verified_at) {
            $events->push(self::event(
                $recruiter->companyProfile->verified_at,
                'company_verified',
                'Entreprise vérifiée par '.self::personName($recruiter->companyProfile->verifiedBy),
            ));
        }

        foreach ($recruiter->shortlist as $entry) {
            $candidateName = self::candidateName($entry->candidateProfile);
            $events->push(self::event(
                $entry->created_at,
                'shortlist_added',
                "A ajouté {$candidateName} à sa sélection",
            ));

            if ($entry->contact_revealed_at) {
                $events->push(self::event(
                    $entry->contact_revealed_at,
                    'contact_revealed',
                    "A consulté les coordonnées de {$candidateName}",
                ));
            }

            // No stage-history table exists (see recruiter_shortlists) — the
            // row's own updated_at is the closest available timestamp for
            // "when did the pipeline stage last move".
            if ($entry->stage !== 'saved' && $entry->updated_at?->gt($entry->created_at)) {
                $events->push(self::event(
                    $entry->updated_at,
                    'stage_changed',
                    "Étape « {$entry->stage} » pour {$candidateName}",
                ));
            }
        }

        foreach (AdminActivityLog::forSubject($recruiter) as $log) {
            $events->push(self::event($log->created_at, $log->action, self::adminLabel($log)));
        }

        return self::sorted($events);
    }

    private static function personName(?User $user): string
    {
        return $user?->name ?? $user?->phone ?? 'un administrateur';
    }

    private static function candidateName(?CandidateProfile $profile): string
    {
        if (! $profile) {
            return 'un candidat';
        }

        return trim("{$profile->first_name} {$profile->last_name}") ?: 'un candidat';
    }

    private static function adminLabel(AdminActivityLog $log): string
    {
        $actor = self::personName($log->actor);

        return match ($log->action) {
            'status_changed' => "{$actor} a changé le statut du compte (".($log->meta['status'] ?? '').')',
            'verified' => "{$actor} a vérifié l'entreprise",
            'notes_updated' => "{$actor} a mis à jour les notes internes",
            'deleted' => "{$actor} a supprimé le dossier",
            default => "{$actor} : {$log->action}",
        };
    }

    /** Null when the timestamp hasn't happened yet — filtered out by sorted(). */
    private static function event(mixed $at, string $type, string $label, array $meta = []): ?array
    {
        if (! $at) {
            return null;
        }

        return ['at' => $at->toJSON(), 'type' => $type, 'label' => $label, 'meta' => $meta];
    }

    /** @param  Collection<int, array|null>  $events */
    private static function sorted(Collection $events): array
    {
        return $events->filter()->sortByDesc('at')->values()->all();
    }
}
