'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Interview } from '@/data/amud/interviews';

const collection = createCollection<Interview>(AMUD_KEYS.interviews);

export function loadLocalInterviews(): Interview[] {
  return collection.getAll();
}

export function addLocalInterview(i: Interview) {
  collection.add(i);
}

export function updateLocalInterview(id: string, patch: Partial<Interview>) {
  return collection.update(id, patch);
}

export function removeLocalInterview(id: string) {
  collection.remove(id);
}

export { collection as interviewsCollection };
