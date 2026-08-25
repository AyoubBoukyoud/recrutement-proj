'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CountUp } from '@/components/amud/ui';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed, STATUS_LABEL, type ApplicationStatus } from '@/data/amud/applications';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed } from '@/data/amud/offres';
import { interviewsCollection } from '@/lib/amud/localInterviews';
import { interviewsSeed } from '@/data/amud/interviews';
import { notifications as notificationsCollection } from '@/lib/amud/storage/notify';
import { notificationsSeed } from '@/data/amud/notifications';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { STATUT_CLASS as INTERVIEW_STATUT_CLASS, TYPE_ICON } from '@/data/amud/interviews';
import { AnalyticsCard } from '@/components/amud/analytics/AnalyticsCard';
import { FunnelChartAmud } from '@/components/amud/analytics/FunnelChartAmud';
import { TrendBadge } from '@/components/amud/analytics/TrendBadge';
import { getRecruiterStats } from '@/lib/amud/analytics/recruiterStats';
import { resolvePeriod } from '@/lib/amud/analytics/period';

const STATUT_PILL: Record<ApplicationStatus, string> = {
  NEW: 'bg-amud-primary-container text-white',
  SCREENING: 'bg-amud-surface-container-high text-amud-on-surface-variant',
  INTERVIEW: 'bg-amud-tertiary text-white',
  SHORTLIST: 'bg-amud-primary text-white',
  ACCEPTED: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  REJECTED: 'bg-amud-error-container text-amud-on-error-container',
  WITHDRAWN: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
};

const AVATAR_STYLES = [
  { bg: 'bg-amud-primary-fixed', fg: 'text-amud-on-primary-fixed' },
  { bg: 'bg-amud-secondary-fixed', fg: 'text-amud-on-secondary-fixed' },
  { bg: 'bg-amud-tertiary-fixed', fg: 'text-amud-on-tertiary-fixed' },
  { bg: 'bg-amud-surface-container-highest', fg: 'text-amud-on-surface-variant' },
];

function initialsOf(nom: string): string {
  return nom.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const QUICK_ACTIONS = [
  { href: '/amud/entreprise/offres/nouveau', icon: 'add_circle', label: 'Créer une offre' },
  { href: '/amud/entreprise/candidatures', icon: 'assignment', label: 'Voir les candidatures' },
  { href: '/amud/entreprise/candidats', icon: 'person_search', label: 'Rechercher un candidat' },
  { href: '/amud/entreprise/entretiens', icon: 'event_available', label: 'Planifier un entretien' },
];

export default function AmudEntrepriseDashboardPage() {
  const [applications] = useCollection(applicationsCollection, applicationsSeed);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [interviews] = useCollection(interviewsCollection, interviewsSeed);
  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);

  const myApplications = useMemo(() => applications.filter((a) => a.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [applications]);
  const myOffres = useMemo(() => offres.filter((o) => o.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [offres]);
  const myInterviews = useMemo(() => interviews.filter((i) => i.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [interviews]);
  const myNotifications = useMemo(
    () => allNotifications.filter((n) => n.scope === 'employer').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [allNotifications],
  );

  const kpis = useMemo(() => {
    const offresActives = myOffres.filter((o) => o.statut === 'Publiée').length;
    const nouvelles = myApplications.filter((a) => a.status === 'NEW').length;
    const enCours = myApplications.filter((a) => a.status === 'SCREENING' || a.status === 'INTERVIEW' || a.status === 'SHORTLIST').length;
    const now = new Date();
    const entretiensAVenir = myInterviews.filter((i) => (i.status === 'Planifié' || i.status === 'Confirmé') && new Date(`${i.date}T${i.heureDebut}`) >= now).length;
    return { offresActives, nouvelles, enCours, entretiensAVenir };
  }, [myOffres, myApplications, myInterviews]);

  // Fenêtre de comparaison par défaut (30j vs 30j précédents) — le dashboard
  // reste sans sélecteur de période explicite (cf. plan : la page
  // /statistiques porte les filtres, le dashboard garde un résumé "du jour").
  const recruiterStats = useMemo(() => getRecruiterStats(myOffres, myApplications, [], resolvePeriod('30d')), [myOffres, myApplications]);

  const recentApplications = useMemo(
    () => [...myApplications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [myApplications],
  );

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return myInterviews
      .filter((i) => (i.status === 'Planifié' || i.status === 'Confirmé') && new Date(`${i.date}T${i.heureDebut}`) >= now)
      .sort((a, b) => `${a.date}T${a.heureDebut}`.localeCompare(`${b.date}T${b.heureDebut}`))
      .slice(0, 5);
  }, [myInterviews]);

  return (
    <>
      <section>
        <h2 className="text-headline-lg text-amud-on-surface">Bonjour, {CURRENT_EMPLOYER.userNom.split(' ')[0]}</h2>
        <p className="text-body-md text-amud-on-surface-variant">{CURRENT_EMPLOYER.entrepriseNom} — voici l’état de votre recrutement aujourd’hui.</p>
      </section>

      <section className="-mx-xs flex snap-x gap-lg overflow-x-auto px-xs pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-lg md:overflow-visible md:px-0 lg:grid-cols-4">
        {[
          { icon: 'work', value: kpis.offresActives, label: 'Offres actives', bg: 'bg-amud-primary-fixed', fg: 'text-amud-on-primary-fixed' },
          { icon: 'person_add', value: kpis.nouvelles, label: 'Nouvelles candidatures', bg: 'bg-amud-secondary-fixed', fg: 'text-amud-on-secondary-fixed', trend: recruiterStats.trends.candidatures },
          { icon: 'hourglass_top', value: kpis.enCours, label: 'Candidatures en cours', bg: 'bg-amud-tertiary-fixed', fg: 'text-amud-on-tertiary-fixed' },
          { icon: 'event', value: kpis.entretiensAVenir, label: 'Entretiens à venir', bg: 'bg-amud-primary-fixed', fg: 'text-amud-on-primary-fixed' },
        ].map((k) => (
          <div key={k.label} className="min-w-[220px] shrink-0 snap-start rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg md:min-w-0">
            <span className={`material-symbols-outlined inline-block rounded-lg p-xs ${k.bg} ${k.fg}`}>{k.icon}</span>
            <div className="mt-md text-display-lg text-amud-on-surface">
              <CountUp value={k.value} />
            </div>
            <div className="text-label-md text-amud-on-surface-variant">{k.label}</div>
            {k.trend ? (
              <div className="mt-1">
                <TrendBadge trend={k.trend} />
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="space-y-md">
        <h3 className="text-title-lg text-amud-on-surface">Pipeline de recrutement</h3>
        <AnalyticsCard>
          <FunnelChartAmud stages={recruiterStats.funnel} ariaLabel="Funnel de recrutement : candidatures, présélection, entretiens, finalistes, recrutements" />
        </AnalyticsCard>
      </section>

      <section className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex min-h-[64px] items-center gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md font-medium text-amud-on-surface transition-colors hover:border-amud-primary hover:bg-amud-surface-container-low active:scale-[0.98]"
          >
            <span className="material-symbols-outlined shrink-0 rounded-lg bg-amud-primary-container p-sm text-white">{action.icon}</span>
            <span className="text-label-md">{action.label}</span>
          </Link>
        ))}
      </section>

      <section className="space-y-md">
        <div className="flex items-center justify-between">
          <h3 className="text-title-lg text-amud-on-surface">Candidatures récentes</h3>
          <Link href="/amud/entreprise/candidatures" className="text-label-md font-bold text-amud-primary hover:underline">
            Voir tout
          </Link>
        </div>
        {recentApplications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-amud-outline-variant p-lg text-center text-label-md text-amud-on-surface-variant">Aucune candidature reçue pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-sm">
            {recentApplications.map((a, i) => {
              const style = AVATAR_STYLES[i % AVATAR_STYLES.length];
              return (
                <div key={a.id} className="flex items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold ${style.bg} ${style.fg}`}>{initialsOf(a.candidateNom)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-amud-on-surface">{a.candidateNom}</p>
                    <p className="truncate text-label-sm text-amud-on-surface-variant">{a.offerTitre} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</p>
                    <div className="mt-1 flex items-center gap-xs">
                      <span className={`rounded-full px-sm py-0.5 text-[10px] font-bold ${STATUT_PILL[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                      <span className="text-[11px] font-bold text-amud-primary">{a.score}% match</span>
                    </div>
                  </div>
                  <Link href={`/amud/entreprise/candidatures/${a.id}`} className="shrink-0 rounded-lg px-sm py-1.5 text-label-sm font-bold text-amud-primary hover:bg-amud-surface-container-low">
                    Voir
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-md">
        <div className="flex items-center justify-between">
          <h3 className="text-title-lg text-amud-on-surface">Entretiens à venir</h3>
          <Link href="/amud/entreprise/entretiens" className="text-label-md font-bold text-amud-primary hover:underline">
            Voir tout
          </Link>
        </div>
        {upcomingInterviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-amud-outline-variant p-lg text-center text-label-md text-amud-on-surface-variant">Aucun entretien programmé.</p>
        ) : (
          <div className="flex flex-col gap-sm">
            {upcomingInterviews.map((i) => (
              <div key={i.id} className="flex items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md">
                <span className="material-symbols-outlined shrink-0 rounded-lg bg-amud-surface-container-highest p-sm text-amud-primary">{TYPE_ICON[i.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-amud-on-surface">{i.candidateNom}</p>
                  <p className="truncate text-label-sm text-amud-on-surface-variant">
                    {i.offerTitre} · {new Date(i.date).toLocaleDateString('fr-FR')} à {i.heureDebut}
                  </p>
                  <span className={`mt-1 inline-block rounded-full px-sm py-0.5 text-[10px] font-bold ${INTERVIEW_STATUT_CLASS[i.status]}`}>{i.status}</span>
                </div>
                <Link href={`/amud/entreprise/entretiens/${i.id}`} className="shrink-0 rounded-lg px-sm py-1.5 text-label-sm font-bold text-amud-primary hover:bg-amud-surface-container-low">
                  Voir
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-md">
        <div className="flex items-center justify-between">
          <h3 className="text-title-lg text-amud-on-surface">Notifications récentes</h3>
          <Link href="/amud/entreprise/notifications" className="text-label-md font-bold text-amud-primary hover:underline">
            Voir tout
          </Link>
        </div>
        {myNotifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-amud-outline-variant p-lg text-center text-label-md text-amud-on-surface-variant">Aucune notification.</p>
        ) : (
          <div className="divide-y divide-amud-outline-variant rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest">
            {myNotifications.map((n) => (
              <Link key={n.id} href={n.href ?? '/amud/entreprise/notifications'} className={`flex items-start gap-sm px-md py-sm transition-colors hover:bg-amud-surface-container-low ${n.read ? 'opacity-60' : ''}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-amud-outline-variant' : 'bg-amud-secondary'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-body-md text-amud-on-surface">{n.title}</span>
                  <span className="block text-label-sm text-amud-on-surface-variant">{n.category}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
