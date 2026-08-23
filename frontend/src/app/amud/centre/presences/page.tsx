'use client';

import { useMemo, useState } from 'react';
import { EmptyState, PageHeader, ReadOnlyNotice, StatCard } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerEnrollmentsCollection, activeStudentIdsForGroup } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { ATTENDANCE_CLASS, ATTENDANCE_LABELS, type AttendanceStatus } from '@/data/amud/centerAttendance';
import { computeAttendanceRates, todayIso } from '@/lib/amud/centerCalculations';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'RETARD', 'EXCUSE'];

export default function CentrePresencesPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('record-attendance');
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [attendance, { add, update }] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const today = todayIso();

  const centerSchedulesToday = useMemo(
    () => schedules.filter((s) => s.centerId === centerId && s.date <= today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60),
    [schedules, centerId, today],
  );
  const [scheduleId, setScheduleId] = useState('');
  const selected = centerSchedulesToday.find((s) => s.id === scheduleId) ?? centerSchedulesToday[0];
  const selectedGroup = selected ? groups.find((g) => g.id === selected.groupId) : undefined;
  const groupStudentIds = selectedGroup ? activeStudentIdsForGroup(enrollments, selectedGroup.id) : [];
  const groupStudents = students.filter((s) => groupStudentIds.includes(s.id));

  const existingByStudent = useMemo(() => {
    if (!selected) return new Map<string, string>();
    const map = new Map<string, string>();
    attendance.filter((a) => a.scheduleId === selected.id).forEach((a) => map.set(a.studentId, a.id));
    return map;
  }, [attendance, selected]);

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});

  function statusFor(studentId: string): AttendanceStatus {
    if (draft[studentId]) return draft[studentId];
    const existing = selected ? attendance.find((a) => a.scheduleId === selected.id && a.studentId === studentId) : undefined;
    return existing?.statut ?? 'PRESENT';
  }

  function setStatus(studentId: string, statut: AttendanceStatus) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setDraft((prev) => ({ ...prev, [studentId]: statut }));
  }

  function saveAll() {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    if (!selected || !selectedGroup) return;
    let count = 0;
    groupStudents.forEach((s) => {
      const statut = draft[s.id];
      if (!statut) return;
      const existingId = existingByStudent.get(s.id);
      if (existingId) {
        update(existingId, { statut });
      } else {
        add({ id: generateId('att'), centerId, scheduleId: selected.id, groupId: selectedGroup.id, studentId: s.id, date: selected.date, statut });
      }
      count++;
    });
    if (count === 0) {
      notify('Aucune modification à enregistrer.', 'info');
      return;
    }
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: `Présences enregistrées — ${selectedGroup.nom} (${selected.date})`, actionType: 'update', module: 'Centres de formation — Présences', reference: `${selectedGroup.nom} · ${selected.date}`, centerId });
    logCenterActivity({ centerId, type: 'ATTENDANCE_RECORDED', message: `Présences enregistrées pour ${selectedGroup.nom} (${selected.date}).`, utilisateur: 'Centre (self-service)', role });
    notify(`Présences enregistrées pour ${count} étudiant(s).`);
    setDraft({});
  }

  const groupAttendance = selectedGroup ? attendance.filter((a) => a.centerId === centerId && a.groupId === selectedGroup.id) : [];
  const rates = computeAttendanceRates(groupAttendance);

  const dirtyCount = Object.keys(draft).length;

  return (
    <div className="space-y-lg pb-24 md:pb-0">
      <PageHeader title="Présences" subtitle="Sélectionnez un cours pour saisir ou consulter les présences." />

      {!allowed ? <ReadOnlyNotice>Votre rôle actuel ne permet pas de saisir les présences — lecture seule.</ReadOnlyNotice> : null}

      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <label htmlFor="presence-schedule" className="mb-1 block text-label-md text-amud-on-surface-variant">
          Cours (créneau)
        </label>
        <select
          id="presence-schedule"
          value={selected?.id ?? ''}
          onChange={(e) => {
            setScheduleId(e.target.value);
            setDraft({});
          }}
          className="min-h-[44px] w-full max-w-xl rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
        >
          {centerSchedulesToday.length === 0 ? <option value="">Aucun cours passé ou aujourd’hui</option> : null}
          {centerSchedulesToday.map((s) => {
            const g = groups.find((gr) => gr.id === s.groupId);
            return (
              <option key={s.id} value={s.id}>
                {s.date} · {g?.nom ?? 'Groupe'} · {s.heureDebut}-{s.heureFin}
              </option>
            );
          })}
        </select>
      </div>

      {!selectedGroup ? (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
          <EmptyState
            icon="fact_check"
            title="Aucun cours à pointer"
            description="Programmez un cours dans le planning pour pouvoir enregistrer les présences."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
            <StatCard label="Taux de présence" value={rates.presenceRate} suffix=" %" icon="check_circle" accent="bg-amud-primary" />
            <StatCard label="Taux d’absence" value={rates.absenceRate} suffix=" %" icon="cancel" accent="bg-amud-error" />
            <StatCard label="Taux de retard" value={rates.retardRate} suffix=" %" icon="schedule" accent="bg-amud-tertiary-fixed-dim" />
            <StatCard label="Taux d’excuse" value={rates.excuseRate} suffix=" %" icon="event_busy" accent="bg-amud-primary-container" />
          </div>

          <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
            {groupStudents.length === 0 ? (
              <EmptyState icon="group" title="Aucun étudiant dans ce groupe" description="Ajoutez des étudiants au groupe pour pouvoir les pointer." />
            ) : (
              <ul className="divide-y divide-amud-outline-variant">
                {groupStudents.map((s) => (
                  <li key={s.id} className="flex flex-col gap-sm px-md py-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <span className="flex items-center gap-sm text-body-md text-amud-on-surface">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-label-sm font-bold text-white">
                        {`${s.prenom.charAt(0)}${s.nom.charAt(0)}`.toUpperCase()}
                      </span>
                      {s.prenom} {s.nom}
                    </span>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Présence de ${s.prenom} ${s.nom}`}>
                      {STATUSES.map((st) => {
                        const active = statusFor(s.id) === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            disabled={!allowed}
                            aria-pressed={active}
                            onClick={() => setStatus(s.id, st)}
                            className={`min-h-[44px] flex-1 rounded-lg border px-3 text-label-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[84px] sm:flex-none ${
                              active ? ATTENDANCE_CLASS[st] : 'border-amud-outline-variant text-amud-on-surface-variant hover:bg-amud-surface-container-low'
                            }`}
                          >
                            {ATTENDANCE_LABELS[st]}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {allowed && groupStudents.length > 0 ? (
            <div
              className="fixed inset-x-0 bottom-16 z-30 border-t border-amud-outline-variant bg-amud-surface p-md md:static md:border-0 md:bg-transparent md:p-0"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              <button
                onClick={saveAll}
                className="min-h-[44px] w-full rounded-lg bg-amud-primary px-lg text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark md:w-auto"
              >
                Enregistrer les présences{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
