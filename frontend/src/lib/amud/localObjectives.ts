'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Objective } from '@/data/amud/objectives';

export const objectivesCollection = createCollection<Objective>(AMUD_KEYS.objectives);

export function loadLocalObjectives(): Objective[] {
  return objectivesCollection.getAll();
}

export function updateLocalObjective(id: string, patch: Partial<Objective>) {
  return objectivesCollection.update(id, patch);
}
