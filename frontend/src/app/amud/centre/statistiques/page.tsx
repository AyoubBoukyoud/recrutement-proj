'use client';

import { useMemo, useState } from 'react';
import { EmptyState, PageHeader, ResponsiveTable } from '@/components/amud/ui';
import { KpiCard } from '@/components/amud/analytics/KpiCard';
import { AnalyticsCard } from '@/components/amud/analytics/AnalyticsCard';
import { AnalyticsFilters } from '@/components/amud/analytics/AnalyticsFilters';
import { LineChartAmud } from '@/components/amud/analytics/LineChartAmud';
import { AreaChartAmud } from '@/components/amud/analytics/AreaChartAmud';
import { BarChartAmud } from '@/components/amud/analytics/BarChartAmud';
import { DonutChartAmud } from '@/components/amud/analytics/DonutChartAmud';
import { useCurrentCenter } from '@/lib/amud/currentCentre';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerEnrollmentsCollection } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { centerStudentPaymentsCollection } from '@/lib/amud/localCenterStudentPayments';
import { centerStudentPaymentsSeed } from '@/data/amud/centerStudentPayments';
import { centerLeadsCollection } from '@/lib/amud/localCenterLeads';
import { centerLeadsSeed, LEAD_STATUSES, LEAD_STATUS_LABELS } from '@/data/amud/centerLeads';
import { quizResultsCollection } from '@/lib/amud/localQuizResults';
import { quizResultsSeed } from '@/data/amud/quizResults';
import {
  computeCenterStats,
  computeStudentsEvolution,
  computeStudentsByLevel,
  computeFormationDistribution,
  computeAttendanceByPeriod,
  computeRevenueSeries,
  computePaymentsDistribution,
  computeFormationPerformance,
  todayIso,
} from '@/lib/amud/centerCalculations';
import { resolvePeriod, comparePeriods, inRange, previousPeriodRange, type PeriodKey, type PeriodRange } from '@/lib/amud/analytics/period';
import { sum } from '@/lib/amud/analytics/aggregate';

export default function CentreStatistiquesPage() {
  const { centerId } = useCurrentCenter();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [payments] = useCollection(centerStudentPaymentsCollection, centerStudentPaymentsSeed);
  const [leads] = useCollection(centerLeadsCollection, centerLeadsSeed);
  const [quizResults] = useCollection(quizResultsCollection, quizResultsSeed);
  const today = todayIso();

  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customRange, setCustomRange] = useState<PeriodRange>();
  const range = useMemo(() => resolvePeriod(period, customRange), [period, customRange]);

  const stats = useMemo(
    () => computeCenterStats(centerId, { students, teachers, formations, groups, schedules, attendance, studentPayments: payments, today }),
    [centerId, students, teachers, formations, groups, schedules, attendance, payments, today],
  );

  const scopedStudents = useMemo(() => students.filter((s) => s.centerId === centerId), [students, centerId]);
  const scopedFormations = useMemo(() => formations.filter((f) => f.centerId === centerId), [formations, centerId]);
  const scopedGroups = useMemo(() => groups.filter((g) => g.centerId === centerId), [groups, centerId]);
  const scopedEnrollments = useMemo(() => enrollments.filter((e) => e.centerId === centerId), [enrollments, centerId]);
  const scopedAttendance = useMemo(() => attendance.filter((a) => a.centerId === centerId), [attendance, centerId]);
  const scopedPayments = useMemo(() => payments.filter((p) => p.centerId === centerId), [payments, centerId]);
  const scopedLeads = useMemo(() => leads.filter((l) => l.centerId === centerId), [leads, centerId]);
  const scopedQuizResults = useMemo(() => quizResults.filter((r) => r.centerId === centerId), [quizResults, centerId]);

  const studentsEvolution = useMemo(() => computeStudentsEvolution(scopedStudents, range), [scopedStudents, range]);
  const studentsByLevel = useMemo(() => computeStudentsByLevel(scopedStudents), [scopedStudents]);
  const formationDistribution = useMemo(
    () => computeFormationDistribution(scopedStudents, scopedGroups, scopedEnrollments, scopedFormations),
    [scopedStudents, scopedGroups, scopedEnrollments, scopedFormations],
  );
  const attendanceByPeriod = useMemo(() => computeAttendanceByPeriod(scopedAttendance, range), [scopedAttendance, range]);
  const revenueSeries = useMemo(() => computeRevenueSeries(scopedPayments, range), [scopedPayments, range]);
  const paymentsDistribution = useMemo(() => computePaymentsDistribution(scopedPayments), [scopedPayments]);
  const formationPerformance = useMemo(
    () => computeFormationPerformance(scopedFormations, scopedGroups, scopedEnrollments, scopedAttendance, scopedPayments, today),
    [scopedFormations, scopedGroups, scopedEnrollments, scopedAttendance, scopedPayments, today],
  );

  const paiementsEnAttenteTrend = useMemo(() => {
    const outstanding = (list: typeof scopedPayments) => sum(list, (p) => Math.max(0, p.prixTotal - p.montantPaye));
    const current = outstanding(scopedPayments.filter((p) => inRange(p.date, range)));
    const previousRange = previousPeriodRange(range);
    const previous = outstanding(scopedPayments.filter((p) => inRange(p.date, previousRange)));
    return comparePeriods(current, previous, { positiveIsGood: false });
  }, [scopedPayments, range]);

  const quizStats = useMemo(() => {
    if (scopedQuizResults.length === 0) return null;
    const moyenne = Math.round(scopedQuizResults.reduce((sum, r) => sum + r.percentage, 0) / scopedQuizResults.length);
    const quizzesTermines = new Set(scopedQuizResults.map((r) => r.quizSessionId)).size;
    const bonnesReponses = scopedQuizResults.reduce((sum, r) => sum + r.correctCount, 0);
    const mauvaisesReponses = scopedQuizResults.reduce((sum, r) => sum + r.incorrectCount, 0);
    return { moyenne, quizzesTermines, participants: scopedQuizResults.length, donutData: [{ label: 'Bonnes réponses', value: bonnesReponses }, { label: 'Mauvaises réponses', value: mauvaisesReponses }] };
  }, [scopedQuizResults]);

  return (
    <div className="space-y-lg">
      <PageHeader title="Statistiques du centre" subtitle="Vue d’ensemble de l’activité, de l’assiduité et des finances." />

      <AnalyticsFilters period={period} onPeriodChange={setPeriod} customRange={customRange} onCustomRangeChange={setCustomRange} />

      <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
        <KpiCard label="Étudiants actifs" value={stats.activeStudents} icon="group" />
        <KpiCard label="Enseignants" value={stats.totalTeachers} icon="cast_for_education" />
        <KpiCard label="Revenus encaissés" value={stats.revenus} icon="payments" suffix=" MAD" trend={revenueSeries.trend} />
        <KpiCard label="Paiements en attente" value={stats.paiementsEnAttente} icon="hourglass_empty" suffix=" MAD" trend={paiementsEnAttenteTrend} />
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <AnalyticsCard title="Évolution des inscriptions">
          <LineChartAmud data={studentsEvolution} series={[{ key: 'value', label: 'Inscriptions' }]} ariaLabel="Évolution des inscriptions sur la période" />
        </AnalyticsCard>

        <AnalyticsCard title="Assiduité" subtitle={`Basé sur ${attendanceByPeriod.rates.total} présence(s) enregistrée(s) sur la période.`}>
          <DonutChartAmud data={attendanceByPeriod.donutData} ariaLabel="Répartition de l'assiduité : présent, absent, retard, excusé" centerLabel={`${attendanceByPeriod.rates.presenceRate}%`} />
        </AnalyticsCard>

        <AnalyticsCard title="Revenus" subtitle="Paiements encaissés sur la période sélectionnée">
          <AreaChartAmud data={revenueSeries.series} series={[{ key: 'value', label: 'Revenus (MAD)' }]} ariaLabel="Évolution des revenus encaissés sur la période" />
        </AnalyticsCard>

        <AnalyticsCard title="Paiements par statut">
          <DonutChartAmud data={paymentsDistribution} ariaLabel="Répartition des paiements par statut" />
        </AnalyticsCard>

        <AnalyticsCard title="Étudiants par niveau">
          <BarChartAmud data={studentsByLevel} ariaLabel="Répartition des étudiants par niveau" />
        </AnalyticsCard>

        <AnalyticsCard title="Répartition par formation" subtitle="Étudiants actuellement inscrits, par formation">
          <DonutChartAmud data={formationDistribution} ariaLabel="Répartition des étudiants par formation" />
        </AnalyticsCard>

        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Leads par statut</h2>
          <div className="space-y-1">
            {LEAD_STATUSES.map((s) => (
              <div key={s} className="flex justify-between text-body-md">
                <span className="text-amud-on-surface">{LEAD_STATUS_LABELS[s]}</span>
                <span className="font-semibold text-amud-on-surface-variant">{scopedLeads.filter((l) => l.statut === s).length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {quizStats ? (
        <div>
          <h2 className="mb-md text-title-lg text-amud-on-surface">Résultats quiz</h2>
          <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
            <div className="grid grid-cols-2 gap-md lg:col-span-2 lg:grid-cols-3">
              <KpiCard label="Moyenne des quiz" value={quizStats.moyenne} icon="grade" suffix=" %" />
              <KpiCard label="Quiz terminés" value={quizStats.quizzesTermines} icon="quiz" />
              <KpiCard label="Participations" value={quizStats.participants} icon="groups" />
            </div>
            <AnalyticsCard title="Bonnes vs mauvaises réponses">
              <DonutChartAmud data={quizStats.donutData} ariaLabel="Répartition des bonnes et mauvaises réponses aux quiz" />
            </AnalyticsCard>
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-md text-title-lg text-amud-on-surface">Performance des formations</h2>
        <ResponsiveTable
          columns={['Formation', 'Étudiants', 'Assiduité', 'Progression', 'Revenus']}
          rows={formationPerformance.map((row) => ({
            id: row.formationId,
            cells: [row.formation, row.studentsCount, `${row.avgAttendance}%`, `${row.progression}%`, `${row.revenue.toLocaleString('fr-FR')} MAD`],
          }))}
          empty={<EmptyState compact icon="menu_book" title="Aucune formation" description="Créez une formation pour suivre sa performance." />}
        />
      </div>
    </div>
  );
}
