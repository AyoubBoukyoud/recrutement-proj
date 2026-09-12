'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterTarif } from '@/data/amud/centerTarifs';

const collection = createCollection<CenterTarif>(AMUD_KEYS.centerTarifs);

export function loadLocalCenterTarifs(): CenterTarif[] {
  return collection.getAll();
}

export function addLocalCenterTarif(t: CenterTarif) {
  collection.add(t);
}

export function updateLocalCenterTarif(id: string, patch: Partial<CenterTarif>) {
  return collection.update(id, patch);
}

export function removeLocalCenterTarif(id: string) {
  collection.remove(id);
}

export { collection as centerTarifsCollection };
