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

function calcDuration(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().slice(0, 10);
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export default function TeacherHoursPage() {
  const { teacherId } = useCurrentTeacher();
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);

  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  const teacher = teachers.find((t) => t.id === teacherId);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const currentWeekKey = getWeekKey(today);

  const mySchedules = useMemo(
    () => schedules.filter((s) => s.enseignantId === teacherId && s.date <= today).sort((a, b) => b.date.localeCompare(a.date)),
    [schedules, teacherId, today],
  );

  const filtered = useMemo(() => {
    if (period === 'week') return mySchedules.filter((s) => getWeekKey(s.date) === currentWeekKey);
    if (period === 'month') return mySchedules.filter((s) => getMonthKey(s.date) === currentMonth);
    return mySchedules;
  }, [mySchedules, period, currentWeekKey, currentMonth]);

  const totalHours = useMemo(
    () => filtered.reduce((sum, s) => sum + calcDuration(s.heureDebut, s.heureFin), 0),
    [filtered],
  );

  const totalAllTime = useMemo(
    () => mySchedules.reduce((sum, s) => sum + calcDuration(s.heureDebut, s.heureFin), 0),
    [mySchedules],
  );

  if (!teacher) return <LoadingState label="Chargement…" rows={3} />;

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h1 className="text-headline-md text-amud-on-surface">Mes heures</h1>
        <div className="flex rounded-lg border border-amud-outline-variant overflow-hidden">
          {(['week', 'month', 'all'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-md py-sm text-label-md font-medium transition-colors ${period === p ? 'bg-amud-primary text-white' : 'text-amud-on-surface-variant hover:bg-amud-surface-container-low'}`}>
              {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Tout'}
            </button>
          ))}
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        {[
          { label: 'Heures cette période', value: `${totalHours.toFixed(1)}h` },
          { label: 'Heures totales', value: `${totalAllTime.toFixed(1)}h` },
          { label: 'Taux horaire', value: `${teacher.tauxHoraire} MAD/h` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center shadow-sm">
            <p className="text-label-sm text-amud-on-surface-variant">{label}</p>
            <p className="mt-1 text-title-xl font-bold text-amud-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Liste des cours */}
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md text-title-lg text-amud-on-surface">Détail des heures</h2>
        {filtered.length === 0 ? (
          <EmptyState compact icon="schedule" title="Aucune heure" description="Aucun cours effectué sur cette période." />
        ) : (
          <div className="space-y-sm">
            {filtered.map((s) => {
              const f = formations.find((fm) => fm.id === s.formationId);
              const g = groups.find((grp) => grp.id === s.groupId);
              const dur = calcDuration(s.heureDebut, s.heureFin);
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-md rounded-lg border border-amud-outline-variant px-md py-sm">
                  <div>
                    <p className="text-body-md font-medium text-amud-on-surface">
                      {new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-label-sm text-amud-on-surface-variant">{g?.nom ?? f?.nom ?? '—'} · {s.heureDebut}–{s.heureFin}</p>
                  </div>
                  <span className="text-title-md font-bold text-amud-primary">{dur}h</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
