'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { StudentResult } from '@/data/amud/centerTypes';

const collection = createCollection<StudentResult>(AMUD_KEYS.studentResults);

export function loadLocalStudentResults(): StudentResult[] {
  return collection.getAll();
}

export function addLocalStudentResult(r: StudentResult) {
  collection.add(r);
}

export function updateLocalStudentResult(id: string, patch: Partial<StudentResult>) {
  return collection.update(id, patch);
}

export function removeLocalStudentResult(id: string) {
  collection.remove(id);
}

export { collection as studentResultsCollection };
