'use client';

import { useMemo, useState } from 'react';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed } from '@/data/amud/offres';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed } from '@/data/amud/applications';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { candidatesSeed } from '@/data/amud/candidates';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { KpiCard } from '@/components/amud/analytics/KpiCard';
import { AnalyticsCard } from '@/components/amud/analytics/AnalyticsCard';
import { AnalyticsFilters } from '@/components/amud/analytics/AnalyticsFilters';
import { FunnelChartAmud } from '@/components/amud/analytics/FunnelChartAmud';
import { BarChartAmud } from '@/components/amud/analytics/BarChartAmud';
import { LineChartAmud } from '@/components/amud/analytics/LineChartAmud';
import { getRecruiterStats } from '@/lib/amud/analytics/recruiterStats';
import { resolvePeriod, type PeriodKey, type PeriodRange } from '@/lib/amud/analytics/period';

export default function AmudEntrepriseStatistiquesPage() {
  const [offres] = useCollection(offresCollection, offresSeed);
  const [applications] = useCollection(applicationsCollection, applicationsSeed);
  const [candidates] = useCollection(candidatesCollection, candidatesSeed);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customRange, setCustomRange] = useState<PeriodRange>();

  const myOffres = useMemo(() => offres.filter((o) => o.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [offres]);
  const myApplications = useMemo(() => applications.filter((a) => a.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [applications]);

  const range = useMemo(() => resolvePeriod(period, customRange), [period, customRange]);
  const stats = useMemo(() => getRecruiterStats(myOffres, myApplications, candidates, range), [myOffres, myApplications, candidates, range]);

  const legacyStats = useMemo(() => {
    const totalViews = myOffres.reduce((sum, o) => sum + (o.vues ?? 0), 0);
    const conversion = myApplications.length > 0 ? Math.round((stats.kpis.recrutements / myApplications.length) * 100) : 0;
    const avgApplicationsPerOffer = myOffres.length > 0 ? Math.round((myApplications.length / myOffres.length) * 10) / 10 : 0;
    return { totalViews, conversion, avgApplicationsPerOffer };
  }, [myOffres, myApplications, stats.kpis.recrutements]);

  const selectedOffer = myOffres.find((o) => o.id === selectedOfferId);
  const offerFunnel = useMemo(() => {
    if (!selectedOffer) return null;
    const offerApplications = myApplications.filter((a) => a.offerId === selectedOffer.id);
    const counts = { screening: 0, interview: 0, shortlist: 0, accepted: 0, rejected: 0 };
    for (const a of offerApplications) {
      if (a.status === 'SCREENING') counts.screening += 1;
      if (a.status === 'INTERVIEW') counts.interview += 1;
      if (a.status === 'SHORTLIST') counts.shortlist += 1;
      if (a.status === 'ACCEPTED') counts.accepted += 1;
      if (a.status === 'REJECTED') counts.rejected += 1;
    }
    const conversion = offerApplications.length > 0 ? Math.round((counts.accepted / offerApplications.length) * 100) : 0;
    return { vues: selectedOffer.vues ?? 0, applications: offerApplications.length, ...counts, conversion };
  }, [selectedOffer, myApplications]);

  return (
    <div>
      <div className="mb-lg">
        <h2 className="text-headline-lg text-amud-on-surface">Statistiques</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">Performance de recrutement de {CURRENT_EMPLOYER.entrepriseNom}.</p>
      </div>

      <AnalyticsFilters period={period} onPeriodChange={setPeriod} customRange={customRange} onCustomRangeChange={setCustomRange} />

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        <KpiCard label="Offres actives" value={stats.kpis.offresActives} icon="work" />
        <KpiCard label="Candidatures" value={stats.kpis.candidatures} icon="assignment" trend={stats.trends.candidatures} />
        <KpiCard label="Présélectionnés" value={stats.kpis.preselectionnes} icon="fact_check" />
        <KpiCard label="Entretiens" value={stats.kpis.entretiens} icon="event" />
        <KpiCard label="Finalistes" value={stats.kpis.finalistes} icon="star" />
        <KpiCard label="Recrutements" value={stats.kpis.recrutements} icon="check_circle" trend={stats.trends.recrutements} />
        <KpiCard label="Délai moyen" value={stats.kpis.delaiMoyenJours} icon="schedule" suffix=" j" />
        <KpiCard label="Vues cumulées" value={legacyStats.totalViews} icon="visibility" />
      </div>

      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-2">
        <AnalyticsCard title="Funnel de recrutement" subtitle={`Sur la période sélectionnée · ${myApplications.length} candidatures au total`}>
          <FunnelChartAmud stages={stats.funnel} ariaLabel="Funnel de recrutement : candidatures, présélection, entretiens, finalistes, recrutements" />
        </AnalyticsCard>
        <AnalyticsCard title="Évolution des candidatures">
          <LineChartAmud data={stats.evolutionCandidatures} series={[{ key: 'value', label: 'Candidatures' }]} ariaLabel="Évolution des candidatures sur la période" />
        </AnalyticsCard>
        <AnalyticsCard title="Candidatures par offre">
          <BarChartAmud data={stats.candidaturesParOffre} ariaLabel="Candidatures par offre" horizontal />
        </AnalyticsCard>
        <AnalyticsCard title="Candidats par ville">
          <BarChartAmud data={stats.candidatsParVille} ariaLabel="Candidats par ville" horizontal />
        </AnalyticsCard>
        <AnalyticsCard title="Postes les plus recherchés" subtitle="Parmi les candidats ayant postulé chez vous">
          <BarChartAmud data={stats.topPostesRecherches} ariaLabel="Postes les plus recherchés" horizontal />
        </AnalyticsCard>
      </div>

      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-3">
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <div className="text-headline-md font-bold text-amud-primary">{legacyStats.conversion}%</div>
          <div className="text-label-sm text-amud-on-surface-variant">Taux de conversion global</div>
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <div className="text-headline-md font-bold text-amud-primary">{legacyStats.avgApplicationsPerOffer}</div>
          <div className="text-label-sm text-amud-on-surface-variant">Candidatures / offre en moyenne</div>
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <div className="text-headline-md font-bold text-amud-primary">{stats.kpis.delaiMoyenJours} j</div>
          <div className="text-label-sm text-amud-on-surface-variant">Délai moyen de recrutement</div>
        </div>
      </div>

      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Détail par offre</h3>
        <select
          value={selectedOfferId}
          onChange={(e) => setSelectedOfferId(e.target.value)}
          className="mb-md w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary sm:max-w-sm"
        >
          <option value="">Sélectionner une offre</option>
          {myOffres.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titre}
            </option>
          ))}
        </select>
        {offerFunnel ? (
          <div className="grid grid-cols-2 gap-md sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: 'Vues', value: offerFunnel.vues },
              { label: 'Candidatures', value: offerFunnel.applications },
              { label: 'Présélection', value: offerFunnel.screening },
              { label: 'Entretien', value: offerFunnel.interview },
              { label: 'Shortlist', value: offerFunnel.shortlist },
              { label: 'Acceptées', value: offerFunnel.accepted },
              { label: 'Refusées', value: offerFunnel.rejected },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-amud-outline-variant bg-amud-surface p-sm text-center">
                <div className="text-title-lg font-bold text-amud-on-surface">{s.value}</div>
                <div className="text-label-sm text-amud-on-surface-variant">{s.label}</div>
              </div>
            ))}
            <div className="col-span-2 rounded-lg border border-amud-outline-variant bg-amud-surface p-sm text-center sm:col-span-4 lg:col-span-7">
              <span className="text-label-md text-amud-on-surface-variant">Conversion vues → recrutement : </span>
              <span className="text-label-md font-bold text-amud-primary">{offerFunnel.conversion}%</span>
            </div>
          </div>
        ) : (
          <p className="text-label-md text-amud-on-surface-variant">Sélectionnez une offre pour voir son détail.</p>
        )}
      </div>
    </div>
  );
}
