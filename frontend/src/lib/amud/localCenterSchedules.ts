'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterSchedule } from '@/data/amud/centerSchedules';

const collection = createCollection<CenterSchedule>(AMUD_KEYS.centerSchedules);

export function loadLocalCenterSchedules(): CenterSchedule[] {
  return collection.getAll();
}

export function addLocalCenterSchedule(s: CenterSchedule) {
  collection.add(s);
}

export function updateLocalCenterSchedule(id: string, patch: Partial<CenterSchedule>) {
  return collection.update(id, patch);
}

export function removeLocalCenterSchedule(id: string) {
  collection.remove(id);
}

export { collection as centerSchedulesCollection };
