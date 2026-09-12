'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/amud/ui';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { interviewsCollection } from '@/lib/amud/localInterviews';
import { candidateDocumentsCollection } from '@/lib/amud/localCandidateDocuments';
import { candidateOfferFavoritesCollection } from '@/lib/amud/localCandidateOfferFavorites';
import { candidateActivitiesCollection } from '@/lib/amud/localCandidateActivities';
import { ACTIVITY_ICON } from '@/data/amud/candidateActivities';
import { computeProfileCompletion } from '@/lib/amud/candidateProfileService';

export default function ParcoursPage() {
  const { candidate, loading } = useCurrentCandidate();
  const [applications] = useCollection(applicationsCollection, []);
  const [interviews] = useCollection(interviewsCollection, []);
  const [documents] = useCollection(candidateDocumentsCollection, []);
  const [favorites] = useCollection(candidateOfferFavoritesCollection, []);
  const [activities] = useCollection(candidateActivitiesCollection, []);

  const myApplications = candidate ? applications.filter((a) => a.candidateId === candidate.id) : [];
  const myInterviews = candidate ? interviews.filter((i) => i.candidateId === candidate.id) : [];
  const hasCV = candidate ? documents.some((d) => d.candidateAccountId === candidate.id && d.type === 'CV') : false;
  const hasFavoriteOrApplied = candidate ? favorites.some((f) => f.candidateAccountId === candidate.id) || myApplications.length > 0 : false;
  const completion = candidate ? computeProfileCompletion(candidate, hasCV) : null;
  const accepted = myApplications.some((a) => a.status === 'ACCEPTED');

  const steps = useMemo(
    () => [
      { key: 'profil', label: 'Profil', done: (completion?.percent ?? 0) >= 60 },
      { key: 'cv', label: 'CV', done: hasCV },
      { key: 'competences', label: 'Compétences', done: (candidate?.competences.length ?? 0) > 0 },
      { key: 'opportunites', label: 'Opportunités', done: hasFavoriteOrApplied },
      { key: 'candidature', label: 'Candidature', done: myApplications.length > 0 },
      { key: 'entretien', label: 'Entretien', done: myInterviews.length > 0 },
      { key: 'decision', label: 'Décision', done: accepted },
      { key: 'recrutement', label: 'Recrutement', done: accepted },
    ],
    [completion, hasCV, candidate, hasFavoriteOrApplied, myApplications.length, myInterviews.length, accepted],
  );

  const currentIndex = steps.findIndex((s) => !s.done);

  const myActivities = candidate ? activities.filter((a) => a.candidateAccountId === candidate.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];

  if (loading || !candidate) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Mon parcours" subtitle="Votre progression sur Amud Skills, mise à jour automatiquement." />

      <ol className="mb-xl flex flex-col gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        {steps.map((s, i) => {
          const isCurrent = i === currentIndex || (currentIndex === -1 && i === steps.length - 1);
          return (
            <li key={s.key} className="flex items-center gap-sm">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] ${
                  s.done ? 'bg-amud-primary text-white' : isCurrent ? 'border-2 border-amud-primary text-amud-primary' : 'border border-amud-outline-variant text-amud-outline'
                }`}
              >
                {s.done ? '✓' : isCurrent ? '●' : '○'}
              </span>
              <span className={`text-body-md ${s.done || isCurrent ? 'font-medium text-amud-on-surface' : 'text-amud-on-surface-variant'}`}>{s.label}</span>
            </li>
          );
        })}
      </ol>

      <h2 className="mb-sm text-title-lg text-amud-on-surface">Mon activité</h2>
      {myActivities.length === 0 ? (
        <p className="text-body-md text-amud-on-surface-variant">Aucune activité pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-sm">
          {myActivities.slice(0, 20).map((a) => (
            <li key={a.id} className="flex items-center gap-sm rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest px-md py-2">
              <span className="material-symbols-outlined text-[18px] text-amud-primary">{ACTIVITY_ICON[a.type]}</span>
              <span className="min-w-0 flex-1 truncate text-body-md text-amud-on-surface">{a.label}</span>
              <span className="shrink-0 text-label-sm text-amud-on-surface-variant">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
