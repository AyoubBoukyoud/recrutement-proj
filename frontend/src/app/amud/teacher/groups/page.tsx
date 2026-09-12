'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { EmptyState, LoadingState } from '@/components/amud/ui';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerEnrollmentsCollection } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';

export default function TeacherGroupsPage() {
  const { teacherId } = useCurrentTeacher();
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);

  const teacher = teachers.find((t) => t.id === teacherId);
  const myGroups = useMemo(() => groups.filter((g) => g.enseignantId === teacherId), [groups, teacherId]);

  const today = new Date().toISOString().slice(0, 10);

  if (!teacher) return <LoadingState label="Chargement…" rows={3} />;

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Mes groupes</h1>

      {myGroups.length === 0 ? (
        <EmptyState icon="diversity_3" title="Aucun groupe" description="Vous n'avez pas encore de groupes affectés." />
      ) : (
        <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 xl:grid-cols-3">
          {myGroups.map((group) => {
            const formation = formations.find((f) => f.id === group.formationId);
            const activeCount = enrollments.filter((e) => e.groupId === group.id && e.statut === 'ACTIF').length;
            const nextClass = schedules
              .filter((s) => s.groupId === group.id && s.date >= today)
              .sort((a, b) => `${a.date} ${a.heureDebut}`.localeCompare(`${b.date} ${b.heureDebut}`))[0];

            const totalSessions = schedules.filter((s) => s.groupId === group.id).length;
            const passedSessions = schedules.filter((s) => s.groupId === group.id && s.date < today).length;
            const progress = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

            return (
              <div key={group.id} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-title-lg text-amud-on-surface">{group.nom}</h2>
                    <p className="text-body-md text-amud-on-surface-variant">{formation?.nom ?? '—'}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-label-sm font-medium ${
                    group.statut === 'Actif' ? 'border-amud-primary/20 bg-amud-primary/10 text-amud-primary'
                    : 'border-amud-outline-variant bg-amud-surface-container-high text-amud-on-surface-variant'
                  }`}>{group.statut}</span>
                </div>

                <div className="mt-md grid grid-cols-2 gap-sm">
                  {[
                    { label: 'Niveau', value: group.niveau },
                    { label: 'Étudiants', value: `${activeCount}/${group.capaciteMax}` },
                    { label: 'Salle', value: group.salle },
                    { label: 'Début', value: group.dateDebut },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-label-sm text-amud-on-surface-variant">{label}</p>
                      <p className="text-body-md font-medium text-amud-on-surface">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Progression */}
                <div className="mt-md">
                  <div className="mb-1 flex items-center justify-between text-label-sm">
                    <span className="text-amud-on-surface-variant">Progression</span>
                    <span className="font-semibold text-amud-primary">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-amud-surface-container-high">
                    <div className="h-full rounded-full bg-amud-primary" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {nextClass && (
                  <div className="mt-md rounded-lg bg-amud-primary/5 px-sm py-sm text-label-sm">
                    <span className="material-symbols-outlined mr-1 text-[16px] text-amud-primary">event</span>
                    <span className="text-amud-on-surface">Prochain : {new Date(nextClass.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {nextClass.heureDebut}–{nextClass.heureFin}</span>
                  </div>
                )}

                {/* Actions rapides */}
                <div className="mt-md flex gap-sm">
                  <Link href="/amud/teacher/students" className="flex-1 rounded-lg border border-amud-outline-variant py-sm text-center text-label-sm font-medium text-amud-on-surface-variant transition-colors hover:border-amud-primary hover:text-amud-primary">
                    Étudiants
                  </Link>
                  <Link href="/amud/teacher/attendance" className="flex-1 rounded-lg bg-amud-primary py-sm text-center text-label-sm font-medium text-white transition-opacity hover:opacity-90">
                    Présences
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
