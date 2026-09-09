'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterTeacher } from '@/data/amud/centerTeachers';

const collection = createCollection<CenterTeacher>(AMUD_KEYS.centerTeachers);

export function loadLocalCenterTeachers(): CenterTeacher[] {
  return collection.getAll();
}

export function addLocalCenterTeacher(t: CenterTeacher) {
  collection.add(t);
}

export function updateLocalCenterTeacher(id: string, patch: Partial<CenterTeacher>) {
  return collection.update(id, patch);
}

export function removeLocalCenterTeacher(id: string) {
  collection.remove(id);
}

export { collection as centerTeachersCollection };
