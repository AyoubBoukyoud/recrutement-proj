'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterAttendanceRecord } from '@/data/amud/centerAttendance';

const collection = createCollection<CenterAttendanceRecord>(AMUD_KEYS.centerAttendance);

export function loadLocalCenterAttendance(): CenterAttendanceRecord[] {
  return collection.getAll();
}

export function addLocalCenterAttendance(a: CenterAttendanceRecord) {
  collection.add(a);
}

export function updateLocalCenterAttendance(id: string, patch: Partial<CenterAttendanceRecord>) {
  return collection.update(id, patch);
}

export function removeLocalCenterAttendance(id: string) {
  collection.remove(id);
}

export { collection as centerAttendanceCollection };
