'use client';

import { useMemo, useState } from 'react';
import { EmptyState, LoadingState } from '@/components/amud/ui';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerEnrollmentsCollection } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';

export default function TeacherStudentsPage() {
  const { teacherId } = useCurrentTeacher();
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);

  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');

  const teacher = teachers.find((t) => t.id === teacherId);
  const myGroups = useMemo(() => groups.filter((g) => g.enseignantId === teacherId), [groups, teacherId]);
  const myGroupIds = useMemo(() => new Set(myGroups.map((g) => g.id)), [myGroups]);

  // Étudiants de mes groupes
  const myStudents = useMemo(() => {
    const activeEnrollments = enrollments.filter((e) => myGroupIds.has(e.groupId) && e.statut === 'ACTIF');
    return activeEnrollments
      .map((e) => {
        const student = students.find((s) => s.id === e.studentId);
        const group = groups.find((g) => g.id === e.groupId);
        const formation = formations.find((f) => f.id === group?.formationId);
        const myAtt = attendance.filter((a) => a.studentId === e.studentId);
        const present = myAtt.filter((a) => a.statut === 'PRESENT').length;
        const taux = myAtt.length > 0 ? Math.round((present / myAtt.length) * 100) : 0;
        return student ? { ...student, group, formation, tauxPresence: taux } : null;
      })
      .filter((s): s is NonNullable<typeof s> => !!s);
  }, [enrollments, myGroupIds, students, groups, formations, attendance]);

  const filtered = useMemo(() => {
    return myStudents.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || `${s.prenom} ${s.nom}`.toLowerCase().includes(q);
      const matchGroup = !filterGroup || s.group?.id === filterGroup;
      return matchSearch && matchGroup;
    });
  }, [myStudents, search, filterGroup]);

  if (!teacher) return <LoadingState label="Chargement…" rows={3} />;

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Mes étudiants</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-sm">
        <input
          type="search"
          placeholder="Rechercher un étudiant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] rounded-lg border border-amud-outline-variant bg-amud-surface px-md py-sm text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
        />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="rounded-lg border border-amud-outline-variant bg-amud-surface px-md py-sm text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
        >
          <option value="">Tous les groupes</option>
          {myGroups.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="group" title="Aucun étudiant" description={search || filterGroup ? 'Aucun étudiant ne correspond à votre recherche.' : 'Vous n\'avez pas encore d\'étudiants dans vos groupes.'} />
      ) : (
        <div className="space-y-sm">
          {filtered.map((student) => (
            <div key={student.id} className="flex flex-wrap items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amud-secondary-container font-bold text-amud-on-secondary-container">
                {student.prenom.charAt(0)}{student.nom.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-md font-semibold text-amud-on-surface">{student.prenom} {student.nom}</p>
                <p className="text-label-sm text-amud-on-surface-variant">
                  {student.group?.nom ?? '—'} · {student.formation?.nom ?? '—'} · Niveau {student.niveau}
                </p>
              </div>
              <div className="flex items-center gap-sm">
                <div className="text-right">
                  <p className="text-label-sm text-amud-on-surface-variant">Présence</p>
                  <p className={`text-body-md font-bold ${student.tauxPresence >= 75 ? 'text-amud-primary' : 'text-amud-error'}`}>
                    {student.tauxPresence}%
                  </p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-label-sm font-medium ${
                  student.statut === 'Actif' ? 'border-amud-primary/20 bg-amud-primary/10 text-amud-primary'
                  : 'border-amud-outline-variant bg-amud-surface-container-high text-amud-on-surface-variant'
                }`}>{student.statut}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
