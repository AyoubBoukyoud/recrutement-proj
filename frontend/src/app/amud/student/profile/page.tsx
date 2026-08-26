'use client';

import { useState, useMemo } from 'react';
import { LoadingState } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
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
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { updateLocalCenterStudent } from '@/lib/amud/localCenterStudents';

export default function StudentProfilePage() {
  const notify = useToast();
  const { studentId } = useCurrentStudent();
  const [students, { update }] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [centres] = useCollection(centresCollection, centresSeed);

  const student = students.find((s) => s.id === studentId);
  const enrollment = useMemo(() => enrollments.find((e) => e.studentId === studentId && e.statut === 'ACTIF'), [enrollments, studentId]);
  const group = useMemo(() => groups.find((g) => g.id === enrollment?.groupId), [groups, enrollment]);
  const formation = useMemo(() => formations.find((f) => f.id === group?.formationId), [formations, group]);
  const centre = useMemo(() => centres.find((c) => c.id === student?.centerId), [centres, student]);

  const [editing, setEditing] = useState(false);
  const [telephone, setTelephone] = useState('');
  const [ville, setVille] = useState('');

  function openEdit() {
    if (!student) return;
    setTelephone(student.telephone);
    setVille(student.ville);
    setEditing(true);
  }

  function saveEdit() {
    if (!student) return;
    update(student.id, { telephone, ville });
    updateLocalCenterStudent(student.id, { telephone, ville });
    notify('Profil mis à jour.', 'success');
    setEditing(false);
  }

  if (!student) return <LoadingState label="Chargement du profil…" rows={3} />;

  return (
    <div className="space-y-lg">
      <div className="flex items-start gap-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-amud-secondary-container text-3xl font-bold text-amud-on-secondary-container">
          {student.prenom.charAt(0)}{student.nom.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-headline-sm text-amud-on-surface">{student.prenom} {student.nom}</h1>
          <p className="text-body-md text-amud-on-surface-variant">{student.email}</p>
          <div className="mt-sm flex flex-wrap gap-sm">
            <span className="rounded-full bg-amud-primary/10 px-3 py-0.5 text-label-sm font-medium text-amud-primary">Niveau {student.niveau}</span>
            <span className={`rounded-full border px-3 py-0.5 text-label-sm font-medium ${student.statut === 'Actif' ? 'border-amud-primary/20 bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant bg-amud-surface-container-high text-amud-on-surface-variant'}`}>
              {student.statut}
            </span>
          </div>
        </div>
        <button
          onClick={editing ? saveEdit : openEdit}
          className="shrink-0 rounded-lg border border-amud-primary px-md py-sm text-label-md font-medium text-amud-primary transition-colors hover:bg-amud-primary/10"
        >
          {editing ? 'Enregistrer' : 'Modifier'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
        {/* Informations personnelles modifiables */}
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Informations personnelles</h2>
          <div className="space-y-md">
            <ProfileField label="Téléphone" value={student.telephone} editing={editing} editValue={telephone} onEdit={setTelephone} type="tel" />
            <ProfileField label="Ville" value={student.ville} editing={editing} editValue={ville} onEdit={setVille} />
          </div>
          {editing && (
            <button onClick={() => setEditing(false)} className="mt-md text-label-sm text-amud-on-surface-variant hover:underline">
              Annuler
            </button>
          )}
        </div>

        {/* Informations administratives — lecture seule */}
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Informations administratives</h2>
          <div className="space-y-md">
            <ReadOnlyField label="Centre" value={centre?.nom ?? '—'} />
            <ReadOnlyField label="Formation" value={formation?.nom ?? '—'} />
            <ReadOnlyField label="Groupe" value={group?.nom ?? '—'} />
            <ReadOnlyField label="Niveau" value={student.niveau} />
            <ReadOnlyField label="Niveau cible" value={student.niveauCible} />
            <ReadOnlyField label="Date d'inscription" value={student.dateInscription} />
            <ReadOnlyField label="Email" value={student.email} />
          </div>
          <p className="mt-md text-label-sm text-amud-on-surface-variant">
            * Ces informations ne peuvent être modifiées que par le centre.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, editing, editValue, onEdit, type = 'text' }: {
  label: string; value: string; editing: boolean; editValue: string; onEdit: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <p className="text-label-sm font-medium text-amud-on-surface-variant">{label}</p>
      {editing ? (
        <input
          type={type}
          value={editValue}
          onChange={(e) => onEdit(e.target.value)}
          className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
        />
      ) : (
        <p className="mt-1 text-body-md text-amud-on-surface">{value}</p>
      )}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-label-sm font-medium text-amud-on-surface-variant">{label}</p>
      <p className="mt-1 text-body-md text-amud-on-surface">{value}</p>
    </div>
  );
}
