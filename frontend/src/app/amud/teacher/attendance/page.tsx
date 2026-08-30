'use client';

import { useMemo, useState } from 'react';
import { Drawer, EmptyState, LoadingState } from '@/components/amud/ui';
import { QrCodeDisplay } from '@/components/amud/centre/QrCodeDisplay';
import { useToast } from '@/components/amud/Toast';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerEnrollmentsCollection, activeStudentIdsForGroup } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { centerSessionStatesCollection } from '@/lib/amud/localCenterSessionStates';
import { centerSessionStatesSeed } from '@/data/amud/centerSessionStates';
import { startSession, openCheckOut, endSession } from '@/lib/amud/attendanceCascades';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { ATTENDANCE_LABELS, ATTENDANCE_CLASS, type AttendanceStatus, type CenterAttendanceRecord, type QrPayload } from '@/data/amud/centerTypes';
import { pushNotification } from '@/lib/amud/storage/notify';
import { generateId } from '@/lib/amud/storage/ids';

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'RETARD', 'EXCUSE'];

export default function TeacherAttendancePage() {
  const notify = useToast();
  const { teacherId } = useCurrentTeacher();
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [attendance, { add: addAttendance }] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [sessionStates] = useCollection(centerSessionStatesCollection, centerSessionStatesSeed);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const teacher = teachers.find((t) => t.id === teacherId);
  const myGroups = useMemo(() => groups.filter((g) => g.enseignantId === teacherId), [groups, teacherId]);

  const selectedGroup = useMemo(() => myGroups.find((g) => g.id === selectedGroupId), [myGroups, selectedGroupId]);

  // Cours du groupe sélectionné
  const groupSchedules = useMemo(
    () => schedules.filter((s) => s.groupId === selectedGroupId).sort((a, b) => b.date.localeCompare(a.date)),
    [schedules, selectedGroupId],
  );

  const selectedSchedule = useMemo(() => groupSchedules.find((s) => s.id === selectedScheduleId), [groupSchedules, selectedScheduleId]);

  // Étudiants actifs du groupe sélectionné
  const groupStudents = useMemo(() => {
    if (!selectedGroupId) return [];
    return enrollments
      .filter((e) => e.groupId === selectedGroupId && e.statut === 'ACTIF')
      .map((e) => students.find((s) => s.id === e.studentId))
      .filter((s): s is NonNullable<typeof s> => !!s);
  }, [enrollments, students, selectedGroupId]);

  // Présences déjà enregistrées pour ce cours
  const existingRecords = useMemo(
    () => attendance.filter((a) => a.scheduleId === selectedScheduleId),
    [attendance, selectedScheduleId],
  );
  const alreadyRecorded = existingRecords.length > 0;

  function initStatuses() {
    const init: Record<string, AttendanceStatus> = {};
    groupStudents.forEach((s) => {
      const existing = existingRecords.find((r) => r.studentId === s.id);
      init[s.id] = existing?.statut ?? 'PRESENT';
    });
    setStatuses(init);
    setSaved(false);
  }

  function handleGroupSelect(groupId: string) {
    setSelectedGroupId(groupId);
    setSelectedScheduleId('');
    setStatuses({});
    setSaved(false);
  }

  function handleScheduleSelect(scheduleId: string) {
    setSelectedScheduleId(scheduleId);
    setSaved(false);
    // Init statuts après sélection du cours
    const init: Record<string, AttendanceStatus> = {};
    const existing = attendance.filter((a) => a.scheduleId === scheduleId);
    groupStudents.forEach((s) => {
      const ex = existing.find((r) => r.studentId === s.id);
      init[s.id] = ex?.statut ?? 'PRESENT';
    });
    setStatuses(init);
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  function handleSave() {
    if (!selectedSchedule || !selectedGroup || !teacher) return;

    groupStudents.forEach((student) => {
      const status = statuses[student.id] ?? 'PRESENT';
      const existing = existingRecords.find((r) => r.studentId === student.id);

      if (existing) {
        // Mise à jour
        centerAttendanceCollection.update(existing.id, { statut: status });
      } else {
        // Création
        const record: CenterAttendanceRecord = {
          id: generateId('att'),
          centerId: selectedGroup.centerId,
          scheduleId: selectedSchedule.id,
          groupId: selectedGroup.id,
          studentId: student.id,
          date: selectedSchedule.date,
          statut: status,
        };
        addAttendance(record);
      }

      // Notification automatique pour absences
      if (status === 'ABSENT' || status === 'RETARD') {
        pushNotification({
          scope: 'student',
          targetId: student.id,
          title: `${status === 'ABSENT' ? 'Absence' : 'Retard'} enregistré(e) le ${new Date(selectedSchedule.date).toLocaleDateString('fr-FR')}`,
          category: 'Présence',
          href: '/amud/student/presences',
        });
      }
    });

    notify('Présences enregistrées avec succès.', 'success');
    setSaved(true);
  }

  const actor = { utilisateur: teacher ? `${teacher.prenom} ${teacher.nom}` : 'Enseignant', role: 'TEACHER' };
  const sessionState = useMemo(() => sessionStates.find((s) => s.scheduleId === selectedScheduleId), [sessionStates, selectedScheduleId]);
  const groupStudentIds = useMemo(() => groupStudents.map((s) => s.id), [groupStudents]);

  const checkInPayload: QrPayload | null =
    sessionState && sessionState.status === 'CHECKIN_OPEN' && sessionState.checkInToken && selectedGroup && teacher
      ? { v: 1, type: 'CHECK_IN', centerId: selectedGroup.centerId, scheduleId: sessionState.scheduleId, groupId: selectedGroup.id, teacherId: teacher.id, sessionStateId: sessionState.id, token: sessionState.checkInToken, issuedAt: sessionState.startedAt ?? new Date().toISOString() }
      : null;
  const checkOutPayload: QrPayload | null =
    sessionState && sessionState.status === 'CHECKOUT_OPEN' && sessionState.checkOutToken && selectedGroup && teacher
      ? { v: 1, type: 'CHECK_OUT', centerId: selectedGroup.centerId, scheduleId: sessionState.scheduleId, groupId: selectedGroup.id, teacherId: teacher.id, sessionStateId: sessionState.id, token: sessionState.checkOutToken, issuedAt: sessionState.checkOutOpenedAt ?? new Date().toISOString() }
      : null;

  const checkedInCount = attendance.filter((a) => a.scheduleId === selectedScheduleId && a.checkInTime).length;
  const checkedOutCount = attendance.filter((a) => a.scheduleId === selectedScheduleId && a.checkOutTime).length;

  function handleStartQrSession() {
    if (!selectedSchedule || !teacher) return;
    startSession(selectedSchedule, teacher.id, actor);
    setQrOpen(true);
  }

  function handleOpenCheckOutQr() {
    if (!sessionState) return;
    openCheckOut(sessionState, actor);
  }

  function handleEndQrSession() {
    if (!sessionState || !selectedGroup) return;
    endSession(sessionState, selectedGroup.id, groupStudentIds, actor);
    notify('Séance clôturée, présences enregistrées.', 'success');
    setQrOpen(false);
  }

  if (!teacher) return <LoadingState label="Chargement…" rows={3} />;

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Enregistrer les présences</h1>

      {/* Étape 1 : Choisir le groupe */}
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md text-title-lg text-amud-on-surface">1. Choisir le groupe</h2>
        {myGroups.length === 0 ? (
          <EmptyState compact icon="diversity_3" title="Aucun groupe" description="Vous n'avez pas encore de groupes." />
        ) : (
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2 lg:grid-cols-3">
            {myGroups.map((g) => {
              const f = formations.find((fm) => fm.id === g.formationId);
              return (
                <button
                  key={g.id}
                  onClick={() => handleGroupSelect(g.id)}
                  className={`rounded-lg border p-md text-left transition-colors ${selectedGroupId === g.id ? 'border-amud-primary bg-amud-primary/10' : 'border-amud-outline-variant hover:border-amud-primary hover:bg-amud-primary/5'}`}
                >
                  <p className="text-body-md font-semibold text-amud-on-surface">{g.nom}</p>
                  <p className="text-label-sm text-amud-on-surface-variant">{f?.nom ?? '—'} · {g.niveau}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Étape 2 : Choisir le cours */}
      {selectedGroupId && (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">2. Choisir le cours</h2>
          {groupSchedules.length === 0 ? (
            <EmptyState compact icon="event" title="Aucun cours" description="Aucun cours planifié pour ce groupe." />
          ) : (
            <div className="space-y-sm">
              {groupSchedules.slice(0, 10).map((s) => {
                const alreadyHas = attendance.some((a) => a.scheduleId === s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleScheduleSelect(s.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-md text-left transition-colors ${selectedScheduleId === s.id ? 'border-amud-primary bg-amud-primary/10' : 'border-amud-outline-variant hover:border-amud-primary'}`}
                  >
                    <div>
                      <p className="text-body-md font-medium text-amud-on-surface">
                        {new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-label-sm text-amud-on-surface-variant">{s.heureDebut}–{s.heureFin} · Salle {s.salle}</p>
                    </div>
                    {alreadyHas && (
                      <span className="rounded-full bg-amud-primary/10 px-2 py-0.5 text-label-sm text-amud-primary">Enregistré</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Présence QR — alternative recommandée à la saisie manuelle ci-dessous */}
      {selectedScheduleId && groupStudents.length > 0 && (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Présence QR (Smart Attendance)</h2>
          {sessionState?.status === 'ENDED' ? (
            <p className="text-body-md text-amud-on-surface-variant">Séance clôturée — {checkedInCount} présent(s), {checkedOutCount} sortie(s) enregistrée(s).</p>
          ) : (
            <button
              onClick={handleStartQrSession}
              className="flex min-h-[44px] items-center gap-2 rounded-lg bg-amud-primary px-lg text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              {sessionState ? 'Réafficher le QR de la séance' : 'Commencer la séance'}
            </button>
          )}
        </div>
      )}

      <Drawer
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        anchor="full"
        title={checkOutPayload ? 'QR de sortie' : 'QR d’entrée'}
        subtitle={selectedGroup?.nom}
      >
        <div className="flex h-full flex-col items-center justify-center gap-lg p-lg text-center">
          {checkOutPayload ? (
            <QrCodeDisplay value={JSON.stringify(checkOutPayload)} label="QR code de sortie" />
          ) : checkInPayload ? (
            <QrCodeDisplay value={JSON.stringify(checkInPayload)} label="QR code d’entrée" />
          ) : (
            <p className="text-body-md text-amud-on-surface-variant">Cette séance est terminée.</p>
          )}
          <div>
            <p className="text-title-lg font-semibold text-amud-on-surface">{selectedGroup?.nom}</p>
            <p className="text-body-md text-amud-on-surface-variant">
              {selectedSchedule ? `${selectedSchedule.heureDebut}–${selectedSchedule.heureFin} · Salle ${selectedSchedule.salle}` : ''}
            </p>
            <p className="mt-sm text-label-lg font-medium text-amud-primary">
              {checkOutPayload ? `${checkedOutCount} sortie(s) enregistrée(s)` : `${checkedInCount} présent(s) sur ${groupStudents.length}`}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-sm">
            {sessionState?.status === 'CHECKIN_OPEN' ? (
              <button onClick={handleOpenCheckOutQr} className="min-h-[44px] rounded-lg border border-amud-outline-variant px-lg text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
                Ouvrir la sortie
              </button>
            ) : null}
            {sessionState && sessionState.status !== 'ENDED' ? (
              <button onClick={handleEndQrSession} className="min-h-[44px] rounded-lg bg-amud-error px-lg text-label-md font-medium text-white hover:bg-amud-error/90">
                Clôturer la séance
              </button>
            ) : null}
          </div>
        </div>
      </Drawer>

      {/* Étape 3 : Liste étudiants + statuts */}
      {selectedScheduleId && groupStudents.length > 0 && (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <div className="mb-md flex items-center justify-between">
            <h2 className="text-title-lg text-amud-on-surface">3. Saisir les présences</h2>
            {alreadyRecorded && <span className="text-label-sm text-amud-on-surface-variant">Modification des présences existantes</span>}
          </div>
          <div className="space-y-sm">
            {groupStudents.map((student) => {
              const current = statuses[student.id] ?? 'PRESENT';
              return (
                <div key={student.id} className="rounded-lg border border-amud-outline-variant p-md">
                  <div className="flex flex-wrap items-center gap-md">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amud-secondary-container font-bold text-amud-on-secondary-container">
                      {student.prenom.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-md font-medium text-amud-on-surface">{student.prenom} {student.nom}</p>
                      <p className="text-label-sm text-amud-on-surface-variant">Niveau {student.niveau}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(student.id, s)}
                          className={`rounded-full border px-3 py-0.5 text-label-sm font-medium transition-all ${
                            current === s ? ATTENDANCE_CLASS[s] : 'border-amud-outline-variant text-amud-on-surface-variant hover:bg-amud-surface-container-low'
                          }`}
                        >
                          {ATTENDANCE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-lg flex justify-end">
            {saved ? (
              <div className="flex items-center gap-sm text-amud-primary">
                <span className="material-symbols-outlined">check_circle</span>
                <span className="text-body-md font-semibold">Présences enregistrées</span>
              </div>
            ) : (
              <button
                onClick={handleSave}
                className="rounded-lg bg-amud-primary px-lg py-md text-label-lg font-semibold text-white transition-opacity hover:opacity-90"
              >
                Enregistrer les présences
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
