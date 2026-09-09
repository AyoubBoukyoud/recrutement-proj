'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed, GROUP_STATUSES, type CenterGroup } from '@/data/amud/centerGroups';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerEnrollmentsCollection, activeStudentIdsForGroup } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { generateId as genId } from '@/lib/amud/storage/ids';

/**
 * Le rattachement étudiant ↔ groupe est une entité de première classe,
 * `CenterEnrollment` (clé `amud_enrollments`, cahier des charges §17) — plus
 * un champ dupliqué sur `CenterGroup`. Ce modal reste le seul point
 * d'écriture (cahier des charges §12 : rattacher/détacher un étudiant à un
 * groupe) mais calcule maintenant un diff add/remove contre la collection
 * d'inscriptions à la sauvegarde, au lieu de patcher un tableau sur le
 * groupe lui-même.
 */
export function GroupFormModal({
  open,
  onClose,
  centerId,
  group,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  centerId: string;
  group?: CenterGroup;
  actor: { utilisateur: string; role: string };
}) {
  const notify = useToast();
  const [, { add, update }] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [enrollments, { add: addEnrollment, update: updateEnrollment }] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const isEdit = !!group;

  const centerFormations = formations.filter((f) => f.centerId === centerId);
  const centerTeachers = teachers.filter((t) => t.centerId === centerId);
  const centerStudents = students.filter((s) => s.centerId === centerId);

  const [nom, setNom] = useState('');
  const [formationId, setFormationId] = useState(centerFormations[0]?.id ?? '');
  const [enseignantId, setEnseignantId] = useState(centerTeachers[0]?.id ?? '');
  const [salle, setSalle] = useState('');
  const [capaciteMax, setCapaciteMax] = useState(12);
  const [dateDebut, setDateDebut] = useState(() => new Date().toLocaleDateString('fr-FR'));
  const [dateFin, setDateFin] = useState('');
  const [statut, setStatut] = useState<CenterGroup['statut']>('À venir');
  const [studentIds, setStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (group) {
      setNom(group.nom);
      setFormationId(group.formationId);
      setEnseignantId(group.enseignantId);
      setSalle(group.salle);
      setCapaciteMax(group.capaciteMax);
      setDateDebut(group.dateDebut);
      setDateFin(group.dateFin);
      setStatut(group.statut);
      setStudentIds(activeStudentIdsForGroup(enrollments, group.id));
    } else {
      setNom('');
      setFormationId(centerFormations[0]?.id ?? '');
      setEnseignantId(centerTeachers[0]?.id ?? '');
      setSalle('');
      setCapaciteMax(12);
      setDateDebut(new Date().toLocaleDateString('fr-FR'));
      setDateFin('');
      setStatut('À venir');
      setStudentIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, group]);

  function toggleStudent(id: string) {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  /** Diff les cases cochées contre les inscriptions ACTIF existantes pour ce groupe : coche nouvelle → nouvelle ligne, décoche → statut ABANDONNE (jamais de suppression physique, pour garder l'historique). */
  function syncEnrollments(groupId: string) {
    const before = enrollments.filter((e) => e.groupId === groupId && e.statut === 'ACTIF');
    const beforeIds = new Set(before.map((e) => e.studentId));
    const now = new Date().toISOString();
    for (const studentId of studentIds) {
      if (!beforeIds.has(studentId)) {
        addEnrollment({ id: genId('enr'), centerId, groupId, studentId, enrolledAt: now, statut: 'ACTIF' });
      }
    }
    for (const e of before) {
      if (!studentIds.includes(e.studentId)) {
        updateEnrollment(e.id, { statut: 'ABANDONNE' });
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !formationId) return;
    const formation = centerFormations.find((f) => f.id === formationId);
    const niveau = (formation?.niveau ?? 'A1') as CenterGroup['niveau'];
    if (isEdit && group) {
      const patch = { nom: nom.trim(), formationId, niveau, enseignantId, salle: salle.trim(), capaciteMax, dateDebut, dateFin, statut };
      update(group.id, patch);
      syncEnrollments(group.id);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Modification groupe ${nom}`, actionType: 'update', module: 'Centres de formation — Groupes', reference: `${nom} (#${group.id})`, centerId });
      notify(`Groupe « ${nom} » mis à jour.`);
    } else {
      const created: CenterGroup = {
        id: generateId('group'),
        centerId,
        nom: nom.trim(),
        formationId,
        niveau,
        enseignantId,
        salle: salle.trim(),
        capaciteMax,
        dateDebut,
        dateFin,
        statut,
      };
      add(created);
      syncEnrollments(created.id);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Création groupe ${nom}`, actionType: 'create', module: 'Centres de formation — Groupes', reference: `${nom} (#${created.id})`, centerId });
      logCenterActivity({ centerId, type: 'GROUP_CREATED', message: `Groupe « ${nom} » créé.`, utilisateur: actor.utilisateur, role: actor.role });
      notify(`Groupe « ${nom} » créé.`);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier le groupe' : 'Ajouter un groupe'}
      widthClassName="max-w-2xl"
      footer={<ModalActions onCancel={onClose} form="group-form" submitLabel={isEdit ? 'Enregistrer' : 'Créer'} />}
    >
      <form id="group-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom du groupe *</label>
            <input autoFocus required value={nom} onChange={(e) => setNom(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Formation</label>
            <select value={formationId} onChange={(e) => setFormationId(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {centerFormations.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Enseignant</label>
            <select value={enseignantId} onChange={(e) => setEnseignantId(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {centerTeachers.map((t) => (
                <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Salle</label>
            <input value={salle} onChange={(e) => setSalle(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Capacité max</label>
            <input value={capaciteMax} onChange={(e) => setCapaciteMax(Number(e.target.value) || 0)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={1} />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date de début</label>
            <input value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="jj/mm/aaaa" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date de fin</label>
            <input value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="jj/mm/aaaa" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value as CenterGroup['statut'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {GROUP_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Étudiants du groupe ({studentIds.length}/{capaciteMax})</label>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-amud-outline-variant p-sm">
            {centerStudents.length === 0 ? (
              <p className="px-2 py-1 text-label-sm text-amud-on-surface-variant">Aucun étudiant dans ce centre pour le moment.</p>
            ) : (
              centerStudents.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-body-md text-amud-on-surface hover:bg-amud-surface-container-low">
                  <input type="checkbox" checked={studentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} className="h-4 w-4 accent-amud-primary" />
                  {s.prenom} {s.nom} <span className="text-label-sm text-amud-on-surface-variant">({s.niveau})</span>
                </label>
              ))
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
