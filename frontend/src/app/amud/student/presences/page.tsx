'use client';

import { useMemo, useState } from 'react';
import { Drawer, EmptyState, LoadingState } from '@/components/amud/ui';
import { QrScanner } from '@/components/amud/centre/QrScanner';
import { useToast } from '@/components/amud/Toast';
import { useCurrentStudent } from '@/lib/amud/currentStudent';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerEnrollmentsCollection, activeStudentIdsForGroup } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { checkInStudent, checkOutStudent } from '@/lib/amud/attendanceCascades';
import { ATTENDANCE_LABELS, ATTENDANCE_CLASS, type QrPayload } from '@/data/amud/centerTypes';

export default function StudentPresencesPage() {
  const notify = useToast();
  const { studentId } = useCurrentStudent();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [scannerOpen, setScannerOpen] = useState(false);

  const student = students.find((s) => s.id === studentId);

  function handleScan(text: string) {
    setScannerOpen(false);
    let payload: QrPayload;
    try {
      payload = JSON.parse(text);
    } catch {
      notify('QR code invalide.', 'error');
      return;
    }
    if (!payload || payload.v !== 1 || (payload.type !== 'CHECK_IN' && payload.type !== 'CHECK_OUT')) {
      notify('Ce QR ne correspond pas à une entrée/sortie de cours.', 'error');
      return;
    }
    if (!student) return;
    const groupStudentIds = activeStudentIdsForGroup(enrollments, payload.groupId);
    const actor = { utilisateur: `${student.prenom} ${student.nom}`, role: 'STUDENT' };
    const result = payload.type === 'CHECK_IN' ? checkInStudent(payload, student.id, groupStudentIds, actor) : checkOutStudent(payload, student.id, groupStudentIds, actor);
    if (result.ok) {
      notify(payload.type === 'CHECK_IN' ? `Présence enregistrée — entrée à ${result.record.checkInTime?.slice(11, 16)}.` : `Sortie enregistrée — durée ${result.record.durationMinutes ?? 0} min.`, 'success');
    } else {
      notify(result.error.message, 'error');
    }
  }

  const myAttendance = useMemo(
    () => attendance.filter((a) => a.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date)),
    [attendance, studentId],
  );

  const stats = useMemo(() => {
    const total = myAttendance.length;
    const present = myAttendance.filter((a) => a.statut === 'PRESENT').length;
    const absent = myAttendance.filter((a) => a.statut === 'ABSENT').length;
    const retard = myAttendance.filter((a) => a.statut === 'RETARD').length;
    const excuse = myAttendance.filter((a) => a.statut === 'EXCUSE').length;
    const taux = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, retard, excuse, taux };
  }, [myAttendance]);

  if (!student) return <LoadingState label="Chargement…" rows={3} />;

  return (
    <div className="space-y-lg pb-24 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h1 className="text-headline-md text-amud-on-surface">Mes présences</h1>
        <button
          onClick={() => setScannerOpen(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-lg bg-amud-primary px-lg text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
          Scanner QR
        </button>
      </div>

      <Drawer open={scannerOpen} onClose={() => setScannerOpen(false)} anchor="full" title="Scanner le QR du cours">
        <QrScanner active={scannerOpen} onScan={handleScan} />
      </Drawer>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-md sm:grid-cols-4">
        {[
          { label: 'Taux de présence', value: `${stats.taux}%`, icon: 'fact_check', color: 'text-amud-primary' },
          { label: 'Présences', value: stats.present, icon: 'check_circle', color: 'text-amud-primary' },
          { label: 'Absences', value: stats.absent, icon: 'cancel', color: 'text-amud-error' },
          { label: 'Retards', value: stats.retard, icon: 'schedule', color: 'text-amud-on-tertiary-fixed-variant' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md text-center shadow-sm">
            <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
            <p className={`mt-1 text-title-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-label-sm text-amud-on-surface-variant">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Barre de présence */}
      {stats.total > 0 && (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <div className="mb-sm flex items-center justify-between">
            <span className="text-title-md text-amud-on-surface">Présence globale</span>
            <span className="text-title-md font-bold text-amud-primary">{stats.taux}%</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-amud-surface-container-high">
            <div
              className="h-full rounded-full bg-amud-primary transition-all duration-500"
              style={{ width: `${stats.taux}%` }}
            />
          </div>
          <p className="mt-1 text-label-sm text-amud-on-surface-variant">
            {stats.present} présences sur {stats.total} séances
          </p>
        </div>
      )}

      {/* Historique */}
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md text-title-lg text-amud-on-surface">Historique</h2>
        {myAttendance.length === 0 ? (
          <EmptyState compact icon="fact_check" title="Aucune présence enregistrée" description="Vos présences apparaîtront ici après les cours." />
        ) : (
          <div className="space-y-sm">
            {myAttendance.map((a) => {
              const sched = schedules.find((s) => s.id === a.scheduleId);
              const formation = formations.find((f) => f.id === sched?.formationId);
              return (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-md rounded-lg border border-amud-outline-variant px-md py-sm">
                  <div>
                    <p className="text-body-md font-medium text-amud-on-surface">
                      {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-label-sm text-amud-on-surface-variant">
                      {formation?.nom ?? '—'}
                      {sched ? ` · ${sched.heureDebut}–${sched.heureFin}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-0.5 text-label-sm font-medium ${ATTENDANCE_CLASS[a.statut]}`}>
                    {ATTENDANCE_LABELS[a.statut]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
