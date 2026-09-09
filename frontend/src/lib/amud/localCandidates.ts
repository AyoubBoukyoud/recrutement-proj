'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Candidate } from '@/data/amud/candidates';

/** Wrapper fin autour de la collection centralisée `AMUD_KEYS.candidates` — même pattern que `localCommerciaux.ts`. */
const collection = createCollection<Candidate>(AMUD_KEYS.candidates);

export function loadLocalCandidates(): Candidate[] {
  return collection.getAll();
}

export function addLocalCandidate(c: Candidate) {
  collection.add(c);
}

export function updateLocalCandidate(id: string, patch: Partial<Candidate>) {
  return collection.update(id, patch);
}

export function removeLocalCandidate(id: string) {
  collection.remove(id);
}

export { collection as candidatesCollection };
