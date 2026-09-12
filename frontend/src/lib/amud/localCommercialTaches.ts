'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Tache } from '@/data/amud/commercialTaches';

/**
 * Wrapper de compatibilité au-dessus de la collection centralisée
 * `AMUD_KEYS.tasks`. Remplace le double système "extras + patch-map
 * d'overrides" par une seule collection : éditer une tâche du seed
 * fonctionne maintenant exactement comme éditer une tâche ajoutée, via
 * `updateLocalTache`.
 */
export const tachesCollection = createCollection<Tache>(AMUD_KEYS.tasks);

export function loadLocalTaches(): Tache[] {
  return tachesCollection.getAll();
}

export function addLocalTache(t: Tache) {
  tachesCollection.add(t);
}

export function updateLocalTache(id: string, patch: Partial<Tache>) {
  return tachesCollection.update(id, patch);
}

export function removeLocalTache(id: string) {
  tachesCollection.remove(id);
}
