'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { KpiCard } from '@/components/amud/analytics/KpiCard';
import { AnalyticsCard } from '@/components/amud/analytics/AnalyticsCard';
import { AnalyticsFilters } from '@/components/amud/analytics/AnalyticsFilters';
import { FunnelChartAmud } from '@/components/amud/analytics/FunnelChartAmud';
import { BarChartAmud } from '@/components/amud/analytics/BarChartAmud';
import { LineChartAmud } from '@/components/amud/analytics/LineChartAmud';
import { resolvePeriod, type PeriodKey, type PeriodRange } from '@/lib/amud/analytics/period';

/*
 * Statistiques — porte le style de la maquette `/amud/entreprise/statistiques`
 * (KPI, funnel, graphiques) sur `GET /recruiter/stats`, nouvel endpoint
 * agrégeant les vraies offres/candidatures/entretiens du recruteur connecté
 * (rien n'existait à cette adresse avant : seul `/admin/metrics`, réservé aux
 * administrateurs et à l'échelle de la plateforme, existait).
 */
type Point = { label: string; value: number };
type Stats = {
  kpis: {
    offres_actives: number;
    candidatures: number;
    preselectionnes: number;
    entretiens: number;
    finalistes: number;
    recrutements: number;
    delai_moyen_jours: number | null;
  };
  funnel: Point[];
  evolution_candidatures: { date: string; value: number }[];
  candidatures_par_offre: Point[];
  candidats_par_ville: Point[];
  top_postes_recherches: Point[];
};

function daysFor(period: PeriodKey, range?: PeriodRange): number {
  if (period === 'custom' && range) {
    const diff = Math.round((new Date(range.end).getTime() - new Date(range.start).getTime()) / 86_400_000);
    return Math.max(1, diff + 1);
  }
  return { today: 1, '7d': 7, '30d': 30, '3m': 90, '6m': 180, year: 365, custom: 30 }[period];
}

export default function RecruiterStatistiquesPage() {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customRange, setCustomRange] = useState<PeriodRange>();
  const days = useMemo(() => daysFor(period, customRange), [period, customRange]);
  // `resolvePeriod` is only used to keep `DateRangeFilter`'s custom-range picker consistent with the rest of the module.
  resolvePeriod(period, customRange);

  const stats = useQuery({
    queryKey: ['recruiter-stats', days],
    queryFn: () => api.get('/recruiter/stats', { params: { days } }).then((r) => r.data as Stats),
  });

  const s = stats.data;

  return (
    <div>
      <div className="mb-lg">
        <h2 className="text-headline-lg text-amud-on-surface">Statistiques</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">Performance de recrutement sur vos offres.</p>
      </div>

      <AnalyticsFilters period={period} onPeriodChange={setPeriod} customRange={customRange} onCustomRangeChange={setCustomRange} />

      {stats.isLoading || !s ? (
        <p className="text-body-md text-amud-on-surface-variant">Chargement…</p>
      ) : (
        <>
          <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
            <KpiCard label="Offres actives" value={s.kpis.offres_actives} icon="work" />
            <KpiCard label="Candidatures" value={s.kpis.candidatures} icon="assignment" />
            <KpiCard label="Présélectionnés" value={s.kpis.preselectionnes} icon="fact_check" />
            <KpiCard label="Entretiens" value={s.kpis.entretiens} icon="event" />
            <KpiCard label="Finalistes" value={s.kpis.finalistes} icon="star" />
            <KpiCard label="Recrutements" value={s.kpis.recrutements} icon="check_circle" />
            <KpiCard label="Délai moyen" value={s.kpis.delai_moyen_jours ?? 0} icon="schedule" suffix=" j" />
          </div>

          <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-2">
            <AnalyticsCard title="Funnel de recrutement" subtitle={`Sur la période sélectionnée · ${s.kpis.candidatures} candidature(s)`}>
              <FunnelChartAmud stages={s.funnel} ariaLabel="Funnel de recrutement : candidatures, vues, entretiens, recrutements" />
            </AnalyticsCard>
            <AnalyticsCard title="Évolution des candidatures">
              <LineChartAmud data={s.evolution_candidatures} series={[{ key: 'value', label: 'Candidatures' }]} xKey="date" ariaLabel="Évolution des candidatures sur la période" />
            </AnalyticsCard>
            <AnalyticsCard title="Candidatures par offre">
              <BarChartAmud data={s.candidatures_par_offre} ariaLabel="Candidatures par offre" horizontal />
            </AnalyticsCard>
            <AnalyticsCard title="Candidats par ville">
              <BarChartAmud data={s.candidats_par_ville} ariaLabel="Candidats par ville" horizontal />
            </AnalyticsCard>
            <AnalyticsCard title="Postes les plus recherchés" subtitle="Parmi les candidats ayant postulé chez vous" className="sm:col-span-2">
              <BarChartAmud data={s.top_postes_recherches} ariaLabel="Postes les plus recherchés" horizontal />
            </AnalyticsCard>
          </div>
        </>
      )}
    </div>
  );
}
