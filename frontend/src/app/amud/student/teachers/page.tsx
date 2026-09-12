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
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';

export default function StudentTeachersPage() {
  const { studentId } = useCurrentStudent();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);

  const student = students.find((s) => s.id === studentId);

  // Groupes de l'étudiant (actifs et terminés pour voir tous les enseignants)
  const myGroupIds = useMemo(
    () => new Set(enrollments.filter((e) => e.studentId === studentId).map((e) => e.groupId)),
    [enrollments, studentId],
  );

  const myGroups = useMemo(
    () => groups.filter((g) => myGroupIds.has(g.id)),
    [groups, myGroupIds],
  );

  // Enseignants uniques de ces groupes
  const myTeachers = useMemo(() => {
    const teacherIds = new Set(myGroups.map((g) => g.enseignantId));
    return teachers.filter((t) => teacherIds.has(t.id));
  }, [myGroups, teachers]);

  if (!student) return <LoadingState label="Chargement…" rows={3} />;

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Mes enseignants</h1>

      {myTeachers.length === 0 ? (
        <EmptyState icon="cast_for_education" title="Aucun enseignant" description="Vos enseignants apparaîtront ici après votre affectation à un groupe." />
      ) : (
        <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
          {myTeachers.map((teacher) => {
            const teacherGroups = myGroups.filter((g) => g.enseignantId === teacher.id);
            const teacherFormations = teacherGroups
              .map((g) => formations.find((f) => f.id === g.formationId))
              .filter((f): f is NonNullable<typeof f> => !!f);

            return (
              <div key={teacher.id} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
                {/* Avatar */}
                <div className="mb-md flex items-center gap-md">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-xl font-bold text-white">
                    {teacher.prenom.charAt(0)}{teacher.nom.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-title-md text-amud-on-surface">{teacher.prenom} {teacher.nom}</h2>
                    <p className="text-body-md text-amud-on-surface-variant">{teacher.specialite}</p>
                  </div>
                </div>

                {/* Niveaux enseignés */}
                <div className="mb-md flex flex-wrap gap-1">
                  {teacher.niveauxEnseignes.map((n) => (
                    <span key={n} className="rounded-full bg-amud-primary/10 px-2 py-0.5 text-label-sm font-medium text-amud-primary">
                      {n}
                    </span>
                  ))}
                </div>

                {/* Formations associées */}
                <div className="space-y-1">
                  <p className="text-label-sm font-semibold text-amud-on-surface-variant">Formations :</p>
                  {teacherFormations.map((f) => (
                    <p key={f.id} className="text-label-sm text-amud-on-surface">{f.nom}</p>
                  ))}
                </div>

                {/* Groupes */}
                <div className="mt-sm space-y-1">
                  <p className="text-label-sm font-semibold text-amud-on-surface-variant">Groupes :</p>
                  {teacherGroups.map((g) => (
                    <p key={g.id} className="text-label-sm text-amud-on-surface">{g.nom}</p>
                  ))}
                </div>

                <p className="mt-md text-label-sm text-amud-on-surface-variant">
                  {teacher.experienceAnnees} an{teacher.experienceAnnees > 1 ? 's' : ''} d&apos;expérience
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
