'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerTarifsCollection } from '@/lib/amud/localCenterTarifs';
import { centerTarifsSeed, type CenterTarif } from '@/data/amud/centerTarifs';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';

export function TarifFormModal({ open, onClose, centerId, tarif, actor }: { open: boolean; onClose: () => void; centerId: string; tarif?: CenterTarif; actor: { utilisateur: string; role: string } }) {
  const notify = useToast();
  const [, { add, update }] = useCollection(centerTarifsCollection, centerTarifsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const centerFormations = formations.filter((f) => f.centerId === centerId);
  const isEdit = !!tarif;

  const [formationId, setFormationId] = useState(centerFormations[0]?.id ?? '');
  const [prix, setPrix] = useState(0);
  const [fraisInscription, setFraisInscription] = useState(0);
  const [mensualite, setMensualite] = useState<number | undefined>(undefined);
  const [reduction, setReduction] = useState<number | undefined>(undefined);
  const [promotion, setPromotion] = useState('');
  const [dateValidite, setDateValidite] = useState('');

  useEffect(() => {
    if (!open) return;
    if (tarif) {
      setFormationId(tarif.formationId);
      setPrix(tarif.prix);
      setFraisInscription(tarif.fraisInscription);
      setMensualite(tarif.mensualite);
      setReduction(tarif.reduction);
      setPromotion(tarif.promotion ?? '');
      setDateValidite(tarif.dateValidite ?? '');
    } else {
      const f = centerFormations[0];
      setFormationId(f?.id ?? '');
      setPrix(f?.prix ?? 0);
      setFraisInscription(500);
      setMensualite(undefined);
      setReduction(undefined);
      setPromotion('');
      setDateValidite('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tarif]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formation = centerFormations.find((f) => f.id === formationId);
    if (!formation) return;
    if (isEdit && tarif) {
      const patch = { formationId, niveau: formation.niveau, dureeSemaines: formation.dureeSemaines, nombreHeures: formation.nombreHeures, prix, fraisInscription, mensualite, reduction, promotion: promotion.trim() || undefined, dateValidite: dateValidite.trim() || undefined };
      update(tarif.id, patch);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Modification tarif ${formation.nom}`, actionType: 'update', module: 'Centres de formation — Tarifs', reference: `${formation.nom} (#${tarif.id})`, centerId });
      notify('Tarif mis à jour.');
    } else {
      const created: CenterTarif = {
        id: generateId('tarif'),
        centerId,
        formationId,
        niveau: formation.niveau,
        dureeSemaines: formation.dureeSemaines,
        nombreHeures: formation.nombreHeures,
        prix,
        fraisInscription,
        mensualite,
        reduction,
        promotion: promotion.trim() || undefined,
        dateValidite: dateValidite.trim() || undefined,
      };
      add(created);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Création tarif ${formation.nom}`, actionType: 'create', module: 'Centres de formation — Tarifs', reference: `${formation.nom} (#${created.id})`, centerId });
      notify('Tarif ajouté.');
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier le tarif' : 'Ajouter un tarif'}
      footer={<ModalActions onCancel={onClose} form="tarif-form" submitLabel={isEdit ? 'Enregistrer' : 'Ajouter'} />}
    >
      <form id="tarif-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Formation *</label>
          <select required value={formationId} onChange={(e) => setFormationId(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {centerFormations.map((f) => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Prix (MAD)</label>
          <input value={prix} onChange={(e) => setPrix(Number(e.target.value) || 0)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={0} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Frais d’inscription (MAD)</label>
          <input value={fraisInscription} onChange={(e) => setFraisInscription(Number(e.target.value) || 0)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={0} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Mensualité (MAD)</label>
          <input value={mensualite ?? ''} onChange={(e) => setMensualite(e.target.value ? Number(e.target.value) : undefined)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={0} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Réduction (%)</label>
          <input value={reduction ?? ''} onChange={(e) => setReduction(e.target.value ? Number(e.target.value) : undefined)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={0} max={100} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Promotion</label>
          <input value={promotion} onChange={(e) => setPromotion(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="Inscription anticipée -10%" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Valide jusqu’au</label>
          <input value={dateValidite} onChange={(e) => setDateValidite(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="jj/mm/aaaa" />
        </div>
      </form>
    </Modal>
  );
}
