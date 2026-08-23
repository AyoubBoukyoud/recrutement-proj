'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Application } from '@/data/amud/applications';

/** Wrapper de compatibilité au-dessus de la collection centralisée `AMUD_KEYS.applications`. */
export const applicationsCollection = createCollection<Application>(AMUD_KEYS.applications);

export function loadLocalApplications(): Application[] {
  return applicationsCollection.getAll();
}

export function addLocalApplication(a: Application) {
  applicationsCollection.add(a);
}

export function updateLocalApplication(id: string, patch: Partial<Application>) {
  return applicationsCollection.update(id, patch);
}
