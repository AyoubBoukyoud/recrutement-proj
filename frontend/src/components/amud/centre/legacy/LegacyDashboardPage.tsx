'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EmptyState, LoadingState, StatCard } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { canPerform, PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';
import { StudentFormModal } from '@/components/amud/centre/StudentFormModal';
import { TeacherFormModal } from '@/components/amud/centre/TeacherFormModal';
import { FormationFormModal } from '@/components/amud/centre/FormationFormModal';
import { GroupFormModal } from '@/components/amud/centre/GroupFormModal';
import { StudentPaymentFormModal } from '@/components/amud/centre/StudentPaymentFormModal';
import { ScheduleFormModal } from '@/components/amud/centre/ScheduleFormModal';
import { useCurrentCenter } from '@/lib/amud/currentCentre';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { auditLogs } from '@/lib/amud/storage/audit';
import { auditLogSeed } from '@/data/amud/auditLog';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { centerStudentPaymentsCollection } from '@/lib/amud/localCenterStudentPayments';
import { centerStudentPaymentsSeed } from '@/data/amud/centerStudentPayments';
import { centerLeadsCollection } from '@/lib/amud/localCenterLeads';
import { centerLeadsSeed } from '@/data/amud/centerLeads';
import { centerSessionStatesCollection } from '@/lib/amud/localCenterSessionStates';
import { centerSessionStatesSeed } from '@/data/amud/centerSessionStates';
import { quizSessionsCollection } from '@/lib/amud/localQuizSessions';
import { quizSessionsSeed } from '@/data/amud/quizSessions';
import { centerEnrollmentsCollection } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { centerTeacherPaymentsCollection } from '@/lib/amud/localCenterTeacherPayments';
import { centerTeacherPaymentsSeed } from '@/data/amud/centerTeacherPayments';
import {
  computeAttendanceByPeriod,
  computeCenterStats,
  computeGroupFill,
  computeLeadFunnel,
  computePaymentsDistribution,
  computeRevenueSeries,
  computeWeekSessions,
  computeWeeklyPresenceRate,
  todayIso,
} from '@/lib/amud/centerCalculations';
import { resolvePeriod } from '@/lib/amud/analytics/period';
import { AnalyticsCard } from '@/components/amud/analytics/AnalyticsCard';
import { BarChartAmud } from '@/components/amud/analytics/BarChartAmud';
import { DonutChartAmud } from '@/components/amud/analytics/DonutChartAmud';
import { FunnelChartAmud } from '@/components/amud/analytics/FunnelChartAmud';
import { LineChartAmud } from '@/components/amud/analytics/LineChartAmud';

const KPI_LINKS: Record<string, string> = {
  'Étudiants actifs': '/amud/centre/etudiants',
  Enseignants: '/amud/centre/enseignants',
  'Formations actives': '/amud/centre/formations',
  'Groupes actifs': '/amud/centre/groupes',
  'Cours aujourd’hui': '/amud/centre/planning',
  'Taux de présence': '/amud/centre/presences',
  'Revenus étudiants': '/amud/centre/paiements-etudiants',
  'Paiements en attente': '/amud/centre/paiements-etudiants',
  'Séances QR aujourd’hui': '/amud/centre/presences',
  'Quiz en cours': '/amud/centre/statistiques',
};

/**
 * Actions rapides du tableau de bord : chacune ouvre directement la modal
 * correspondante (cahier des charges — « les actions rapides doivent ouvrir
 * directement les Modals »), sans passer par la page de liste. Les modals
 * réutilisées sont exactement celles des pages `/amud/centre/*`, donc la
 * création faite ici produit la même écriture localStorage, la même
 * notification et la même entrée d'activité.
 */
type QuickAction = 'student' | 'teacher' | 'formation' | 'group' | 'payment' | 'schedule';
type CenterPermission = Parameters<typeof canPerform>[1];

const QUICK_ACTIONS: { id: QuickAction; label: string; icon: string; permission: CenterPermission }[] = [
  { id: 'student', label: 'Ajouter étudiant', icon: 'person_add', permission: 'manage-students' },
  { id: 'teacher', label: 'Ajouter enseignant', icon: 'school', permission: 'manage-teachers' },
  { id: 'formation', label: 'Ajouter formation', icon: 'menu_book', permission: 'manage-formations' },
  { id: 'group', label: 'Ajouter groupe', icon: 'diversity_3', permission: 'manage-groups' },
  { id: 'payment', label: 'Ajouter paiement', icon: 'payments', permission: 'manage-student-payments' },
  { id: 'schedule', label: 'Ajouter cours', icon: 'event', permission: 'manage-schedule' },
];

export default function CentreDashboardPage() {
  const notify = useToast();
  const { centerId, role } = useCurrentCenter();
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null);
  const [centres] = useCollection(centresCollection, centresSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [payments] = useCollection(centerStudentPaymentsCollection, centerStudentPaymentsSeed);
  const [leads] = useCollection(centerLeadsCollection, centerLeadsSeed);
  const [logs] = useCollection(auditLogs, auditLogSeed);
  const [sessionStates] = useCollection(centerSessionStatesCollection, centerSessionStatesSeed);
  const [quizSessions] = useCollection(quizSessionsCollection, quizSessionsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [teacherPayments] = useCollection(centerTeacherPaymentsCollection, centerTeacherPaymentsSeed);

  const centre = centres.find((c) => c.id === centerId);
  const today = todayIso();

  const stats = useMemo(() => {
    if (!centre) return null;
    return computeCenterStats(centre.id, { students, teachers, formations, groups, schedules, attendance, studentPayments: payments, teacherPayments, today });
  }, [centre, students, teachers, formations, groups, schedules, attendance, payments, teacherPayments, today]);

  const charts = useMemo(() => {
    const inCentre = <T extends { centerId: string }>(rows: T[]) => rows.filter((r) => r.centerId === centerId);
    const centreAttendance = inCentre(attendance);
    const centrePayments = inCentre(payments);
    const centreLeads = inCentre(leads);
    return {
      revenue: computeRevenueSeries(centrePayments, resolvePeriod('6m')),
      paymentStatus: computePaymentsDistribution(centrePayments),
      presenceTrend: computeWeeklyPresenceRate(centreAttendance, today, 8),
      attendance30d: computeAttendanceByPeriod(centreAttendance, resolvePeriod('30d')),
      weekSessions: computeWeekSessions(inCentre(schedules), today),
      groupFill: computeGroupFill(inCentre(groups), inCentre(enrollments)),
      leadFunnel: computeLeadFunnel(centreLeads),
    };
  }, [centerId, attendance, payments, leads, schedules, groups, enrollments, today]);

  const recentLogs = useMemo(
    () => logs.filter((l) => l.centerId === centerId).sort((a, b) => `${b.date} ${b.heure}`.localeCompare(`${a.date} ${a.heure}`)).slice(0, 8),
    [logs, centerId],
  );
  const newLeads = leads.filter((l) => l.centerId === centerId && l.statut === 'NOUVEAU').length;
  const todaySchedules = schedules.filter((s) => s.centerId === centerId && s.date === today);
  const qrSessionsToday = sessionStates.filter((s) => s.centerId === centerId && todaySchedules.some((sch) => sch.id === s.scheduleId)).length;
  const quizzesLive = quizSessions.filter((s) => s.centerId === centerId && s.status === 'LIVE').length;
  const groupById = (id: string) => groups.find((g) => g.id === id);

  if (!centre || !stats) {
    return <LoadingState label="Chargement du centre…" rows={4} />;
  }

  const actor = { utilisateur: 'Centre (self-service)', role };
  // Les montants (encaissements, impayés, rémunérations) ne sont montrés
  // qu'aux rôles qui ont `view-financials` — le droit existait dans la
  // matrice mais n'était vérifié nulle part.
  const canSeeFinancials = canPerform(role, 'view-financials');
  const weekCourses = charts.weekSessions.reduce((total, d) => total + d.cours, 0);
  const weekHours = charts.weekSessions.reduce((total, d) => total + d.heures, 0);
  const seatsTaken = charts.groupFill.reduce((total, g) => total + g.inscrits, 0);
  const seatsTotal = charts.groupFill.reduce((total, g) => total + g.inscrits + g.libres, 0);

  function openQuickAction(action: QuickAction, permission: CenterPermission) {
    if (!canPerform(role, permission)) {
      notify(PERMISSION_DENIED_MESSAGE, 'error');
      return;
    }
    setQuickAction(action);
  }

  const kpis = [
    { label: 'Étudiants actifs', value: stats.activeStudents, icon: 'group' },
    { label: 'Enseignants', value: stats.totalTeachers, icon: 'school' },
    { label: 'Formations actives', value: stats.activeFormations, icon: 'menu_book' },
    { label: 'Groupes actifs', value: stats.activeGroups, icon: 'diversity_3' },
    { label: 'Cours aujourd’hui', value: stats.coursAujourdhui, icon: 'event' },
    { label: 'Taux de présence', value: stats.tauxPresence, icon: 'fact_check', suffix: '%' },
    ...(canSeeFinancials
      ? [
          { label: 'Revenus étudiants', value: stats.revenus, icon: 'payments', suffix: ' MAD' },
          { label: 'Paiements en attente', value: stats.paiementsEnAttente, icon: 'hourglass_empty', suffix: ' MAD' },
        ]
      : []),
    { label: 'Séances QR aujourd’hui', value: qrSessionsToday, icon: 'qr_code_2' },
    { label: 'Quiz en cours', value: quizzesLive, icon: 'quiz' },
  ];

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-headline-md text-amud-on-surface">{centre.nom}</h1>
        <p className="text-body-md text-amud-on-surface-variant">
          {centre.ville}, {centre.pays} · Tableau de bord du centre
        </p>
      </div>

      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm sm:p-lg">
        <h2 className="mb-md text-title-lg text-amud-on-surface">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-sm sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => openQuickAction(a.id, a.permission)}
              className="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-lg border border-amud-outline-variant px-2 py-3 text-center text-label-sm font-medium text-amud-on-surface transition-colors hover:border-amud-primary hover:bg-amud-primary/5 hover:text-amud-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary"
            >
              <span className="material-symbols-outlined text-amud-primary" aria-hidden="true">
                {a.icon}
              </span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            suffix={kpi.suffix}
            href={KPI_LINKS[kpi.label] ?? '/amud/centre/dashboard'}
          />
        ))}
      </div>


      <section aria-labelledby="centre-dashboard-charts" className="space-y-md">
        <div className="flex flex-wrap items-end justify-between gap-sm">
          <h2 id="centre-dashboard-charts" className="text-title-lg text-amud-on-surface">Vue d’ensemble</h2>
          <Link href="/amud/centre/statistiques" className="text-label-md text-amud-primary hover:underline">
            Statistiques détaillées
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
          {canSeeFinancials ? (
            <AnalyticsCard
              title="Revenus encaissés"
              subtitle={`6 derniers mois · ${charts.revenue.currentTotal.toLocaleString('fr-FR')} MAD encaissés`}
            >
              <BarChartAmud data={charts.revenue.series} series={[{ key: 'value', label: 'Encaissé' }]} unit=" MAD" showLegend={false} ariaLabel="Revenus encaissés par mois sur les 6 derniers mois" />
            </AnalyticsCard>
          ) : null}

          {canSeeFinancials ? (
            <AnalyticsCard title="Paiements par statut" subtitle={`${stats.paiementsEnAttente.toLocaleString('fr-FR')} MAD restent à encaisser`}>
              <DonutChartAmud data={charts.paymentStatus} ariaLabel="Répartition des paiements étudiants par statut" />
            </AnalyticsCard>
          ) : null}

          <AnalyticsCard title="Taux de présence par semaine" subtitle="8 dernières semaines · semaines sans pointage omises">
            <LineChartAmud data={charts.presenceTrend} series={[{ key: 'value', label: 'Présence (dernière semaine)' }]} unit=" %" yDomain={[0, 100]} ariaLabel="Évolution du taux de présence hebdomadaire sur 8 semaines" />
          </AnalyticsCard>

          <AnalyticsCard title="Assiduité" subtitle={`30 derniers jours · ${charts.attendance30d.rates.total} pointage(s)`}>
            <DonutChartAmud data={charts.attendance30d.donutData} centerLabel={`${charts.attendance30d.rates.presenceRate}%`} ariaLabel="Répartition présent, absent, retard, excusé sur 30 jours" />
          </AnalyticsCard>

          <AnalyticsCard title="Cours de la semaine" subtitle={`${weekCourses} cours · ${weekHours.toLocaleString('fr-FR')} h programmées`}>
            <BarChartAmud data={charts.weekSessions} series={[{ key: 'cours', label: 'Cours' }]} showLegend={false} ariaLabel="Nombre de cours programmés par jour cette semaine" />
          </AnalyticsCard>

          <AnalyticsCard title="Remplissage des groupes" subtitle={seatsTotal > 0 ? `${seatsTaken}/${seatsTotal} places occupées (${Math.round((seatsTaken / seatsTotal) * 100)} %)` : 'Aucun groupe en cours'}>
            <BarChartAmud
              data={charts.groupFill}
              series={[
                { key: 'inscrits', label: 'Inscrits' },
                { key: 'libres', label: 'Places libres', color: 'var(--amud-outline-variant)' },
              ]}
              stacked
              horizontal
              height={Math.max(180, charts.groupFill.length * 40 + 40)}
              ariaLabel="Étudiants inscrits et places libres par groupe"
            />
          </AnalyticsCard>

          <AnalyticsCard
            title="Entonnoir des leads"
            subtitle={charts.leadFunnel.rejected > 0 ? `${charts.leadFunnel.rejected} lead(s) rejeté(s) non comptés` : 'Du premier contact à l’inscription'}
            className="lg:col-span-2"
          >
            <FunnelChartAmud stages={charts.leadFunnel.stages} height={220} ariaLabel="Entonnoir des leads : reçus, contactés, intéressés, inscrits" />
          </AnalyticsCard>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm lg:col-span-2">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Cours d’aujourd’hui</h3>
          {todaySchedules.length === 0 ? (
            <EmptyState
              compact
              icon="event_available"
              title="Aucun cours aujourd’hui"
              description="Programmez un cours pour le voir apparaître ici."
              actionLabel={canPerform(role, 'manage-schedule') ? 'Ajouter un cours' : undefined}
              onAction={canPerform(role, 'manage-schedule') ? () => setQuickAction('schedule') : undefined}
            />
          ) : (
            <div className="space-y-sm">
              {todaySchedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-amud-outline-variant px-md py-sm">
                  <div>
                    <p className="text-body-md text-amud-on-surface">{groupById(s.groupId)?.nom ?? 'Groupe'}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">{s.salle}</p>
                  </div>
                  <span className="text-label-md font-medium text-amud-primary">{s.heureDebut} – {s.heureFin}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          {canSeeFinancials ? (
            <>
              <h3 className="mb-md text-title-lg text-amud-on-surface">Rémunérations dues</h3>
              <div className="text-headline-md text-amud-on-surface">{stats.remunerationsDues.toLocaleString('fr-FR')} MAD</div>
              <p className="text-label-sm text-amud-on-surface-variant">Heures effectuées non encore versées</p>
              <Link href="/amud/centre/remuneration" className="mt-sm inline-block text-label-md text-amud-primary hover:underline">
                Voir le détail
              </Link>
            </>
          ) : (
            <>
              <h3 className="mb-md text-title-lg text-amud-on-surface">Cette semaine</h3>
              <div className="text-headline-md text-amud-on-surface">{weekCourses} cours</div>
              <p className="text-label-sm text-amud-on-surface-variant">{weekHours.toLocaleString('fr-FR')} h programmées</p>
              <Link href="/amud/centre/planning" className="mt-sm inline-block text-label-md text-amud-primary hover:underline">
                Voir le planning
              </Link>
            </>
          )}
          <div className="mt-lg border-t border-amud-outline-variant pt-md">
            <h4 className="mb-1 text-label-md font-semibold text-amud-on-surface">Nouveaux leads</h4>
            <div className="text-headline-md text-amud-secondary">{newLeads}</div>
            <Link href="/amud/centre/leads" className="text-label-md text-amud-primary hover:underline">
              Voir les leads
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Activité récente</h3>
        {recentLogs.length === 0 ? (
          <EmptyState compact icon="history" title="Aucune activité" description="Les créations, modifications et suppressions apparaîtront ici." />
        ) : (
          <div className="space-y-sm">
            {recentLogs.map((l) => (
              <div key={l.id} className="flex items-start gap-md">
                <span className="material-symbols-outlined mt-0.5 text-amud-primary">history</span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-md text-amud-on-surface">{l.action}</p>
                  <p className="text-label-sm text-amud-on-surface-variant">{l.utilisateur} · {l.date} à {l.heure}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StudentFormModal open={quickAction === 'student'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
      <TeacherFormModal open={quickAction === 'teacher'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
      <FormationFormModal open={quickAction === 'formation'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
      <GroupFormModal open={quickAction === 'group'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
      <StudentPaymentFormModal open={quickAction === 'payment'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
      <ScheduleFormModal open={quickAction === 'schedule'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
    </div>
  );
}
