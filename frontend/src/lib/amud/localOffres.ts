'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Offre } from '@/data/amud/offres';

/**
 * Wrapper de compatibilité au-dessus de la collection centralisée
 * `AMUD_KEYS.offers` — même remarque que `localEntreprises.ts` : renvoie
 * désormais la collection entière (seed + ajouts + modifications), plus un
 * delta d'"extras".
 */
const collection = createCollection<Offre>(AMUD_KEYS.offers);

export function loadLocalOffres(): Offre[] {
  return collection.getAll();
}

export function addLocalOffre(o: Offre) {
  collection.add(o);
}

export function updateLocalOffre(id: string, patch: Partial<Offre>) {
  return collection.update(id, patch);
}

export function removeLocalOffre(id: string) {
  collection.remove(id);
}

export function saveLocalOffres(all: Offre[]) {
  collection.replace(all);
}

export { collection as offresCollection };
