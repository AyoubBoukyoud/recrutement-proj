'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterLead } from '@/data/amud/centerLeads';

const collection = createCollection<CenterLead>(AMUD_KEYS.centerLeads);

export function loadLocalCenterLeads(): CenterLead[] {
  return collection.getAll();
}

export function addLocalCenterLead(l: CenterLead) {
  collection.add(l);
}

export function updateLocalCenterLead(id: string, patch: Partial<CenterLead>) {
  return collection.update(id, patch);
}

export function removeLocalCenterLead(id: string) {
  collection.remove(id);
}

export { collection as centerLeadsCollection };
