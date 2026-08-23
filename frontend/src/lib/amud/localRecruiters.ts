'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Recruiter } from '@/data/amud/recruiters';

/** Wrapper fin autour de la collection centralisée `AMUD_KEYS.recruiters` — même pattern que `localCommerciaux.ts`. */
const collection = createCollection<Recruiter>(AMUD_KEYS.recruiters);

export function loadLocalRecruiters(): Recruiter[] {
  return collection.getAll();
}

export function addLocalRecruiter(r: Recruiter) {
  collection.add(r);
}

export function updateLocalRecruiter(id: string, patch: Partial<Recruiter>) {
  return collection.update(id, patch);
}

export function removeLocalRecruiter(id: string) {
  collection.remove(id);
}

export { collection as recruitersCollection };
