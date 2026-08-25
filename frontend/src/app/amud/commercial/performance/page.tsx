'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CountUp, PageHeader } from '@/components/amud/ui';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { activitesSeed, TYPE_ICON } from '@/data/amud/commercialActivites';
import { activitesCollection } from '@/lib/amud/localCommercialActivites';
import { callTicketsSeed, RESULT_CLASS } from '@/data/amud/callTickets';
import { callTicketsCollection } from '@/lib/amud/localCallTickets';
import { followupsSeed } from '@/data/amud/followups';
import { followupsCollection } from '@/lib/amud/localFollowUps';
import { objectivesSeed } from '@/data/amud/objectives';
import { objectivesCollection } from '@/lib/amud/localObjectives';
import { centresSeed } from '@/data/amud/centres';
import { centresCollection } from '@/lib/amud/localCentres';
import { entreprisesSeed } from '@/data/amud/entreprises';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { candidatesSeed, getCandidatesForCommercial } from '@/data/amud/candidates';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { getCommercialPerformance, getCommercialCandidateStats, getCommercialObjectives } from '@/lib/amud/commercialServices';
import { resolvePeriod, previousPeriodRange, inRange, bucketTimeSeries, comparePeriods, type PeriodKey, type PeriodRange } from '@/lib/amud/analytics/period';
import { percentOf } from '@/lib/amud/analytics/aggregate';
import { KpiCard } from '@/components/amud/analytics/KpiCard';
import { AnalyticsCard } from '@/components/amud/analytics/AnalyticsCard';
import { AnalyticsFilters } from '@/components/amud/analytics/AnalyticsFilters';
import { BarChartAmud } from '@/components/amud/analytics/BarChartAmud';
import { LineChartAmud } from '@/components/amud/analytics/LineChartAmud';
import { DonutChartAmud } from '@/components/amud/analytics/DonutChartAmud';
import { FunnelChartAmud } from '@/components/amud/analytics/FunnelChartAmud';
import { ProgressGauge } from '@/components/amud/analytics/ProgressGauge';
import { ActivityHistogram } from '@/components/amud/analytics/ActivityHistogram';

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}

export default function AmudCommercialPerformancePage() {
  const [activitesAll] = useCollection(activitesCollection, activitesSeed);
  const [callTicketsAll] = useCollection(callTicketsCollection, callTicketsSeed);
  const [followupsAll] = useCollection(followupsCollection, followupsSeed);
  const [objectivesAll] = useCollection(objectivesCollection, objectivesSeed);
  const [centresAll] = useCollection(centresCollection, centresSeed);
  const [entreprisesAll] = useCollection(entreprisesCollection, entreprisesSeed);
  const [candidatesAll] = useCollection(candidatesCollection, candidatesSeed);

  const [period, setPeriod] = useState<PeriodKey>('7d');
  const [customRange, setCustomRange] = useState<PeriodRange>();
  const range = useMemo(() => resolvePeriod(period, customRange), [period, customRange]);
  const prevRange = useMemo(() => previousPeriodRange(range), [range]);

  const mesActivites = useMemo(() => activitesAll.filter((a) => a.commercialId === CURRENT_COMMERCIAL.id), [activitesAll]);
  const mesCallTickets = useMemo(() => callTicketsAll.filter((t) => t.commercialId === CURRENT_COMMERCIAL.id), [callTicketsAll]);
  const mesFollowups = useMemo(() => followupsAll.filter((f) => f.commercialId === CURRENT_COMMERCIAL.id), [followupsAll]);
  const mesCentres = useMemo(() => centresAll.filter((c) => c.assignedCommercialNom === CURRENT_COMMERCIAL.nom), [centresAll]);
  const mesEntreprises = useMemo(() => entreprisesAll.filter((e) => e.commercialResponsable === CURRENT_COMMERCIAL.nom), [entreprisesAll]);
  const mesCandidats = useMemo(() => getCandidatesForCommercial(CURRENT_COMMERCIAL.nom, candidatesAll), [candidatesAll]);
  const myObjective = useMemo(() => getCommercialObjectives(objectivesAll), [objectivesAll]);

  const stats = useMemo(
    () => getCommercialPerformance(mesActivites, mesCallTickets, { centres: mesCentres, entreprises: mesEntreprises, objective: myObjective }, range),
    [mesActivites, mesCallTickets, mesCentres, mesEntreprises, myObjective, range],
  );
  const candidateStats = useMemo(() => getCommercialCandidateStats(mesCandidats, mesCallTickets, mesFollowups), [mesCandidats, mesCallTickets, mesFollowups]);

  const appelsActivites = useMemo(() => mesActivites.filter((a) => a.type === 'Appel'), [mesActivites]);
  const rdvActivites = useMemo(() => mesActivites.filter((a) => a.type === 'Rendez-vous'), [mesActivites]);

  const appelsAujourdHui = appelsActivites.filter((a) => a.date === todayFr()).length;
  const range7d = useMemo(() => resolvePeriod('7d'), []);
  const appelsSemaine = appelsActivites.filter((a) => inRange(a.date, range7d)).length;
  const now = new Date();
  const rangeMois: PeriodRange = { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, end: resolvePeriod('today').end };
  const appelsMois = appelsActivites.filter((a) => inRange(a.date, rangeMois)).length;
  const appelsRepondus = mesCallTickets.filter((t) => t.result === 'Répondu').length;
  const tauxReponseAppels = percentOf(appelsRepondus, mesCallTickets.length);
  const rappelsPlanifies = mesFollowups.filter((f) => f.status === 'Planifiée').length;

  const appelsEnRange = appelsActivites.filter((a) => inRange(a.date, range)).length;
  const appelsEnPrevRange = appelsActivites.filter((a) => inRange(a.date, prevRange)).length;
  const appelsTrend = comparePeriods(appelsEnRange, appelsEnPrevRange);

  const rdvEnRange = rdvActivites.filter((a) => inRange(a.date, range)).length;
  const rdvEnPrevRange = rdvActivites.filter((a) => inRange(a.date, prevRange)).length;
  const rdvTrend = comparePeriods(rdvEnRange, rdvEnPrevRange);

  const appelsParJourData = useMemo(() => bucketTimeSeries(appelsActivites, (a) => a.date, range), [appelsActivites, range]);
  const rdvEvolutionData = useMemo(() => bucketTimeSeries(rdvActivites, (a) => a.date, range), [rdvActivites, range]);

  const recentsAppels = useMemo(() => [...mesCallTickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4), [mesCallTickets]);
  const recentsRdv = useMemo(() => [...rdvActivites].sort((a, b) => (a.date === b.date ? b.heureDebut.localeCompare(a.heureDebut) : b.date.localeCompare(a.date))).slice(0, 4), [rdvActivites]);
  const recentsRappels = useMemo(() => [...mesFollowups].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4), [mesFollowups]);
  const recentsCandidatsContactes = useMemo(
    () =>
      [...mesCallTickets]
        .filter((t) => t.contactType === 'Candidat')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 4),
    [mesCallTickets],
  );

  return (
    <div>
      <PageHeader title="Ma performance" subtitle="Suivez vos appels, rendez-vous et objectifs sur la période de votre choix." />

      <AnalyticsFilters period={period} onPeriodChange={setPeriod} customRange={customRange} onCustomRangeChange={setCustomRange} />

      <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-title-lg text-amud-on-surface">Objectif du jour</h2>
            <p className="mt-1 text-body-md text-amud-on-surface-variant">Appels réalisés aujourd&apos;hui vs objectif quotidien</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-amud-primary">target</span>
        </div>
        <div className="mb-2 flex items-baseline gap-3">
          <span className="text-display-lg text-amud-primary">
            <CountUp value={appelsAujourdHui} />
          </span>
          <span className="text-headline-md text-amud-on-surface-variant">/ {myObjective?.appelsJour ?? 0}</span>
          <span className="ml-auto rounded-full bg-amud-primary-container px-2 py-1 text-label-md text-white">{percentOf(appelsAujourdHui, myObjective?.appelsJour ?? 0)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-amud-surface-container-high">
          <div className="h-full rounded-full bg-amud-primary transition-all" style={{ width: `${Math.min(100, percentOf(appelsAujourdHui, myObjective?.appelsJour ?? 0))}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-md sm:grid-cols-3">
          <div className="rounded-lg bg-amud-surface-container-low p-md">
            <div className="text-label-sm text-amud-on-surface-variant">Objectif hebdomadaire (RDV)</div>
            <div className="text-title-lg text-amud-on-surface">{myObjective?.rdvSemaine ?? 0}</div>
          </div>
          <div className="rounded-lg bg-amud-surface-container-low p-md">
            <div className="text-label-sm text-amud-on-surface-variant">Objectif mensuel (appels)</div>
            <div className="text-title-lg text-amud-on-surface">
              {stats.objectifMensuel.realise}/{stats.objectifMensuel.objectif} ({stats.objectifMensuel.pct}%)
            </div>
          </div>
          <div className="rounded-lg bg-amud-surface-container-low p-md">
            <div className="text-label-sm text-amud-on-surface-variant">Taux de conversion cible</div>
            <div className="text-title-lg text-amud-on-surface">{myObjective?.tauxConversionCible ?? 0}%</div>
          </div>
        </div>
      </div>

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        <KpiCard label="Appels aujourd'hui" value={appelsAujourdHui} icon="today" />
        <KpiCard label="Appels 7 jours" value={appelsSemaine} icon="date_range" />
        <KpiCard label="Appels ce mois" value={appelsMois} icon="calendar_month" />
        <KpiCard label="Appels répondus" value={appelsRepondus} icon="phone_in_talk" />
        <KpiCard label="Taux de réponse" value={tauxReponseAppels} suffix="%" icon="percent" />
        <KpiCard label="Candidats contactés" value={candidateStats.contactes} icon="person" href="/amud/commercial/candidats" />
        <KpiCard label="Centres contactés" value={stats.kpis.centresContactes} icon="school" href="/amud/commercial/centres" />
        <KpiCard label="Rendez-vous" value={stats.kpis.rendezVous} icon="event" trend={rdvTrend} href="/amud/commercial/rendez-vous" />
        <KpiCard label="Rappels planifiés" value={rappelsPlanifies} icon="notification_important" />
        <KpiCard label="Partenariats" value={stats.kpis.partenariatsObtenus} icon="handshake" />
        <KpiCard label="Taux de conversion" value={stats.kpis.tauxConversion} suffix="%" icon="trending_up" />
        <KpiCard label="Appels (période)" value={appelsEnRange} icon="call" trend={appelsTrend} />
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <AnalyticsCard title="Appels par jour" subtitle="Volume d'appels sur la période sélectionnée">
          <BarChartAmud data={appelsParJourData} ariaLabel="Appels par jour" />
        </AnalyticsCard>
        <AnalyticsCard title="Évolution du nombre d'appels" subtitle="Tendance sur la période sélectionnée">
          <LineChartAmud data={appelsParJourData} series={[{ key: 'value', label: 'Appels' }]} ariaLabel="Évolution du nombre d'appels" />
        </AnalyticsCard>
        <AnalyticsCard title="Résultats des appels" subtitle="Répartition des résultats de vos tickets d'appel">
          <DonutChartAmud data={stats.resultatsAppels} ariaLabel="Répartition des résultats de vos appels" />
        </AnalyticsCard>
        <AnalyticsCard title="Funnel commercial" subtitle="Prospects → Contactés → Intéressés → Rendez-vous → Partenaires">
          <FunnelChartAmud stages={stats.funnel} ariaLabel="Funnel commercial" />
        </AnalyticsCard>
        <AnalyticsCard title="Évolution des rendez-vous" subtitle="Rendez-vous planifiés sur la période sélectionnée">
          <LineChartAmud data={rdvEvolutionData} series={[{ key: 'value', label: 'Rendez-vous' }]} ariaLabel="Évolution des rendez-vous" />
        </AnalyticsCard>
        <AnalyticsCard title="Conversion" subtitle="Part des contacts convertis en partenariats">
          <div className="flex justify-center py-md">
            <ProgressGauge value={stats.kpis.tauxConversion} max={100} label="Taux de conversion" sublabel={`${stats.kpis.partenariatsObtenus} partenariats`} />
          </div>
        </AnalyticsCard>
        <AnalyticsCard title="Activité par jour de la semaine" subtitle="Répartition Lun-Dim de vos activités" className="lg:col-span-2">
          <ActivityHistogram data={stats.activiteParJour} ariaLabel="Activités par jour de la semaine" />
        </AnalyticsCard>
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-lg lg:grid-cols-2">
        <RecentPanel title="Derniers appels" seeAllHref="/amud/commercial/activites" empty="Aucun appel récent.">
          {recentsAppels.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-amud-outline-variant p-sm">
              <div className="min-w-0">
                <p className="truncate text-label-md font-medium text-amud-on-surface">{t.contactNom}</p>
                <p className="truncate text-label-sm text-amud-on-surface-variant">{t.summary}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${RESULT_CLASS[t.result]}`}>{t.result}</span>
            </div>
          ))}
        </RecentPanel>
        <RecentPanel title="Derniers rendez-vous" seeAllHref="/amud/commercial/rendez-vous" empty="Aucun rendez-vous récent.">
          {recentsRdv.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-amud-outline-variant p-sm">
              <div className="min-w-0">
                <p className="truncate text-label-md font-medium text-amud-on-surface">{a.contact}</p>
                <p className="truncate text-label-sm text-amud-on-surface-variant">{a.resume}</p>
              </div>
              <span className="shrink-0 text-label-sm text-amud-on-surface-variant">{a.date}</span>
            </div>
          ))}
        </RecentPanel>
        <RecentPanel title="Derniers rappels" seeAllHref="/amud/commercial/candidats" empty="Aucun rappel récent.">
          {recentsRappels.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-amud-outline-variant p-sm">
              <div className="min-w-0">
                <p className="truncate text-label-md font-medium text-amud-on-surface">{f.contactNom}</p>
                <p className="truncate text-label-sm text-amud-on-surface-variant">{f.note}</p>
              </div>
              <span className="shrink-0 text-label-sm text-amud-on-surface-variant">
                {f.dueDate} {f.dueTime}
              </span>
            </div>
          ))}
        </RecentPanel>
        <RecentPanel title="Derniers candidats contactés" seeAllHref="/amud/commercial/candidats" empty="Aucun candidat contacté récemment.">
          {recentsCandidatsContactes.map((t) => (
            <Link key={t.id} href={`/amud/commercial/candidats/${t.contactId}`} className="flex items-center justify-between gap-2 rounded-lg border border-amud-outline-variant p-sm hover:bg-amud-surface-container-low">
              <div className="min-w-0">
                <p className="truncate text-label-md font-medium text-amud-on-surface">{t.contactNom}</p>
                <p className="truncate text-label-sm text-amud-on-surface-variant">{t.summary}</p>
              </div>
              <span className="material-symbols-outlined shrink-0 text-amud-primary">{TYPE_ICON['Appel']}</span>
            </Link>
          ))}
        </RecentPanel>
      </div>
    </div>
  );
}

function RecentPanel({ title, seeAllHref, empty, children }: { title: string; seeAllHref: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
      <div className="mb-md flex items-center justify-between">
        <h3 className="text-title-lg text-amud-on-surface">{title}</h3>
        <Link href={seeAllHref} className="text-label-sm text-amud-primary hover:underline">
          Voir tout
        </Link>
      </div>
      <div className="flex flex-col gap-sm">{hasChildren ? children : <p className="text-label-sm text-amud-on-surface-variant">{empty}</p>}</div>
    </div>
  );
}
