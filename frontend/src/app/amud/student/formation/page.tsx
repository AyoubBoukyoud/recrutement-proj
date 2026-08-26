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
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';

export default function StudentFormationPage() {
  const { studentId } = useCurrentStudent();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);

  const student = students.find((s) => s.id === studentId);
  const enrollment = useMemo(() => enrollments.find((e) => e.studentId === studentId && e.statut === 'ACTIF'), [enrollments, studentId]);
  const group = useMemo(() => groups.find((g) => g.id === enrollment?.groupId), [groups, enrollment]);
  const formation = useMemo(() => formations.find((f) => f.id === group?.formationId), [formations, group]);

  // Calcul heures effectuées = nombre de cours passés
  const today = new Date().toISOString().slice(0, 10);
  const groupSchedules = useMemo(
    () => schedules.filter((s) => s.groupId === enrollment?.groupId),
    [schedules, enrollment],
  );
  const passedSessions = groupSchedules.filter((s) => s.date < today).length;
  const totalSessions = formation?.nombreSeances ?? 0;
  const passedHours = passedSessions * 2; // ~2h par séance
  const totalHours = formation?.nombreHeures ?? 0;
  const progress = totalHours > 0 ? Math.min(100, Math.round((passedHours / totalHours) * 100)) : 0;

  // Présences personnelles
  const myAttendance = useMemo(() => attendance.filter((a) => a.studentId === studentId), [attendance, studentId]);
  const present = myAttendance.filter((a) => a.statut === 'PRESENT').length;
  const tauxPresence = myAttendance.length > 0 ? Math.round((present / myAttendance.length) * 100) : 0;

  if (!student) return <LoadingState label="Chargement…" rows={3} />;
  if (!formation || !group) {
    return <EmptyState icon="menu_book" title="Aucune formation active" description="Vous n'êtes pas encore inscrit à une formation. Contactez votre centre." />;
  }

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Ma formation</h1>

      {/* Carte formation */}
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-md">
          <div>
            <h2 className="text-title-xl text-amud-on-surface">{formation.nom}</h2>
            <p className="mt-1 text-body-md text-amud-on-surface-variant">{formation.description}</p>
          </div>
          <span className="rounded-full bg-amud-primary/10 px-md py-1 text-label-md font-semibold text-amud-primary">
            Niveau {formation.niveau}
          </span>
        </div>

        {/* Barre de progression */}
        <div className="mt-lg">
          <div className="mb-sm flex items-center justify-between">
            <span className="text-label-md font-medium text-amud-on-surface">Progression</span>
            <span className="text-label-md font-bold text-amud-primary">{progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-amud-surface-container-high">
            <div
              className="h-full rounded-full bg-amud-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-label-sm text-amud-on-surface-variant">
            {passedHours}h effectuées sur {totalHours}h au total
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-md sm:grid-cols-4">
        {[
          { label: 'Total heures', value: `${totalHours}h`, icon: 'schedule' },
          { label: 'Heures effectuées', value: `${passedHours}h`, icon: 'done_all' },
          { label: 'Heures restantes', value: `${Math.max(0, totalHours - passedHours)}h`, icon: 'hourglass_empty' },
          { label: 'Taux de présence', value: `${tauxPresence}%`, icon: 'fact_check' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md text-center shadow-sm">
            <span className="material-symbols-outlined text-amud-primary">{stat.icon}</span>
            <p className="mt-1 text-title-lg font-bold text-amud-on-surface">{stat.value}</p>
            <p className="text-label-sm text-amud-on-surface-variant">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Détails */}
      <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h3 className="mb-md text-title-md text-amud-on-surface">Détails de la formation</h3>
          <div className="space-y-sm">
            {[
              { label: 'Durée', value: `${formation.dureeSemaines} semaines` },
              { label: 'Nombre de séances', value: `${formation.nombreSeances} séances` },
              { label: 'Prix', value: `${formation.prix.toLocaleString('fr-FR')} MAD` },
              { label: 'Date de début', value: formation.dateDebut },
              { label: 'Date de fin', value: formation.dateFin },
              { label: 'Statut', value: formation.statut },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-amud-outline-variant py-sm last:border-0">
                <span className="text-label-sm text-amud-on-surface-variant">{label}</span>
                <span className="text-body-md font-medium text-amud-on-surface">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h3 className="mb-md text-title-md text-amud-on-surface">Objectifs</h3>
          <ul className="space-y-sm">
            {[
              `Maîtriser le vocabulaire de niveau ${formation.niveau}`,
              'Développer la communication orale et écrite',
              'Préparer la certification Goethe-Zertifikat',
              'Atteindre le niveau cible ' + student.niveauCible,
            ].map((obj, i) => (
              <li key={i} className="flex items-start gap-sm">
                <span className="material-symbols-outlined mt-0.5 text-[18px] text-amud-primary">check_circle</span>
                <span className="text-body-md text-amud-on-surface">{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
