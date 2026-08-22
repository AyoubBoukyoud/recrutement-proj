'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { FollowUp } from '@/data/amud/followups';

export const followupsCollection = createCollection<FollowUp>(AMUD_KEYS.followups);

export function loadLocalFollowUps(): FollowUp[] {
  return followupsCollection.getAll();
}

export function updateLocalFollowUp(id: string, patch: Partial<FollowUp>) {
  return followupsCollection.update(id, patch);
}

export function removeLocalFollowUp(id: string) {
  followupsCollection.remove(id);
}
