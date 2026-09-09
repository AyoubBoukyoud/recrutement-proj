'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CandidateActivity } from '@/data/amud/candidateActivities';

export const candidateActivitiesCollection = createCollection<CandidateActivity>(AMUD_KEYS.candidateActivities);

export function loadLocalCandidateActivities(): CandidateActivity[] {
  return candidateActivitiesCollection.getAll();
}
