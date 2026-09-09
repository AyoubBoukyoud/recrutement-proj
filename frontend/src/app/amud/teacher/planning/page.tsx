'use client';

import { useMemo, useState } from 'react';
import { EmptyState, LoadingState } from '@/components/amud/ui';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';

type ViewMode = 'week' | 'list';

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function getWeekDates(d: Date): Date[] {
  const s = new Date(d); const day = s.getDay(); s.setDate(s.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => { const dd = new Date(s); dd.setDate(dd.getDate() + i); return dd; });
}
function calcDuration(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number); const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

export default function TeacherPlanningPage() {
  const { teacherId } = useCurrentTeacher();
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);

  const [view, setView] = useState<ViewMode>('week');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const teacher = teachers.find((t) => t.id === teacherId);
  const mySchedules = useMemo(
    () => schedules.filter((s) => s.enseignantId === teacherId).sort((a, b) => `${a.date} ${a.heureDebut}`.localeCompare(`${b.date} ${b.heureDebut}`)),
    [schedules, teacherId],
  );

  const weekDates = getWeekDates(currentWeek);
  const weekIsos = weekDates.map(isoDate);
  const today = isoDate(new Date());

  const totalHoursThisWeek = useMemo(
    () => mySchedules.filter((s) => weekIsos.includes(s.date)).reduce((sum, s) => sum + calcDuration(s.heureDebut, s.heureFin), 0),
    [mySchedules, weekIsos],
  );

  if (!teacher) return <LoadingState label="Chargement…" rows={3} />;

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="text-headline-md text-amud-on-surface">Mon planning</h1>
          <p className="text-body-md text-amud-on-surface-variant">{mySchedules.length} cours au total</p>
        </div>
        <div className="flex rounded-lg border border-amud-outline-variant overflow-hidden">
          {(['week', 'list'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-md py-sm text-label-md font-medium transition-colors ${view === v ? 'bg-amud-primary text-white' : 'text-amud-on-surface-variant hover:bg-amud-surface-container-low'}`}>
              {v === 'week' ? 'Semaine' : 'Liste'}
            </button>
          ))}
        </div>
      </div>

      {view === 'week' && (
        <div>
          <div className="mb-md flex items-center justify-between">
            <button onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() - 7); setCurrentWeek(d); }} className="rounded-lg border border-amud-outline-variant p-sm hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="text-center">
              <p className="text-title-md text-amud-on-surface">
                {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — {weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-label-sm text-amud-primary">{totalHoursThisWeek.toFixed(1)}h cette semaine</p>
            </div>
            <button onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() + 7); setCurrentWeek(d); }} className="rounded-lg border border-amud-outline-variant p-sm hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-7">
            {weekDates.map((d) => {
              const iso = isoDate(d);
              const daySchedules = mySchedules.filter((s) => s.date === iso);
              const isToday = iso === today;
              return (
                <div key={iso} className={`min-h-[80px] rounded-xl border p-sm ${isToday ? 'border-amud-primary bg-amud-primary/5' : 'border-amud-outline-variant bg-amud-surface-container-lowest'}`}>
                  <p className={`mb-1 text-label-sm font-semibold ${isToday ? 'text-amud-primary' : 'text-amud-on-surface-variant'}`}>
                    {d.toLocaleDateString('fr-FR', { weekday: 'short' })} {d.getDate()}
                  </p>
                  {daySchedules.map((s) => {
                    const f = formations.find((f) => f.id === s.formationId);
                    const g = groups.find((g) => g.id === s.groupId);
                    const dur = calcDuration(s.heureDebut, s.heureFin);
                    return (
                      <div key={s.id} className="mb-1 rounded bg-amud-primary/10 p-1 text-[11px] text-amud-primary">
                        <p className="font-bold">{s.heureDebut}–{s.heureFin} ({dur}h)</p>
                        <p className="truncate">{g?.nom ?? f?.nom}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-sm">
          {mySchedules.length === 0 ? (
            <EmptyState compact icon="calendar_month" title="Aucun cours planifié" description="Votre planning apparaîtra ici." />
          ) : (
            mySchedules.map((s) => {
              const f = formations.find((fm) => fm.id === s.formationId);
              const g = groups.find((grp) => grp.id === s.groupId);
              const dur = calcDuration(s.heureDebut, s.heureFin);
              const isPast = s.date < today;
              return (
                <div key={s.id} className={`flex flex-wrap items-center justify-between gap-md rounded-xl border px-md py-sm ${isPast ? 'border-amud-outline-variant opacity-60' : 'border-amud-outline-variant bg-amud-surface-container-lowest'} ${s.date === today ? 'border-amud-primary' : ''}`}>
                  <div>
                    <p className="text-body-md font-semibold text-amud-on-surface">
                      {new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-label-sm text-amud-on-surface-variant">{g?.nom ?? f?.nom ?? '—'} · Salle {s.salle}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">{f?.nom ?? '—'} · {dur}h</p>
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
