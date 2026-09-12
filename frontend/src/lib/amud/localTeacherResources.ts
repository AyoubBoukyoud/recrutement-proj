'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { TeacherResource } from '@/data/amud/centerTypes';

const collection = createCollection<TeacherResource>(AMUD_KEYS.teacherResources);

export function loadLocalTeacherResources(): TeacherResource[] {
  return collection.getAll();
}

export function addLocalTeacherResource(r: TeacherResource) {
  collection.add(r);
}

export function updateLocalTeacherResource(id: string, patch: Partial<TeacherResource>) {
  return collection.update(id, patch);
}

export function removeLocalTeacherResource(id: string) {
  collection.remove(id);
}

export { collection as teacherResourcesCollection };
