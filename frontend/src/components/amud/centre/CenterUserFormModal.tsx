'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerUsersCollection } from '@/lib/amud/localCenterUsers';
import { centerUsersSeed, type CenterUser } from '@/data/amud/centerUsers';
import { CENTER_ROLES, CENTER_ROLE_LABELS } from '@/data/amud/centerTypes';

export function CenterUserFormModal({ open, onClose, centerId, user, actor }: { open: boolean; onClose: () => void; centerId: string; user?: CenterUser; actor: { utilisateur: string; role: string } }) {
  const notify = useToast();
  const [, { add, update }] = useCollection(centerUsersCollection, centerUsersSeed);
  const isEdit = !!user;

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [role, setRole] = useState<CenterUser['role']>('COORDINATOR');
  const [actif, setActif] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (user) {
      setNom(user.nom);
      setEmail(user.email);
      setTelephone(user.telephone ?? '');
      setRole(user.role);
      setActif(user.actif);
    } else {
      setNom('');
      setEmail('');
      setTelephone('');
      setRole('COORDINATOR');
      setActif(true);
    }
  }, [open, user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !email.trim()) return;
    if (isEdit && user) {
      update(user.id, { nom: nom.trim(), email: email.trim(), telephone: telephone.trim() || undefined, role, actif });
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Modification membre d'équipe ${nom}`, actionType: 'update', module: 'Centres de formation — Équipe', reference: `${nom} (#${user.id})`, centerId });
      notify(`« ${nom} » mis à jour.`);
    } else {
      const created: CenterUser = { id: generateId('cuser'), centerId, nom: nom.trim(), email: email.trim(), telephone: telephone.trim() || undefined, role, actif, createdAt: new Date().toISOString() };
      add(created);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Ajout membre d'équipe ${nom} (${CENTER_ROLE_LABELS[role]})`, actionType: 'create', module: 'Centres de formation — Équipe', reference: `${nom} (#${created.id})`, centerId });
      notify(`« ${nom} » ajouté à l’équipe.`);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier le membre" : "Ajouter un membre de l'équipe"}
      footer={<ModalActions onCancel={onClose} form="center-user-form" submitLabel={isEdit ? 'Enregistrer' : 'Ajouter'} />}
    >
      <form id="center-user-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom complet *</label>
          <input autoFocus required value={nom} onChange={(e) => setNom(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email *</label>
          <input required value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="email" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
          <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="tel" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Rôle</label>
          <select value={role} onChange={(e) => setRole(e.target.value as CenterUser['role'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {CENTER_ROLES.map((r) => (
              <option key={r} value={r}>{CENTER_ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-sm">
          <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} className="h-4 w-4 accent-amud-primary" id="actif" />
          <label htmlFor="actif" className="text-label-md text-amud-on-surface">Membre actif</label>
        </div>
      </form>
    </Modal>
  );
}
