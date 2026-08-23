'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, PARTNERSHIP_STATUSES, PARTNERSHIP_LABELS, type Centre } from '@/data/amud/centres';
import { commerciaux } from '@/data/amud/commerciaux';

/**
 * Modal rapide "Modifier le partenariat" / "Affecter un commercial" (cahier
 * des charges §11/§12) — les deux actions du menu ligne ouvrent cette même
 * modal, ces deux champs se modifiant en pratique ensemble côté vente.
 */
export function CenterPartnershipModal({ open, onClose, centre }: { open: boolean; onClose: () => void; centre: Centre | null }) {
  const notify = useToast();
  const [, { update: updateCentre }] = useCollection(centresCollection, centresSeed);
  const [status, setStatus] = useState<Centre['partnershipStatus']>('PROSPECT');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [commercialId, setCommercialId] = useState('');

  useEffect(() => {
    if (!open || !centre) return;
    setStatus(centre.partnershipStatus);
    setDateDebut(centre.partnershipDateDebut);
    setDateFin(centre.partnershipDateFin ?? '');
    setCommercialId(centre.assignedCommercialId);
  }, [open, centre]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!centre) return;
    const commercial = commerciaux.find((c) => c.id === commercialId);
    const before = `${PARTNERSHIP_LABELS[centre.partnershipStatus]} · ${centre.assignedCommercialNom}`;
    const after = `${PARTNERSHIP_LABELS[status]} · ${commercial ? `${commercial.prenom} ${commercial.nom}` : centre.assignedCommercialNom}`;
    updateCentre(centre.id, {
      partnershipStatus: status,
      partnershipDateDebut: dateDebut,
      partnershipDateFin: dateFin || undefined,
      assignedCommercialId: commercialId,
      assignedCommercialNom: commercial ? `${commercial.prenom} ${commercial.nom}` : centre.assignedCommercialNom,
      updatedAt: new Date().toISOString(),
    });
    logAudit({
      utilisateur: 'Administrateur',
      role: 'Admin',
      action: 'Modification du partenariat',
      actionType: 'update',
      module: 'Centres de formation',
      reference: `${centre.nom} (#${centre.id})`,
      centerId: centre.id,
      diff: before !== after ? { before, after } : undefined,
    });
    notify('Partenariat mis à jour.');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Partenariat & commercial"
      subtitle={centre?.nom}
      footer={
        <div className="flex justify-end gap-sm">
          <button type="button" onClick={onClose} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="center-partnership-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm hover:brightness-110">
            Enregistrer
          </button>
        </div>
      }
    >
      <form id="center-partnership-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut du partenariat</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Centre['partnershipStatus'])} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {PARTNERSHIP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PARTNERSHIP_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date de début</label>
            <input value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="jj/mm/aaaa" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date de fin</label>
            <input value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="jj/mm/aaaa" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Commercial affecté</label>
          <select value={commercialId} onChange={(e) => setCommercialId(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {commerciaux.map((c) => (
              <option key={c.id} value={c.id}>
                {c.prenom} {c.nom}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
