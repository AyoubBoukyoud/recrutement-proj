'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterTeacherHoursRecord } from '@/data/amud/centerTeacherHours';

const collection = createCollection<CenterTeacherHoursRecord>(AMUD_KEYS.centerTeacherHours);

export function loadLocalCenterTeacherHours(): CenterTeacherHoursRecord[] {
  return collection.getAll();
}

export function addLocalCenterTeacherHoursRecord(r: CenterTeacherHoursRecord) {
  collection.add(r);
}

export { collection as centerTeacherHoursCollection };
