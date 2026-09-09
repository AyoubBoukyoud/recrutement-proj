'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterFormation } from '@/data/amud/centerFormations';

const collection = createCollection<CenterFormation>(AMUD_KEYS.centerFormations);

export function loadLocalCenterFormations(): CenterFormation[] {
  return collection.getAll();
}

export function addLocalCenterFormation(f: CenterFormation) {
  collection.add(f);
}

export function updateLocalCenterFormation(id: string, patch: Partial<CenterFormation>) {
  return collection.update(id, patch);
}

export function removeLocalCenterFormation(id: string) {
  collection.remove(id);
}

export { collection as centerFormationsCollection };
