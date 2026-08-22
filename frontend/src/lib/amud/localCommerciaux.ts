'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Commercial } from '@/data/amud/commerciaux';

/** Wrapper de compatibilité au-dessus de la collection centralisée `AMUD_KEYS.commercials` — voir `localEntreprises.ts` pour la même remarque sur le changement de sémantique (collection entière, plus un delta). */
const collection = createCollection<Commercial>(AMUD_KEYS.commercials);

export function loadLocalCommerciaux(): Commercial[] {
  return collection.getAll();
}

export function addLocalCommercial(c: Commercial) {
  collection.add(c);
}

export function updateLocalCommercial(id: string, patch: Partial<Commercial>) {
  return collection.update(id, patch);
}

export { collection as commerciauxCollection };
