'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterSessionState } from '@/data/amud/centerSessionStates';

const collection = createCollection<CenterSessionState>(AMUD_KEYS.centerSessionStates);

export function loadLocalCenterSessionStates(): CenterSessionState[] {
  return collection.getAll();
}

export function addLocalCenterSessionState(s: CenterSessionState) {
  collection.add(s);
}

export function updateLocalCenterSessionState(id: string, patch: Partial<CenterSessionState>) {
  return collection.update(id, patch);
}

export function removeLocalCenterSessionState(id: string) {
  collection.remove(id);
}

/** Une seule ligne par créneau — évite un doublon si `startSession` est rappelé pour le même `scheduleId`. */
export function getSessionStateBySchedule(scheduleId: string): CenterSessionState | undefined {
  return collection.getAll().find((s) => s.scheduleId === scheduleId);
}

export { collection as centerSessionStatesCollection };
