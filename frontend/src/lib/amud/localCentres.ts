'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Centre } from '@/data/amud/centres';

const collection = createCollection<Centre>(AMUD_KEYS.centres);

export function loadLocalCentres(): Centre[] {
  return collection.getAll();
}

export function addLocalCentre(c: Centre) {
  collection.add(c);
}

export function updateLocalCentre(id: string, patch: Partial<Centre>) {
  return collection.update(id, patch);
}

export function removeLocalCentre(id: string) {
  collection.remove(id);
}

export { collection as centresCollection };
