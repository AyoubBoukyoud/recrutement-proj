'use client';

import { useState } from 'react';
import { Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { centerModificationRequestsCollection } from '@/lib/amud/localCenterModificationRequests';
import { centerModificationRequestsSeed } from '@/data/amud/centerModificationRequests';
import type { Centre } from '@/data/amud/centres';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';

/**
 * "Demander une modification" (cahier des charges §22) — le Commercial ne
 * modifie jamais directement un centre ; cette modal se contente de créer
 * une entrée `centerModificationRequests` (statut `PENDING`) que l'Admin
 * traite de son côté.
 */
export function CenterModificationRequestModal({ open, onClose, centre }: { open: boolean; onClose: () => void; centre: Centre | null }) {
  const notify = useToast();
  const [, { add }] = useCollection(centerModificationRequestsCollection, centerModificationRequestsSeed);
  const [message, setMessage] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!centre || !message.trim()) return;
    add({
      id: generateId('modreq'),
      centerId: centre.id,
      centerNom: centre.nom,
      commercialId: CURRENT_COMMERCIAL.id,
      commercialNom: CURRENT_COMMERCIAL.nom,
      message: message.trim(),
      date: new Date().toLocaleDateString('fr-FR'),
      statut: 'PENDING',
    });
    notify('Demande envoyée à l’administrateur.');
    setMessage('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Demander une modification"
      subtitle={centre?.nom}
      widthClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-sm">
          <button type="button" onClick={onClose} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="modreq-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm hover:brightness-110">
            Envoyer
          </button>
        </div>
      }
    >
      <form id="modreq-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
        <p className="text-body-md text-amud-on-surface-variant">Décrivez l&apos;information à corriger. Votre demande sera transmise à l&apos;administrateur, qui reste seul habilité à modifier la fiche du centre.</p>
        <textarea
          autoFocus
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="Ex : Le numéro de téléphone semble incorrect."
          className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
        />
      </form>
    </Modal>
  );
}
