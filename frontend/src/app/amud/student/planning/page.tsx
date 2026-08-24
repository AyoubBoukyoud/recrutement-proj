'use client';

import { useMemo, useState } from 'react';
import { EmptyState, LoadingState } from '@/components/amud/ui';
import { useCurrentStudent } from '@/lib/amud/currentStudent';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerEnrollmentsCollection } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';

type ViewMode = 'week' | 'month' | 'list';

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function StudentPlanningPage() {
  const { studentId } = useCurrentStudent();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);

  const [view, setView] = useState<ViewMode>('week');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const student = students.find((s) => s.id === studentId);
  const enrollment = useMemo(() => enrollments.find((e) => e.studentId === studentId && e.statut === 'ACTIF'), [enrollments, studentId]);
  const group = useMemo(() => groups.find((g) => g.id === enrollment?.groupId), [groups, enrollment]);

  // Planning filtré par groupId de l'étudiant
  const mySchedules = useMemo(
    () => schedules.filter((s) => s.groupId === enrollment?.groupId).sort((a, b) => `${a.date} ${a.heureDebut}`.localeCompare(`${b.date} ${b.heureDebut}`)),
    [schedules, enrollment],
  );

  const weekDates = getWeekDates(currentWeek);
  const weekIsos = weekDates.map(isoDate);

  if (!student) return <LoadingState label="Chargement…" rows={3} />;
  if (!enrollment || !group) {
    return <EmptyState icon="calendar_month" title="Aucun planning disponible" description="Vous n'êtes pas encore inscrit à un groupe." />;
  }

  const schedulesThisWeek = mySchedules.filter((s) => weekIsos.includes(s.date));
  const today = isoDate(new Date());

  function prevWeek() {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() - 7);
    setCurrentWeek(d);
  }
  function nextWeek() {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() + 7);
    setCurrentWeek(d);
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h1 className="text-headline-md text-amud-on-surface">Mon planning</h1>
        <div className="flex rounded-lg border border-amud-outline-variant overflow-hidden">
          {(['week', 'month', 'list'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-md py-sm text-label-md font-medium transition-colors ${view === v ? 'bg-amud-primary text-white' : 'text-amud-on-surface-variant hover:bg-amud-surface-container-low'}`}
            >
              {v === 'week' ? 'Semaine' : v === 'month' ? 'Mois' : 'Liste'}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation semaine */}
      {view === 'week' && (
        <div>
          <div className="mb-md flex items-center justify-between">
            <button onClick={prevWeek} className="rounded-lg border border-amud-outline-variant p-sm text-amud-on-surface-variant hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-title-md text-amud-on-surface">
              {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} —{' '}
              {weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextWeek} className="rounded-lg border border-amud-outline-variant p-sm text-amud-on-surface-variant hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-7">
            {weekDates.map((d) => {
              const iso = isoDate(d);
              const daySchedules = schedulesThisWeek.filter((s) => s.date === iso);
              const isToday = iso === today;
              return (
                <div key={iso} className={`min-h-[80px] rounded-xl border p-sm ${isToday ? 'border-amud-primary bg-amud-primary/5' : 'border-amud-outline-variant bg-amud-surface-container-lowest'}`}>
                  <p className={`mb-1 text-label-sm font-semibold ${isToday ? 'text-amud-primary' : 'text-amud-on-surface-variant'}`}>
                    {d.toLocaleDateString('fr-FR', { weekday: 'short' })} {d.getDate()}
                  </p>
                  {daySchedules.map((s) => {
                    const t = teachers.find((t) => t.id === s.enseignantId);
                    const f = formations.find((f) => f.id === s.formationId);
                    return (
                      <div key={s.id} className="mb-1 rounded bg-amud-primary/10 px-1 py-0.5 text-[11px] text-amud-primary">
                        <p className="font-semibold">{s.heureDebut}–{s.heureFin}</p>
                        <p className="truncate">{f?.nom ?? group.nom}</p>
                        <p className="truncate opacity-70">{t ? `${t.prenom} ${t.nom}` : ''}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vue liste */}
      {(view === 'list' || view === 'month') && (
        <div className="space-y-sm">
          {mySchedules.length === 0 ? (
            <EmptyState compact icon="calendar_month" title="Aucun cours planifié" description="Le planning de votre groupe apparaîtra ici." />
          ) : (
            mySchedules.map((s) => {
              const t = teachers.find((t) => t.id === s.enseignantId);
              const f = formations.find((f) => f.id === s.formationId);
              const isPast = s.date < today;
              return (
                <div key={s.id} className={`flex flex-wrap items-center justify-between gap-md rounded-xl border px-md py-sm ${isPast ? 'border-amud-outline-variant opacity-60' : 'border-amud-outline-variant bg-amud-surface-container-lowest'} ${s.date === today ? 'border-amud-primary' : ''}`}>
                  <div>
                    <p className="text-body-md font-semibold text-amud-on-surface">
                      {new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-label-sm text-amud-on-surface-variant">{f?.nom ?? group.nom} · Salle {s.salle}</p>
                    {t && <p className="text-label-sm text-amud-on-surface-variant">{t.prenom} {t.nom}</p>}
                  </div>
                  <span className="rounded-full bg-amud-primary px-md py-1 text-label-md font-semibold text-white">
                    {s.heureDebut} – {s.heureFin}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
