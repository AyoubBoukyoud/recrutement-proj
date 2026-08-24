'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { EmptyState, LoadingState, StatCard } from '@/components/amud/ui';
import { useCurrentStudent } from '@/lib/amud/currentStudent';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
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
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { notifications as notificationsCollection } from '@/lib/amud/storage/notify';
import { notificationsSeed } from '@/data/amud/notifications';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_CLASS, ATTENDANCE_LABELS } from '@/data/amud/centerTypes';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function StudentDashboardPage() {
  const { studentId } = useCurrentStudent();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [payments] = useCollection(centerStudentPaymentsCollection, centerStudentPaymentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);

  const student = students.find((s) => s.id === studentId);
  const today = todayIso();

  // Inscription active
  const enrollment = useMemo(() => enrollments.find((e) => e.studentId === studentId && e.statut === 'ACTIF'), [enrollments, studentId]);
  const group = useMemo(() => groups.find((g) => g.id === enrollment?.groupId), [groups, enrollment]);
  const formation = useMemo(() => formations.find((f) => f.id === group?.formationId), [formations, group]);

  // Enseignant principal
  const mainTeacher = useMemo(() => teachers.find((t) => t.id === group?.enseignantId), [teachers, group]);

  // Prochain cours
  const nextSchedule = useMemo(() => {
    if (!enrollment?.groupId) return null;
    return schedules
      .filter((s) => s.groupId === enrollment.groupId && s.date >= today)
      .sort((a, b) => `${a.date} ${a.heureDebut}`.localeCompare(`${b.date} ${b.heureDebut}`))[0] ?? null;
  }, [schedules, enrollment, today]);

  // Présences
  const myAttendance = useMemo(() => attendance.filter((a) => a.studentId === studentId), [attendance, studentId]);
  const present = myAttendance.filter((a) => a.statut === 'PRESENT').length;
  const tauxPresence = myAttendance.length > 0 ? Math.round((present / myAttendance.length) * 100) : 0;

  // Paiements
  const myPayments = useMemo(() => payments.filter((p) => p.studentId === studentId), [payments, studentId]);
  const totalDu = myPayments.reduce((s, p) => s + p.prixTotal, 0);
  const totalPaye = myPayments.reduce((s, p) => s + p.montantPaye, 0);
  const montantRestant = Math.max(0, totalDu - totalPaye);

  // Notifications non lues
  const unreadNotifs = useMemo(
    () => allNotifications.filter((n) => n.scope === 'student' && (!n.targetId || n.targetId === studentId) && !n.read),
    [allNotifications, studentId],
  );

  if (!student) return <LoadingState label="Chargement de votre espace…" rows={4} />;

  const kpis = [
    { label: 'Formation', value: formation?.nom ?? '—', icon: 'menu_book', href: '/amud/student/formation', isText: true },
    { label: 'Taux de présence', value: tauxPresence, icon: 'fact_check', suffix: '%', href: '/amud/student/presences' },
    { label: 'Montant payé', value: totalPaye, icon: 'payments', suffix: ' MAD', href: '/amud/student/payments' },
    { label: 'Montant restant', value: montantRestant, icon: 'account_balance_wallet', suffix: ' MAD', href: '/amud/student/payments' },
  ];

  return (
    <div className="space-y-lg">
      {/* En-tête */}
      <div className="rounded-xl border border-amud-outline-variant bg-gradient-to-br from-amud-secondary/10 to-amud-surface-container-lowest p-lg shadow-sm">
        <p className="text-label-md text-amud-on-surface-variant">Bienvenue,</p>
        <h1 className="text-headline-md text-amud-on-surface">{student.prenom} {student.nom}</h1>
        {formation && (
          <p className="mt-1 text-body-md text-amud-on-surface-variant">
            {formation.nom} · Niveau {student.niveau}
            {group ? ` · Groupe ${group.nom}` : ''}
          </p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
        {kpis.map((kpi) =>
          kpi.isText ? (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm transition-all hover:-translate-y-0.5 hover:border-amud-primary hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amud-primary-container">
                <span className="material-symbols-outlined text-[18px] text-white">{kpi.icon}</span>
              </div>
              <p className="text-label-sm text-amud-on-surface-variant">{kpi.label}</p>
              <p className="text-body-md font-semibold text-amud-on-surface truncate">{kpi.value}</p>
            </Link>
          ) : (
            <StatCard key={kpi.label} label={kpi.label} value={kpi.value as number} icon={kpi.icon} suffix={kpi.suffix} href={kpi.href} />
          ),
        )}
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
                  <p className="text-body-md text-amud-on-surface-variant">{formation?.nom ?? '—'}</p>
                  <p className="text-label-sm text-amud-on-surface-variant">
                    {mainTeacher ? `${mainTeacher.prenom} ${mainTeacher.nom}` : '—'} · Salle {nextSchedule.salle}
                  </p>
                </div>
                <span className="rounded-full bg-amud-primary px-md py-1 text-label-md font-semibold text-white">
                  {nextSchedule.heureDebut} – {nextSchedule.heureFin}
                </span>
              </div>
            </div>
          ) : (
            <EmptyState compact icon="event_available" title="Aucun cours à venir" description="Votre planning apparaîtra ici dès qu'un cours est programmé." />
          )}
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md flex items-center gap-sm text-title-lg text-amud-on-surface">
            <span className="material-symbols-outlined text-amud-secondary">notifications</span>
            Notifications
            {unreadNotifs.length > 0 && (
              <span className="ml-auto rounded-full bg-amud-secondary px-2 py-0.5 text-label-sm font-bold text-white">{unreadNotifs.length}</span>
            )}
          </h2>
          {unreadNotifs.length === 0 ? (
            <p className="text-label-sm text-amud-on-surface-variant">Aucune nouvelle notification.</p>
          ) : (
            <div className="space-y-sm">
              {unreadNotifs.slice(0, 4).map((n) => (
                <div key={n.id} className="flex items-start gap-sm rounded-lg bg-amud-secondary/5 p-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amud-secondary" />
                  <span className="text-body-md text-amud-on-surface">{n.title}</span>
                </div>
              ))}
              <Link href="/amud/student/notifications" className="block pt-1 text-label-sm text-amud-primary hover:underline">
                Voir toutes les notifications →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Dernières présences */}
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md flex items-center gap-sm text-title-lg text-amud-on-surface">
          <span className="material-symbols-outlined text-amud-primary">fact_check</span>
          Mes dernières activités
        </h2>
        {myAttendance.length === 0 ? (
          <EmptyState compact icon="fact_check" title="Aucune présence enregistrée" description="Vos présences apparaîtront ici au fur et à mesure des cours." />
        ) : (
          <div className="space-y-sm">
            {myAttendance
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((a) => {
                const sched = schedules.find((s) => s.id === a.scheduleId);
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-amud-outline-variant px-md py-sm">
                    <div>
                      <p className="text-body-md text-amud-on-surface">
                        {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-label-sm text-amud-on-surface-variant">{sched ? `${sched.heureDebut}–${sched.heureFin}` : '—'}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-0.5 text-label-sm font-medium ${ATTENDANCE_CLASS[a.statut]}`}>
                      {ATTENDANCE_LABELS[a.statut]}
                    </span>
                  </div>
                );
              })}
            <Link href="/amud/student/presences" className="block pt-1 text-label-sm text-amud-primary hover:underline">
              Voir toutes les présences →
            </Link>
          </div>
        )}
      </div>

      {/* Paiements récents */}
      {myPayments.length > 0 && (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md flex items-center gap-sm text-title-lg text-amud-on-surface">
            <span className="material-symbols-outlined text-amud-primary">payments</span>
            Mes paiements
          </h2>
          <div className="space-y-sm">
            {myPayments.slice(0, 3).map((p) => {
              const f = formations.find((fm) => fm.id === p.formationId);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-amud-outline-variant px-md py-sm">
                  <div>
                    <p className="text-body-md text-amud-on-surface">{f?.nom ?? 'Formation'}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">{new Date(p.date).toLocaleDateString('fr-FR')} · {p.mode}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-body-md font-semibold text-amud-on-surface">{p.montantPaye.toLocaleString('fr-FR')} MAD</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_CLASS[p.statut]}`}>{PAYMENT_STATUS_LABELS[p.statut]}</span>
                  </div>
                </div>
              );
            })}
            <Link href="/amud/student/payments" className="block pt-1 text-label-sm text-amud-primary hover:underline">
              Voir tous les paiements →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Import missing constant
const ATTENDANCE_CLASS: Record<string, string> = {
  PRESENT: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  ABSENT: 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
  RETARD: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant border-amud-tertiary-fixed-dim',
  EXCUSE: 'bg-amud-surface-container-high text-amud-on-surface-variant border-amud-outline-variant',
};
