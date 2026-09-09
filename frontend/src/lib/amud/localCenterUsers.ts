'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterUser } from '@/data/amud/centerUsers';

const collection = createCollection<CenterUser>(AMUD_KEYS.centerUsers);

export function loadLocalCenterUsers(): CenterUser[] {
  return collection.getAll();
}

export function addLocalCenterUser(u: CenterUser) {
  collection.add(u);
}

export function updateLocalCenterUser(id: string, patch: Partial<CenterUser>) {
  return collection.update(id, patch);
}

export function removeLocalCenterUser(id: string) {
  collection.remove(id);
}

export { collection as centerUsersCollection };
