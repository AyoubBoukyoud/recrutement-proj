'use client';

import { useMemo } from 'react';
import { EmptyState, LoadingState } from '@/components/amud/ui';
import { useCurrentStudent } from '@/lib/amud/currentStudent';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerEnrollmentsCollection } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';

export default function StudentGroupPage() {
  const { studentId } = useCurrentStudent();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);

  const student = students.find((s) => s.id === studentId);
  const enrollment = useMemo(() => enrollments.find((e) => e.studentId === studentId && e.statut === 'ACTIF'), [enrollments, studentId]);
  const group = useMemo(() => groups.find((g) => g.id === enrollment?.groupId), [groups, enrollment]);
  const formation = useMemo(() => formations.find((f) => f.id === group?.formationId), [formations, group]);
  const teacher = useMemo(() => teachers.find((t) => t.id === group?.enseignantId), [teachers, group]);

  // Membres du groupe (noms seulement, pas d'infos sensibles)
  const groupMembers = useMemo(() => {
    if (!group) return [];
    const activeEnrollments = enrollments.filter((e) => e.groupId === group.id && e.statut === 'ACTIF');
    return activeEnrollments
      .map((e) => students.find((s) => s.id === e.studentId))
      .filter((s): s is NonNullable<typeof s> => !!s);
  }, [enrollments, students, group]);

  if (!student) return <LoadingState label="Chargement…" rows={3} />;
  if (!group) {
    return <EmptyState icon="diversity_3" title="Aucun groupe" description="Vous n'êtes pas encore affecté à un groupe." />;
  }

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Mon groupe</h1>

      {/* Carte groupe */}
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-md">
          <div>
            <h2 className="text-title-xl text-amud-on-surface">{group.nom}</h2>
            <p className="text-body-md text-amud-on-surface-variant">{formation?.nom ?? '—'}</p>
          </div>
          <span className={`rounded-full border px-md py-1 text-label-md font-semibold ${
            group.statut === 'Actif' ? 'border-amud-primary/20 bg-amud-primary/10 text-amud-primary'
            : 'border-amud-outline-variant bg-amud-surface-container-high text-amud-on-surface-variant'
          }`}>
            {group.statut}
          </span>
        </div>

        <div className="mt-lg grid grid-cols-2 gap-md sm:grid-cols-3">
          {[
            { label: 'Niveau', value: group.niveau, icon: 'grade' },
            { label: 'Salle', value: group.salle, icon: 'meeting_room' },
            { label: 'Capacité', value: `${groupMembers.length} / ${group.capaciteMax}`, icon: 'group' },
            { label: 'Date de début', value: new Date(group.dateDebut).toLocaleDateString('fr-FR'), icon: 'event' },
            { label: 'Date de fin', value: new Date(group.dateFin).toLocaleDateString('fr-FR'), icon: 'event_busy' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex items-center gap-sm rounded-lg border border-amud-outline-variant p-sm">
              <span className="material-symbols-outlined text-amud-primary">{icon}</span>
              <div>
                <p className="text-label-sm text-amud-on-surface-variant">{label}</p>
                <p className="text-body-md font-medium text-amud-on-surface">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enseignant */}
      {teacher && (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Enseignant</h2>
          <div className="flex items-center gap-md">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-xl font-bold text-white">
              {teacher.prenom.charAt(0)}{teacher.nom.charAt(0)}
            </div>
            <div>
              <p className="text-title-md text-amud-on-surface">{teacher.prenom} {teacher.nom}</p>
              <p className="text-body-md text-amud-on-surface-variant">{teacher.specialite}</p>
              <p className="text-label-sm text-amud-on-surface-variant">{teacher.niveauxEnseignes.join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Membres du groupe */}
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md text-title-lg text-amud-on-surface">
          Membres du groupe <span className="text-amud-on-surface-variant">({groupMembers.length})</span>
        </h2>
        {groupMembers.length === 0 ? (
          <p className="text-label-sm text-amud-on-surface-variant">Aucun autre membre.</p>
        ) : (
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
            {groupMembers.map((m) => (
              <div key={m.id} className={`flex items-center gap-md rounded-lg border p-sm ${m.id === studentId ? 'border-amud-primary/30 bg-amud-primary/5' : 'border-amud-outline-variant'}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amud-surface-container-high font-semibold text-amud-on-surface-variant">
                  {m.prenom.charAt(0)}
                </div>
                <div>
                  <p className="text-body-md font-medium text-amud-on-surface">
                    {m.prenom} {m.nom}
                    {m.id === studentId && <span className="ml-2 text-label-sm text-amud-primary">(vous)</span>}
                  </p>
                  <p className="text-label-sm text-amud-on-surface-variant">Niveau {m.niveau}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
