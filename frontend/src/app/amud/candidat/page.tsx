'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Badge, StatCard, EmptyState } from '@/components/amud/ui';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { offresCollection } from '@/lib/amud/localOffres';
import { interviewsCollection } from '@/lib/amud/localInterviews';
import { candidateDocumentsCollection } from '@/lib/amud/localCandidateDocuments';
import { notifications as notificationsCollection } from '@/lib/amud/storage/notify';
import { offresSeed } from '@/data/amud/offres';
import { notificationsSeed } from '@/data/amud/notifications';
import { STATUS_LABEL, isDecided } from '@/data/amud/applications';
import { computeProfileCompletion, nextIncompleteSection } from '@/lib/amud/candidateProfileService';
import { computeMatchScore } from '@/lib/amud/matchScoreService';

const ETAPES = [
  { n: '01', label: 'Créer mon profil', icon: 'person_add' },
  { n: '02', label: 'Ajouter mes compétences', icon: 'psychology' },
  { n: '03', label: 'Découvrir les opportunités', icon: 'travel_explore' },
  { n: '04', label: 'Postuler', icon: 'send' },
  { n: '05', label: 'Suivre ma candidature', icon: 'timeline' },
  { n: '06', label: 'Préparer mon entretien', icon: 'record_voice_over' },
  { n: '07', label: "Avancer vers l'emploi", icon: 'work' },
];

export default function CandidatHomePage() {
  const { candidate, loading } = useCurrentCandidate();

  if (loading) return null;
  return candidate ? <Dashboard candidateId={candidate.id} /> : <Landing />;
}

function Landing() {
  return (
    <div className="mx-auto max-w-3xl px-margin-mobile py-xl text-center">
      <span className="material-symbols-outlined mb-md text-[48px] text-amud-primary">work</span>
      <h1 className="text-headline-lg text-amud-on-surface">Trouvez votre emploi en Allemagne avec Amud Skills</h1>
      <p className="mx-auto mt-3 max-w-xl text-body-lg text-amud-on-surface-variant">
        Créez votre profil, découvrez des opportunités adaptées à vos compétences et suivez votre candidature de bout en bout.
      </p>

      <div className="mt-xl">
        <h2 className="mb-lg text-title-lg text-amud-on-surface">Comment ça marche ?</h2>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          {ETAPES.map((e) => (
            <div key={e.n} className="flex items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md text-left shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amud-primary-container text-white">
                <span className="material-symbols-outlined">{e.icon}</span>
              </div>
              <div>
                <div className="text-label-sm font-bold uppercase tracking-wider text-amud-primary">{e.n}</div>
                <div className="text-body-md font-medium text-amud-on-surface">{e.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/amud/candidat/inscription"
        className="mt-xl inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-amud-primary px-xl text-label-lg font-semibold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
      >
        Créer mon compte
        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
      </Link>
    </div>
  );
}

function Dashboard({ candidateId }: { candidateId: string }) {
  const { candidate } = useCurrentCandidate();
  const [applications] = useCollection(applicationsCollection, []);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [interviews] = useCollection(interviewsCollection, []);
  const [documents] = useCollection(candidateDocumentsCollection, []);
  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);

  const myApplications = useMemo(() => applications.filter((a) => a.candidateId === candidateId), [applications, candidateId]);
  const activeApplications = myApplications.filter((a) => !isDecided(a.status));
  const hasCV = documents.some((d) => d.candidateAccountId === candidateId && d.type === 'CV');
  const completion = candidate ? computeProfileCompletion(candidate, hasCV) : null;
  const nextAction = completion ? nextIncompleteSection(completion) : null;

  const upcomingInterviews = useMemo(
    () =>
      interviews
        .filter((i) => i.candidateId === candidateId && (i.status === 'Planifié' || i.status === 'Confirmé'))
        .sort((a, b) => `${a.date}${a.heureDebut}`.localeCompare(`${b.date}${b.heureDebut}`)),
    [interviews, candidateId],
  );

  const recommended = useMemo(() => {
    if (!candidate) return [];
    const appliedOfferIds = new Set(myApplications.map((a) => a.offerId));
    return offres
      .filter((o) => o.statut === 'Publiée' && !appliedOfferIds.has(o.id))
      .map((o) => ({ offre: o, match: computeMatchScore(candidate, o) }))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 3);
  }, [candidate, offres, myApplications]);

  const myNotifications = allNotifications
    .filter((n) => n.scope === 'candidate' && (!n.targetId || n.targetId === candidateId) && !n.read)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  if (!candidate) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-lg text-headline-md text-amud-on-surface">Bonjour {candidate.prenom} 👋</h1>

      <div className="mb-lg grid grid-cols-2 gap-md sm:grid-cols-4">
        <StatCard label="Profil complété" value={completion?.percent ?? 0} suffix="%" icon="person" href="/amud/candidat/profil" />
        <StatCard label="Candidatures actives" value={activeApplications.length} icon="assignment" href="/amud/candidat/candidatures" />
        <StatCard label="Entretiens à venir" value={upcomingInterviews.length} icon="event" href="/amud/candidat/entretiens" />
        <StatCard label="Notifications" value={myNotifications.length} icon="notifications" href="/amud/candidat/notifications" />
      </div>

      {nextAction ? (
        <Link
          href={nextAction.href}
          className="mb-lg flex items-center gap-md rounded-xl border border-amud-tertiary-fixed-dim bg-amud-tertiary-fixed p-md text-amud-on-tertiary-fixed shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <span className="material-symbols-outlined text-[24px]">priority_high</span>
          <div className="flex-1">
            <p className="text-label-sm font-semibold uppercase tracking-wide">Prochaine action</p>
            <p className="text-body-md font-medium">{nextAction.label}</p>
          </div>
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      ) : null}

      {upcomingInterviews[0] ? (
        <div className="mb-lg flex items-center gap-md rounded-xl border border-amud-primary/30 bg-amud-primary/5 p-md">
          <span className="material-symbols-outlined text-[24px] text-amud-primary">event</span>
          <div className="flex-1">
            <p className="text-label-sm font-semibold uppercase tracking-wide text-amud-primary">Prochain entretien</p>
            <p className="text-body-md text-amud-on-surface">
              {upcomingInterviews[0].offerTitre} — {new Date(upcomingInterviews[0].date).toLocaleDateString('fr-FR')} à {upcomingInterviews[0].heureDebut}
            </p>
          </div>
          <Link href={`/amud/candidat/entretiens/${upcomingInterviews[0].id}`} className="text-label-md font-medium text-amud-primary hover:underline">
            Voir
          </Link>
        </div>
      ) : null}

      <section className="mb-lg">
        <div className="mb-sm flex items-center justify-between">
          <h2 className="text-title-lg text-amud-on-surface">Opportunités recommandées</h2>
          <Link href="/amud/candidat/opportunites" className="text-label-md font-medium text-amud-primary hover:underline">
            Voir tout
          </Link>
        </div>
        {recommended.length === 0 ? (
          <EmptyState icon="travel_explore" title="Complétez votre profil pour des recommandations" description="Plus votre profil est complet, plus nos recommandations seront pertinentes." actionLabel="Compléter mon profil" onAction={() => (window.location.href = '/amud/candidat/profil')} compact />
        ) : (
          <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
            {recommended.map(({ offre, match }) => (
              <Link key={offre.id} href={`/amud/candidat/opportunites/${offre.id}`} className="flex flex-col gap-1 rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm transition-all hover:-translate-y-0.5 hover:border-amud-primary">
                <div className="flex items-center justify-between">
                  <Badge tone="success">{match.score}% compatible</Badge>
                </div>
                <p className="text-body-md font-semibold text-amud-on-surface">{offre.titre}</p>
                <p className="text-label-sm text-amud-on-surface-variant">{offre.entreprise} · {offre.ville}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mb-lg">
        <div className="mb-sm flex items-center justify-between">
          <h2 className="text-title-lg text-amud-on-surface">Candidatures en cours</h2>
          <Link href="/amud/candidat/candidatures" className="text-label-md font-medium text-amud-primary hover:underline">
            Voir tout
          </Link>
        </div>
        {activeApplications.length === 0 ? (
          <EmptyState icon="assignment" title="Vous n'avez pas encore postulé à une offre." actionLabel="Découvrir les opportunités" onAction={() => (window.location.href = '/amud/candidat/opportunites')} compact />
        ) : (
          <div className="flex flex-col gap-sm">
            {activeApplications.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/amud/candidat/candidatures/${a.id}`} className="flex items-center justify-between gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm hover:border-amud-primary">
                <div className="min-w-0">
                  <p className="truncate text-body-md font-medium text-amud-on-surface">{a.offerTitre}</p>
                  <p className="truncate text-label-sm text-amud-on-surface-variant">{a.entrepriseNom}</p>
                </div>
                <Badge tone="info">{STATUS_LABEL[a.status]}</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
