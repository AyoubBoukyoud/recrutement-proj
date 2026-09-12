'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Utilisateur } from '@/data/amud/utilisateurs';

/** Wrapper de compatibilité au-dessus de la collection centralisée `AMUD_KEYS.users` — voir `localEntreprises.ts` pour la même remarque sur le changement de sémantique. */
const collection = createCollection<Utilisateur>(AMUD_KEYS.users);

export function loadLocalUtilisateurs(): Utilisateur[] {
  return collection.getAll();
}

export function addLocalUtilisateur(u: Utilisateur) {
  collection.add(u);
}

export function updateLocalUtilisateur(id: string, patch: Partial<Utilisateur>) {
  return collection.update(id, patch);
}

export function removeLocalUtilisateur(id: string) {
  collection.remove(id);
}

export { collection as utilisateursCollection };
