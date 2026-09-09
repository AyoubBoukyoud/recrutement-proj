'use client';

import { generateId } from './storage/ids';
import { offresCollection } from './localOffres';
import { pushNotification } from './storage/notify';
import { logAudit } from './storage/audit';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import type { Offre } from '@/data/amud/offres';

/**
 * Écritures cascade pour le cycle de vie d'une offre (cahier des charges
 * §15-16) : chaque action met à jour l'offre, notifie l'espace entreprise
 * quand c'est pertinent (publication) et écrit une entrée d'audit — même
 * gabarit que `callTicketCascade.ts::createCallTicket`.
 */
export function createOffer(input: Omit<Offre, 'id' | 'candidatures' | 'vues'>): Offre {
  const offre: Offre = { ...input, id: generateId('offer'), candidatures: 0, vues: 0 };
  offresCollection.add(offre);
  if (offre.statut === 'Publiée') {
    pushNotification({ scope: 'employer', title: `Votre offre « ${offre.titre} » est publiée.`, category: 'Offers', href: `/amud/entreprise/offres/${offre.id}` });
  }
  logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: offre.statut === 'Publiée' ? 'Offre créée et publiée' : 'Offre enregistrée en brouillon', actionType: 'create', module: 'Offres', reference: `${offre.titre} (#${offre.id})` });
  return offre;
}

export function publishOffer(offre: Offre) {
  const publication = new Date().toLocaleDateString('fr-FR');
  offresCollection.update(offre.id, { statut: 'Publiée', publication });
  pushNotification({ scope: 'employer', title: `Votre offre « ${offre.titre} » est publiée.`, category: 'Offers', href: `/amud/entreprise/offres/${offre.id}` });
  logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Offre publiée', actionType: 'update', module: 'Offres', reference: `${offre.titre} (#${offre.id})` });
}

export function pauseOffer(offre: Offre) {
  offresCollection.update(offre.id, { statut: 'En pause' });
  logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Offre mise en pause', actionType: 'update', module: 'Offres', reference: `${offre.titre} (#${offre.id})` });
}

export function reactivateOffer(offre: Offre) {
  offresCollection.update(offre.id, { statut: 'Publiée' });
  logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Offre réactivée', actionType: 'update', module: 'Offres', reference: `${offre.titre} (#${offre.id})` });
}

export function archiveOffer(offre: Offre) {
  offresCollection.update(offre.id, { statut: 'Archivée' });
  logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Offre archivée', actionType: 'update', module: 'Offres', reference: `${offre.titre} (#${offre.id})` });
}

export function deleteOffer(offre: Offre) {
  offresCollection.remove(offre.id);
  logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Offre supprimée', actionType: 'delete', module: 'Offres', reference: `${offre.titre} (#${offre.id})` });
}

export function duplicateOffer(offre: Offre): Offre {
  const copie: Offre = { ...offre, id: generateId('offer'), titre: `${offre.titre} (copie)`, statut: 'Brouillon', candidatures: 0, vues: 0, publication: '-' };
  offresCollection.add(copie);
  logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Offre dupliquée', actionType: 'create', module: 'Offres', reference: `${copie.titre} (#${copie.id}, depuis #${offre.id})` });
  return copie;
}
