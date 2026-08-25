'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { EmptyState, LoadingState, StatCard } from '@/components/amud/ui';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerEnrollmentsCollection } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerTeacherPaymentsCollection } from '@/lib/amud/localCenterTeacherPayments';
import { centerTeacherPaymentsSeed } from '@/data/amud/centerTeacherPayments';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { notifications as notificationsCollection } from '@/lib/amud/storage/notify';
import { notificationsSeed } from '@/data/amud/notifications';
import { studentResultsCollection } from '@/lib/amud/localStudentResults';
import { centerStudentResultsSeed } from '@/data/amud/centerStudentResults';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { AnalyticsCard } from '@/components/amud/analytics/AnalyticsCard';
import { KpiCard } from '@/components/amud/analytics/KpiCard';
import { BarChartAmud } from '@/components/amud/analytics/BarChartAmud';
import { LineChartAmud } from '@/components/amud/analytics/LineChartAmud';
import { ActivityHistogram } from '@/components/amud/analytics/ActivityHistogram';
import { EmptyChartState } from '@/components/amud/analytics/EmptyChartState';
import { getTeacherStats } from '@/lib/amud/analytics/teacherStats';
import { resolvePeriod } from '@/lib/amud/analytics/period';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function TeacherDashboardPage() {
  const { teacherId } = useCurrentTeacher();
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [payments] = useCollection(centerTeacherPaymentsCollection, centerTeacherPaymentsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);
  const [studentResults] = useCollection(studentResultsCollection, centerStudentResultsSeed);
  const [allStudents] = useCollection(centerStudentsCollection, centerStudentsSeed);

  const teacher = teachers.find((t) => t.id === teacherId);
  const today = todayIso();
  const thisMonth = currentMonthIso();

  // Groupes de l'enseignant
  const myGroups = useMemo(() => groups.filter((g) => g.enseignantId === teacherId), [groups, teacherId]);

  // Étudiants actifs dans mes groupes
  const myGroupIds = useMemo(() => new Set(myGroups.map((g) => g.id)), [myGroups]);
  const activeEnrollments = useMemo(
    () => enrollments.filter((e) => myGroupIds.has(e.groupId) && e.statut === 'ACTIF'),
    [enrollments, myGroupIds],
  );

  // Étudiants (dédupliqués) réellement inscrits dans mes groupes — base de
  // scope pour teacherStats (StudentResult n'a pas de lien direct enseignant).
  const myStudents = useMemo(() => {
    const ids = new Set(activeEnrollments.map((e) => e.studentId));
    return allStudents.filter((s) => ids.has(s.id));
  }, [activeEnrollments, allStudents]);

  // Cours aujourd'hui
  const todaySchedules = useMemo(
    () => schedules.filter((s) => s.enseignantId === teacherId && s.date === today),
    [schedules, teacherId, today],
  );

  // Prochain cours
  const nextSchedule = useMemo(
    () =>
      schedules
        .filter((s) => s.enseignantId === teacherId && s.date >= today)
        .sort((a, b) => `${a.date} ${a.heureDebut}`.localeCompare(`${b.date} ${b.heureDebut}`))[0] ?? null,
    [schedules, teacherId, today],
  );

  // Heures ce mois
  const hoursThisMonth = useMemo(() => {
    const monthSchedules = schedules.filter((s) => s.enseignantId === teacherId && s.date.startsWith(thisMonth));
    return monthSchedules.reduce((sum, s) => {
      const [dh, dm] = s.heureDebut.split(':').map(Number);
      const [fh, fm] = s.heureFin.split(':').map(Number);
      return sum + (fh * 60 + fm - (dh * 60 + dm)) / 60;
    }, 0);
  }, [schedules, teacherId, thisMonth]);

  // Présences à enregistrer (cours passés sans présences)
  const pendingAttendance = useMemo(() => {
    const pastScheduleIds = new Set(
      schedules.filter((s) => s.enseignantId === teacherId && s.date < today).map((s) => s.id),
    );
    const recordedScheduleIds = new Set(attendance.map((a) => a.scheduleId));
    return Array.from(pastScheduleIds).filter((id) => !recordedScheduleIds.has(id)).length;
  }, [schedules, teacherId, today, attendance]);


  // Rémunérations
  const myPayments = useMemo(() => payments.filter((p) => p.enseignantId === teacherId), [payments, teacherId]);
  const remunerationPaye = myPayments.filter((p) => p.statut === 'PAYE').reduce((s, p) => s + p.montant, 0);
  const remunerationAttente = myPayments.filter((p) => p.statut === 'EN_ATTENTE').reduce((s, p) => s + p.montant, 0);

  // Notifications
  const unreadNotifs = useMemo(
    () => allNotifications.filter((n) => n.scope === 'teacher' && (!n.targetId || n.targetId === teacherId) && !n.read),
    [allNotifications, teacherId],
  );

  // Statistiques dynamiques (KPIs additionnels + graphiques) — voir teacherStats.ts.
  const statsRange = useMemo(() => resolvePeriod('year'), []);
  const teacherStats = useMemo(
    () =>
      getTeacherStats(
        teacherId,
        { id: teacherId, tauxHoraire: teacher?.tauxHoraire ?? 0 },
        groups,
        schedules,
        attendance,
        studentResults,
        myStudents,
        statsRange,
      ),
    [teacherId, teacher, groups, schedules, attendance, studentResults, myStudents, statsRange],
  );

  if (!teacher) return <LoadingState label="Chargement de votre espace…" rows={4} />;

  const kpis = [
    { label: 'Mes groupes', value: myGroups.length, icon: 'diversity_3', href: '/amud/teacher/groups' },
    { label: 'Mes étudiants', value: activeEnrollments.length, icon: 'group', href: '/amud/teacher/students' },
    { label: "Cours aujourd'hui", value: todaySchedules.length, icon: 'event', href: '/amud/teacher/planning' },
    { label: 'Heures ce mois', value: Math.round(hoursThisMonth), icon: 'schedule', suffix: 'h', href: '/amud/teacher/hours' },
  ];

  return (
    <div className="space-y-lg">
      {/* En-tête */}
      <div className="rounded-xl border border-amud-outline-variant bg-gradient-to-br from-amud-primary/10 to-amud-surface-container-lowest p-lg shadow-sm">
        <p className="text-label-md text-amud-on-surface-variant">Bonjour,</p>
        <h1 className="text-headline-md text-amud-on-surface">{teacher.prenom} {teacher.nom}</h1>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">
          {teacher.specialite} · {myGroups.length} groupe{myGroups.length > 1 ? 's' : ''}
        </p>
        {pendingAttendance > 0 && (
          <div className="mt-md flex items-center gap-sm rounded-lg bg-amud-secondary/10 px-md py-sm">
            <span className="material-symbols-outlined text-amud-secondary">warning</span>
            <p className="text-body-md text-amud-secondary">
              {pendingAttendance} présence{pendingAttendance > 1 ? 's' : ''} à enregistrer
            </p>
            <Link href="/amud/teacher/attendance" className="ml-auto text-label-md font-semibold text-amud-secondary hover:underline">
              Enregistrer →
            </Link>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} suffix={kpi.suffix} href={kpi.href} />
        ))}
      </div>

      {/* KPIs additionnels (statistiques calculées, teacherStats.ts) */}
      <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
        <KpiCard label="Présence moyenne" value={teacherStats.kpis.presenceMoyenne} icon="fact_check" suffix="%" />
        <KpiCard label="Évaluations" value={teacherStats.kpis.evaluations} icon="grading" href="/amud/teacher/students" />
        <KpiCard label="Rémunération" value={teacherStats.kpis.remuneration} icon="payments" suffix=" MAD" href="/amud/teacher/remuneration" />
        <KpiCard label="Étudiants à risque" value={teacherStats.kpis.etudiantsARisque} icon="warning" href="/amud/teacher/students" />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <AnalyticsCard title="Présence par groupe" subtitle="Taux de présence de chacun de mes groupes">
          <BarChartAmud data={teacherStats.presenceParGroupe} ariaLabel="Taux de présence par groupe" horizontal />
        </AnalyticsCard>
        <AnalyticsCard title="Progression des étudiants" subtitle="Répartition par moyenne des évaluations">
          {teacherStats.progressionEtudiants.length === 0 ? (
            <EmptyChartState />
          ) : (
            <BarChartAmud data={teacherStats.progressionEtudiants} ariaLabel="Répartition des étudiants par niveau de progression" />
          )}
        </AnalyticsCard>
        <AnalyticsCard title="Évolution des performances" subtitle="Moyenne des notes (%) dans le temps">
          <LineChartAmud
            data={teacherStats.evolutionPerformances}
            series={[{ key: 'value', label: 'Moyenne (%)' }]}
            ariaLabel="Évolution de la moyenne des notes de mes étudiants"
          />
        </AnalyticsCard>
        <AnalyticsCard title="Heures enseignées" subtitle="Répartition par jour de la semaine">
          <ActivityHistogram data={teacherStats.heuresParJour} ariaLabel="Heures enseignées par jour de la semaine" />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        {/* Prochain cours */}
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm lg:col-span-2">
          <h2 className="mb-md flex items-center gap-sm text-title-lg text-amud-on-surface">
            <span className="material-symbols-outlined text-amud-primary">event</span>
            Prochain cours
          </h2>
          {nextSchedule ? (
            <div className="rounded-lg border border-amud-primary/20 bg-amud-primary/5 p-md">
              <div className="flex flex-wrap items-start justify-between gap-sm">
                <div>
                  <p className="text-title-md font-semibold text-amud-on-surface">
                    {new Date(nextSchedule.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-body-md text-amud-on-surface-variant">
                    {groups.find((g) => g.id === nextSchedule.groupId)?.nom ?? '—'} · Salle {nextSchedule.salle}
                  </p>
                  <p className="text-label-sm text-amud-on-surface-variant">
                    {formations.find((f) => f.id === nextSchedule.formationId)?.nom ?? '—'}
                  </p>
                </div>
                <span className="rounded-full bg-amud-primary px-md py-1 text-label-md font-semibold text-white">
                  {nextSchedule.heureDebut} – {nextSchedule.heureFin}
                </span>
              </div>
            </div>
          ) : (
            <EmptyState compact icon="event_available" title="Aucun cours à venir" description="Votre planning apparaîtra ici." />
          )}
        </div>

        {/* Rémunération */}
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Rémunération</h2>
          <div className="space-y-sm">
            <div>
              <p className="text-label-sm text-amud-on-surface-variant">Payé</p>
              <p className="text-title-lg font-bold text-amud-primary">{remunerationPaye.toLocaleString('fr-FR')} MAD</p>
            </div>
            <div>
              <p className="text-label-sm text-amud-on-surface-variant">En attente</p>
              <p className="text-title-lg font-bold text-amud-secondary">{remunerationAttente.toLocaleString('fr-FR')} MAD</p>
            </div>
          </div>
          <Link href="/amud/teacher/remuneration" className="mt-md block text-label-md text-amud-primary hover:underline">
            Voir le détail →
          </Link>

          {unreadNotifs.length > 0 && (
            <div className="mt-md border-t border-amud-outline-variant pt-md">
              <p className="mb-sm text-label-sm font-semibold text-amud-on-surface">Notifications</p>
              <div className="space-y-sm">
                {unreadNotifs.slice(0, 2).map((n) => (
                  <div key={n.id} className="flex items-start gap-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amud-secondary" />
                    <p className="text-label-sm text-amud-on-surface">{n.title}</p>
                  </div>
                ))}
                <Link href="/amud/teacher/notifications" className="text-label-sm text-amud-primary hover:underline">
                  Voir toutes →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mes groupes */}
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md flex items-center justify-between text-title-lg text-amud-on-surface">
          Mes groupes
          <Link href="/amud/teacher/groups" className="text-label-md text-amud-primary hover:underline">Voir tous →</Link>
        </h2>
        {myGroups.length === 0 ? (
          <EmptyState compact icon="diversity_3" title="Aucun groupe" description="Vous n'êtes pas encore affecté à un groupe." />
        ) : (
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2 lg:grid-cols-3">
            {myGroups.slice(0, 6).map((g) => {
              const f = formations.find((f) => f.id === g.formationId);
              const count = enrollments.filter((e) => e.groupId === g.id && e.statut === 'ACTIF').length;
              return (
                <Link key={g.id} href="/amud/teacher/groups" className="rounded-lg border border-amud-outline-variant p-md transition-colors hover:border-amud-primary hover:bg-amud-primary/5">
                  <p className="text-body-md font-semibold text-amud-on-surface">{g.nom}</p>
                  <p className="text-label-sm text-amud-on-surface-variant">{f?.nom ?? '—'} · {g.niveau}</p>
                  <p className="text-label-sm text-amud-on-surface-variant">{count} étudiant{count > 1 ? 's' : ''}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
