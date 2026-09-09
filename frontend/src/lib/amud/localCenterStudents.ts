'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterStudent } from '@/data/amud/centerStudents';

const collection = createCollection<CenterStudent>(AMUD_KEYS.centerStudents);

export function loadLocalCenterStudents(): CenterStudent[] {
  return collection.getAll();
}

export function addLocalCenterStudent(s: CenterStudent) {
  collection.add(s);
}

export function updateLocalCenterStudent(id: string, patch: Partial<CenterStudent>) {
  return collection.update(id, patch);
}

export function removeLocalCenterStudent(id: string) {
  collection.remove(id);
}

export { collection as centerStudentsCollection };
