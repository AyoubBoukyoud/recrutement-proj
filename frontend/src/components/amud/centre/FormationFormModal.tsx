'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed, FORMATION_STATUSES, type CenterFormation } from '@/data/amud/centerFormations';
import { GERMAN_LEVELS } from '@/data/amud/centerTypes';

export function FormationFormModal({
  open,
  onClose,
  centerId,
  formation,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  centerId: string;
  formation?: CenterFormation;
  actor: { utilisateur: string; role: string };
}) {
  const notify = useToast();
  const [, { add, update }] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const isEdit = !!formation;

  const [nom, setNom] = useState('');
  const [niveau, setNiveau] = useState<CenterFormation['niveau']>('A1');
  const [description, setDescription] = useState('');
  const [dureeSemaines, setDureeSemaines] = useState(10);
  const [nombreHeures, setNombreHeures] = useState(60);
  const [nombreSeances, setNombreSeances] = useState(20);
  const [prix, setPrix] = useState(3000);
  const [dateDebut, setDateDebut] = useState(() => new Date().toLocaleDateString('fr-FR'));
  const [dateFin, setDateFin] = useState('');
  const [statut, setStatut] = useState<CenterFormation['statut']>('Planifiée');

  useEffect(() => {
    if (!open) return;
    if (formation) {
      setNom(formation.nom);
      setNiveau(formation.niveau);
      setDescription(formation.description);
      setDureeSemaines(formation.dureeSemaines);
      setNombreHeures(formation.nombreHeures);
      setNombreSeances(formation.nombreSeances);
      setPrix(formation.prix);
      setDateDebut(formation.dateDebut);
      setDateFin(formation.dateFin);
      setStatut(formation.statut);
    } else {
      setNom('');
      setNiveau('A1');
      setDescription('');
      setDureeSemaines(10);
      setNombreHeures(60);
      setNombreSeances(20);
      setPrix(3000);
      setDateDebut(new Date().toLocaleDateString('fr-FR'));
      setDateFin('');
      setStatut('Planifiée');
    }
  }, [open, formation]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    if (isEdit && formation) {
      const patch = { nom: nom.trim(), niveau, description: description.trim(), dureeSemaines, nombreHeures, nombreSeances, prix, dateDebut, dateFin, statut };
      update(formation.id, patch);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Modification formation ${nom}`, actionType: 'update', module: 'Centres de formation — Formations', reference: `${nom} (#${formation.id})`, centerId });
      notify(`Formation « ${nom} » mise à jour.`);
    } else {
      const created: CenterFormation = {
        id: generateId('formation'),
        centerId,
        nom: nom.trim(),
        niveau,
        description: description.trim(),
        dureeSemaines,
        nombreHeures,
        nombreSeances,
        prix,
        dateDebut,
        dateFin,
        statut,
      };
      add(created);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Création formation ${nom}`, actionType: 'create', module: 'Centres de formation — Formations', reference: `${nom} (#${created.id})`, centerId });
      logCenterActivity({ centerId, type: 'FORMATION_CREATED', message: `Formation « ${nom} » créée.`, utilisateur: actor.utilisateur, role: actor.role });
      notify(`Formation « ${nom} » ajoutée.`);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier la formation' : 'Ajouter une formation'}
      footer={<ModalActions onCancel={onClose} form="formation-form" submitLabel={isEdit ? 'Enregistrer' : 'Ajouter'} />}
    >
      <form id="formation-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom de la formation *</label>
          <input autoFocus required value={nom} onChange={(e) => setNom(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Niveau</label>
          <select value={niveau} onChange={(e) => setNiveau(e.target.value as CenterFormation['niveau'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {GERMAN_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
            <option value="Autres">Autres</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut</label>
          <select value={statut} onChange={(e) => setStatut(e.target.value as CenterFormation['statut'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {FORMATION_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Durée (semaines)</label>
          <input value={dureeSemaines} onChange={(e) => setDureeSemaines(Number(e.target.value) || 0)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={1} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nombre d’heures</label>
          <input value={nombreHeures} onChange={(e) => setNombreHeures(Number(e.target.value) || 0)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={1} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nombre de séances</label>
          <input value={nombreSeances} onChange={(e) => setNombreSeances(Number(e.target.value) || 0)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={1} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Prix (MAD)</label>
          <input value={prix} onChange={(e) => setPrix(Number(e.target.value) || 0)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={0} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date de début</label>
          <input value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="jj/mm/aaaa" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date de fin</label>
          <input value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="jj/mm/aaaa" />
        </div>
      </form>
    </Modal>
  );
}
