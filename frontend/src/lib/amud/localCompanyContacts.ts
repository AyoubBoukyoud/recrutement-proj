'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { ContactEntreprise } from '@/data/amud/commercialContacts';

/**
 * Wrapper de compatibilité au-dessus de la collection centralisée
 * `AMUD_KEYS.companyContacts` — remplace `contactsEntrepriseSeed` en lecture
 * seule (aucune couche localStorage n'existait avant pour ce jeu de
 * données) : ajouter/éditer un contact d'entreprise fonctionne désormais.
 */
export const companyContactsCollection = createCollection<ContactEntreprise>(AMUD_KEYS.companyContacts);

export function loadLocalCompanyContacts(): ContactEntreprise[] {
  return companyContactsCollection.getAll();
}

export function addLocalCompanyContact(c: ContactEntreprise) {
  companyContactsCollection.add(c);
}

export function updateLocalCompanyContact(id: string, patch: Partial<ContactEntreprise>) {
  return companyContactsCollection.update(id, patch);
}

export function removeLocalCompanyContact(id: string) {
  companyContactsCollection.remove(id);
}
