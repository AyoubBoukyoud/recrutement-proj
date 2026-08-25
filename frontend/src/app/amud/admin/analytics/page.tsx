'use client';

import { useMemo, useState } from 'react';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { candidatesSeed } from '@/data/amud/candidates';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { entreprisesSeed } from '@/data/amud/entreprises';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed } from '@/data/amud/offres';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed } from '@/data/amud/applications';
import { activitesCollection } from '@/lib/amud/localCommercialActivites';
import { activitesSeed } from '@/data/amud/commercialActivites';
import { auditLogs } from '@/lib/amud/storage/audit';
import { auditLogSeed } from '@/data/amud/auditLog';
import { getAdminStats } from '@/lib/amud/analytics/adminStats';
import { topN } from '@/lib/amud/analytics/aggregate';
import { resolvePeriod, type PeriodKey, type PeriodRange } from '@/lib/amud/analytics/period';
import { KpiCard } from '@/components/amud/analytics/KpiCard';
import { AnalyticsCard } from '@/components/amud/analytics/AnalyticsCard';
import { AnalyticsFilters } from '@/components/amud/analytics/AnalyticsFilters';
import { LineChartAmud } from '@/components/amud/analytics/LineChartAmud';
import { BarChartAmud } from '@/components/amud/analytics/BarChartAmud';
import { DonutChartAmud } from '@/components/amud/analytics/DonutChartAmud';
import { FunnelChartAmud } from '@/components/amud/analytics/FunnelChartAmud';
import { ActivityHistogram } from '@/components/amud/analytics/ActivityHistogram';
import { SelectFilter, ResponsiveTable } from '@/components/amud/ui';

/**
 * `/amud/admin/analytics` — déclinaison "deep dive" du tableau de bord
 * (`/amud/admin`) : mêmes KPI/graphiques que `getAdminStats`, mais pilotés
 * par un vrai sélecteur de période + des filtres ville/centre/statut d'offre,
 * plutôt que la fenêtre fixe de 30 jours utilisée sur le tableau de bord.
 */
export default function AmudAdminAnalyticsPage() {
  const [candidates] = useCollection(candidatesCollection, candidatesSeed);
  const [entreprises] = useCollection(entreprisesCollection, entreprisesSeed);
  const [centres] = useCollection(centresCollection, centresSeed);
  const [centerStudents] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [centerTeachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [centerFormations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [applications] = useCollection(applicationsCollection, applicationsSeed);
  const [activites] = useCollection(activitesCollection, activitesSeed);
  const [auditEntries] = useCollection(auditLogs, auditLogSeed);

  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customRange, setCustomRange] = useState<PeriodRange>();
  const [ville, setVille] = useState('');
  const [centreId, setCentreId] = useState('');
  const [statutOffre, setStatutOffre] = useState('');

  const range = useMemo(() => resolvePeriod(period, customRange), [period, customRange]);

  const villeOptions = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.ville))).sort().map((v) => ({ value: v, label: v })),
    [candidates],
  );
  const centreOptions = useMemo(() => centres.map((c) => ({ value: c.id, label: c.nom })), [centres]);
  const statutOptions = useMemo(
    () => Array.from(new Set(offres.map((o) => o.statut))).sort().map((s) => ({ value: s, label: s })),
    [offres],
  );

  const filteredCandidates = useMemo(() => (ville ? candidates.filter((c) => c.ville === ville) : candidates), [candidates, ville]);
  const filteredCentres = useMemo(() => (centreId ? centres.filter((c) => c.id === centreId) : centres), [centres, centreId]);
  const filteredCenterTeachers = useMemo(
    () => (centreId ? centerTeachers.filter((t) => t.centerId === centreId) : centerTeachers),
    [centerTeachers, centreId],
  );
  const filteredCenterStudents = useMemo(
    () => (centreId ? centerStudents.filter((s) => s.centerId === centreId) : centerStudents),
    [centerStudents, centreId],
  );
  const filteredCenterFormations = useMemo(
    () => (centreId ? centerFormations.filter((f) => f.centerId === centreId) : centerFormations),
    [centerFormations, centreId],
  );
  const filteredOffres = useMemo(() => (statutOffre ? offres.filter((o) => o.statut === statutOffre) : offres), [offres, statutOffre]);
  const filteredAuditEntries = useMemo(
    () => (centreId ? auditEntries.filter((l) => l.centerId === centreId) : auditEntries),
    [auditEntries, centreId],
  );

  const stats = useMemo(
    () =>
      getAdminStats(
        filteredCandidates,
        entreprises,
        filteredCentres,
        filteredCenterTeachers,
        filteredCenterStudents,
        filteredCenterFormations,
        filteredOffres,
        applications,
        activites,
        filteredAuditEntries,
        range,
      ),
    [filteredCandidates, entreprises, filteredCentres, filteredCenterTeachers, filteredCenterStudents, filteredCenterFormations, filteredOffres, applications, activites, filteredAuditEntries, range],
  );

  const topOffres = useMemo(() => topN(applications, (a) => a.offerTitre), [applications]);

  return (
    <div>
      <div className="mb-lg">
        <h2 className="text-headline-lg text-amud-on-surface">Analytique</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">Vue d&apos;ensemble détaillée et filtrable de la plateforme Amud Skills.</p>
      </div>

      <AnalyticsFilters period={period} onPeriodChange={setPeriod} customRange={customRange} onCustomRangeChange={setCustomRange}>
        <SelectFilter label="Ville" value={ville} onChange={setVille} options={villeOptions} />
        <SelectFilter label="Centre" value={centreId} onChange={setCentreId} options={centreOptions} />
        <SelectFilter label="Statut de l'offre" value={statutOffre} onChange={setStatutOffre} options={statutOptions} />
      </AnalyticsFilters>

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        <KpiCard label="Total candidats" value={stats.kpis.totalCandidats} icon="group" trend={stats.trends.totalCandidats} />
        <KpiCard label="Total entreprises" value={stats.kpis.totalEntreprises} icon="domain" />
        <KpiCard label="Total centres partenaires" value={stats.kpis.totalCentres} icon="school" trend={stats.trends.totalCentres} />
        <KpiCard label="Total enseignants" value={stats.kpis.totalEnseignants} icon="cast_for_education" />
        <KpiCard label="Total étudiants" value={stats.kpis.totalEtudiants} icon="group" trend={stats.trends.totalEtudiants} />
        <KpiCard label="Total formations" value={stats.kpis.totalFormations} icon="menu_book" />
        <KpiCard label="Total offres" value={stats.kpis.totalOffres} icon="work" />
        <KpiCard label="Appels commerciaux aujourd'hui" value={stats.kpis.appelsAujourdhui} icon="call" />
      </div>

      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-2">
        <AnalyticsCard title="Évolution des inscriptions" subtitle="Étudiants, candidats et nouveaux centres sur la période">
          <LineChartAmud
            data={stats.inscriptions}
            series={[
              { key: 'candidats', label: 'Candidats' },
              { key: 'etudiants', label: 'Étudiants (centres)' },
              { key: 'centres', label: 'Nouveaux centres' },
            ]}
            ariaLabel="Évolution des inscriptions : candidats, étudiants et nouveaux centres"
          />
        </AnalyticsCard>
        <AnalyticsCard title="Répartition des centres partenaires">
          <DonutChartAmud data={stats.centresRepartition} ariaLabel="Répartition des centres partenaires" centerLabel={`${filteredCentres.length}`} />
        </AnalyticsCard>
        <AnalyticsCard title="Candidats par ville">
          <BarChartAmud data={stats.candidatsParVille} ariaLabel="Candidats par ville" horizontal />
        </AnalyticsCard>
        <AnalyticsCard title="Activité commerciale par jour de semaine">
          <ActivityHistogram data={stats.activiteCommercialeHebdo} ariaLabel="Activités commerciales par jour de semaine" />
        </AnalyticsCard>
        <AnalyticsCard title="Funnel de recrutement" subtitle="Sur l'ensemble des candidatures de la plateforme">
          <FunnelChartAmud stages={stats.funnel} ariaLabel="Funnel de recrutement : candidatures, présélection, entretiens, finalistes, recrutements" />
        </AnalyticsCard>
        <AnalyticsCard title="Offres par statut">
          <DonutChartAmud data={stats.offresParStatut} ariaLabel="Offres par statut" centerLabel={`${filteredOffres.length}`} />
        </AnalyticsCard>
        <AnalyticsCard title="Activité de la plateforme par jour de semaine" subtitle="Journal d'audit">
          <ActivityHistogram data={stats.activitePlateformeHebdo} ariaLabel="Activité de la plateforme par jour de semaine" />
        </AnalyticsCard>
        <AnalyticsCard title="Heures les plus actives" subtitle="Journal d'audit">
          <ActivityHistogram data={stats.activitePlateformeHoraire} ariaLabel="Activité de la plateforme par heure" />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <div>
          <h3 className="mb-md text-title-lg text-amud-on-surface">Top villes (candidats)</h3>
          <ResponsiveTable
            columns={['Ville', 'Candidats']}
            rows={stats.candidatsParVille.map((row) => ({ id: row.label, cells: [row.label, row.value] }))}
            empty={<p className="p-lg text-body-md text-amud-on-surface-variant">Aucun candidat sur la période.</p>}
          />
        </div>
        <div>
          <h3 className="mb-md text-title-lg text-amud-on-surface">Top offres (candidatures)</h3>
          <ResponsiveTable
            columns={['Offre', 'Candidatures']}
            rows={topOffres.map((row) => ({ id: row.label, cells: [row.label, row.value] }))}
            empty={<p className="p-lg text-body-md text-amud-on-surface-variant">Aucune candidature.</p>}
          />
        </div>
      </div>
    </div>
  );
}
