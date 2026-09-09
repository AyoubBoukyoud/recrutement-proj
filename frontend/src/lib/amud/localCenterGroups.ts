'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterGroup } from '@/data/amud/centerGroups';

const collection = createCollection<CenterGroup>(AMUD_KEYS.centerGroups);

export function loadLocalCenterGroups(): CenterGroup[] {
  return collection.getAll();
}

export function addLocalCenterGroup(g: CenterGroup) {
  collection.add(g);
}

export function updateLocalCenterGroup(id: string, patch: Partial<CenterGroup>) {
  return collection.update(id, patch);
}

export function removeLocalCenterGroup(id: string) {
  collection.remove(id);
}

export { collection as centerGroupsCollection };
