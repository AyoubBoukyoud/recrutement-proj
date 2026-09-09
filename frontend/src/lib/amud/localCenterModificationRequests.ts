'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterModificationRequest } from '@/data/amud/centerModificationRequests';

const collection = createCollection<CenterModificationRequest>(AMUD_KEYS.centerModificationRequests);

export function loadLocalCenterModificationRequests(): CenterModificationRequest[] {
  return collection.getAll();
}

export function addLocalCenterModificationRequest(r: CenterModificationRequest) {
  collection.add(r);
}

export function updateLocalCenterModificationRequest(id: string, patch: Partial<CenterModificationRequest>) {
  return collection.update(id, patch);
}

export function removeLocalCenterModificationRequest(id: string) {
  collection.remove(id);
}

export { collection as centerModificationRequestsCollection };
