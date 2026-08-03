// File d'attente de synchronisation hors-ligne.
// Les formulaires (upload documents, réclamation, vidéo, test de langue, messagerie…)
// poussent une action ici quand le réseau est indisponible. Dès que NetworkContext détecte
// la reconnexion, il appelle processQueue() pour "rejouer" les actions en attente.

import { readStorage, writeStorage, STORAGE_KEYS } from './storage';
import type { SyncAction, SyncActionType } from './types';

type Listener = (queue: SyncAction[]) => void;

const listeners = new Set<Listener>();

function getQueue(): SyncAction[] {
  return readStorage<SyncAction[]>(STORAGE_KEYS.syncQueue, []);
}

function setQueue(queue: SyncAction[]): void {
  writeStorage(STORAGE_KEYS.syncQueue, queue);
  listeners.forEach((listener) => listener(queue));
}

export function enqueue(type: SyncActionType, payload: Record<string, unknown>): SyncAction {
  const action: SyncAction = {
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
  setQueue([...getQueue(), action]);
  return action;
}

export function subscribeQueue(listener: Listener): () => void {
  listeners.add(listener);
  listener(getQueue());
  return () => listeners.delete(listener);
}

export function getQueueSnapshot(): SyncAction[] {
  return getQueue();
}

// Simule la synchronisation réseau des actions en attente (résolution après un court délai).
export async function processQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;
  await new Promise((resolve) => setTimeout(resolve, 800));
  setQueue([]);
}
