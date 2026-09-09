'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Activite } from '@/data/amud/commercialActivites';

/**
 * Wrapper de compatibilité au-dessus de la collection centralisée
 * `AMUD_KEYS.activities`. Ajoute `updateLocalActivite`, qui n'existait pas
 * avant — c'est ce qui corrige le bug où l'édition d'une activité existante
 * sur la page centrale Activités ne persistait pas (seulement `setState`).
 */
export const activitesCollection = createCollection<Activite>(AMUD_KEYS.activities);

export function loadLocalActivites(): Activite[] {
  return activitesCollection.getAll();
}

export function addLocalActivite(a: Activite) {
  activitesCollection.add(a);
}

export function updateLocalActivite(id: string, patch: Partial<Activite>) {
  return activitesCollection.update(id, patch);
}
