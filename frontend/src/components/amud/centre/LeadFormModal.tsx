'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { centerLeadsCollection } from '@/lib/amud/localCenterLeads';
import { centerLeadsSeed, LEAD_STATUSES, LEAD_STATUS_LABELS, type CenterLead } from '@/data/amud/centerLeads';
import { GERMAN_LEVELS } from '@/data/amud/centerTypes';

export function LeadFormModal({ open, onClose, centerId, lead, actor }: { open: boolean; onClose: () => void; centerId: string; lead?: CenterLead; actor: { utilisateur: string; role: string } }) {
  const notify = useToast();
  const [, { add, update }] = useCollection(centerLeadsCollection, centerLeadsSeed);
  const isEdit = !!lead;

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [niveauSouhaite, setNiveauSouhaite] = useState<CenterLead['niveauSouhaite']>('A1');
  const [horairePrefere, setHorairePrefere] = useState('');
  const [message, setMessage] = useState('');
  const [statut, setStatut] = useState<CenterLead['statut']>('NOUVEAU');

  useEffect(() => {
    if (!open) return;
    if (lead) {
      setNom(lead.nom);
      setTelephone(lead.telephone);
      setEmail(lead.email);
      setNiveauSouhaite(lead.niveauSouhaite);
      setHorairePrefere(lead.horairePrefere ?? '');
      setMessage(lead.message ?? '');
      setStatut(lead.statut);
    } else {
      setNom('');
      setTelephone('');
      setEmail('');
      setNiveauSouhaite('A1');
      setHorairePrefere('');
      setMessage('');
      setStatut('NOUVEAU');
    }
  }, [open, lead]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    if (isEdit && lead) {
      const patch = { nom: nom.trim(), telephone: telephone.trim(), email: email.trim(), niveauSouhaite, horairePrefere: horairePrefere.trim() || undefined, message: message.trim() || undefined, statut };
      update(lead.id, patch);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Modification lead ${nom}`, actionType: 'update', module: 'Centres de formation — Leads', reference: `${nom} (#${lead.id})`, centerId });
      notify(`Lead « ${nom} » mis à jour.`);
    } else {
      const created: CenterLead = {
        id: generateId('lead'),
        centerId,
        nom: nom.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        niveauSouhaite,
        horairePrefere: horairePrefere.trim() || undefined,
        message: message.trim() || undefined,
        statut,
        createdAt: new Date().toISOString(),
      };
      add(created);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Nouveau lead ${nom}`, actionType: 'create', module: 'Centres de formation — Leads', reference: `${nom} (#${created.id})`, centerId });
      logCenterActivity({ centerId, type: 'LEAD_CREATED', message: `Nouveau lead « ${nom} ».`, utilisateur: actor.utilisateur, role: actor.role });
      notify(`Lead « ${nom} » ajouté.`);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier le lead' : 'Ajouter un lead'}
      footer={<ModalActions onCancel={onClose} form="lead-form" submitLabel={isEdit ? 'Enregistrer' : 'Ajouter'} />}
    >
      <form id="lead-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom *</label>
          <input autoFocus required value={nom} onChange={(e) => setNom(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
          <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="tel" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="email" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Niveau souhaité</label>
          <select value={niveauSouhaite} onChange={(e) => setNiveauSouhaite(e.target.value as CenterLead['niveauSouhaite'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {GERMAN_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
            <option value="Non précisé">Non précisé</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut</label>
          <select value={statut} onChange={(e) => setStatut(e.target.value as CenterLead['statut'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Horaire préféré</label>
          <input value={horairePrefere} onChange={(e) => setHorairePrefere(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="Soir, week-end…" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
      </form>
    </Modal>
  );
}
