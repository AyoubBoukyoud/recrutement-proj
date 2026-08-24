'use client';

import { useState } from 'react';
import { LoadingState } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { updateLocalCenterTeacher } from '@/lib/amud/localCenterTeachers';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { CONTRACT_TYPES } from '@/data/amud/centerTypes';

export default function TeacherProfilePage() {
  const notify = useToast();
  const { teacherId } = useCurrentTeacher();
  const [teachers, { update }] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [centres] = useCollection(centresCollection, centresSeed);

  const teacher = teachers.find((t) => t.id === teacherId);
  const centre = centres.find((c) => c.id === teacher?.centerId);

  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');

  function openEdit() {
    if (!teacher) return;
    setEmail(teacher.email);
    setTelephone(teacher.telephone);
    setEditing(true);
  }

  function saveEdit() {
    if (!teacher) return;
    update(teacher.id, { email, telephone });
    updateLocalCenterTeacher(teacher.id, { email, telephone });
    notify('Profil mis à jour.', 'success');
    setEditing(false);
  }

  if (!teacher) return <LoadingState label="Chargement du profil…" rows={3} />;

  return (
    <div className="space-y-lg">
      {/* Carte identité */}
      <div className="flex items-start gap-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-3xl font-bold text-white">
          {teacher.prenom.charAt(0)}{teacher.nom.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-headline-sm text-amud-on-surface">{teacher.prenom} {teacher.nom}</h1>
          <p className="text-body-md text-amud-on-surface-variant">{teacher.specialite}</p>
          <div className="mt-sm flex flex-wrap gap-sm">
            {teacher.niveauxEnseignes.map((n) => (
              <span key={n} className="rounded-full bg-amud-primary/10 px-3 py-0.5 text-label-sm font-medium text-amud-primary">{n}</span>
            ))}
            <span className={`rounded-full border px-3 py-0.5 text-label-sm font-medium ${teacher.statut === 'Actif' ? 'border-amud-primary/20 bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant bg-amud-surface-container-high text-amud-on-surface-variant'}`}>
              {teacher.statut}
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
        {/* Informations modifiables */}
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Informations personnelles</h2>
          <div className="space-y-md">
            <div>
              <p className="text-label-sm font-medium text-amud-on-surface-variant">Email</p>
              {editing ? (
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
              ) : (
                <p className="mt-1 text-body-md text-amud-on-surface">{teacher.email}</p>
              )}
            </div>
            <div>
              <p className="text-label-sm font-medium text-amud-on-surface-variant">Téléphone</p>
              {editing ? (
                <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
              ) : (
                <p className="mt-1 text-body-md text-amud-on-surface">{teacher.telephone}</p>
              )}
            </div>
          </div>
          {editing && (
            <button onClick={() => setEditing(false)} className="mt-md text-label-sm text-amud-on-surface-variant hover:underline">Annuler</button>
          )}
        </div>

        {/* Informations contractuelles — lecture seule */}
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Informations professionnelles</h2>
          <div className="space-y-sm">
            {[
              { label: 'Centre', value: centre?.nom ?? '—' },
              { label: 'Type de contrat', value: teacher.typeContrat },
              { label: 'Taux horaire', value: `${teacher.tauxHoraire} MAD/h` },
              { label: 'Expérience', value: `${teacher.experienceAnnees} an${teacher.experienceAnnees > 1 ? 's' : ''}` },
              { label: "Date d'entrée", value: new Date(teacher.dateEntree).toLocaleDateString('fr-FR') },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-amud-outline-variant py-sm last:border-0">
                <span className="text-label-sm text-amud-on-surface-variant">{label}</span>
                <span className="text-body-md font-medium text-amud-on-surface">{value}</span>
              </div>
            ))}
          </div>
          <p className="mt-md text-label-sm text-amud-on-surface-variant">* Ces informations sont en lecture seule.</p>
        </div>
      </div>
    </div>
  );
}
