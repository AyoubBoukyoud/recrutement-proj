'use client';

import { useSyncExternalStore } from 'react';
import { isTrainingDemo, TRAINING_DEMO_EVENT, TRAINING_DEMO_KEY } from './trainingDemo';
import { ensurePresentationAccess, hasPresentationAccess, PRESENTATION_EVENT } from './presentationAccess';

function subscribe(callback: () => void) {
  void ensurePresentationAccess();
  const onStorage = (event: StorageEvent) => {
    if (event.key === TRAINING_DEMO_KEY || event.key === null) callback();
  };
  window.addEventListener(TRAINING_DEMO_EVENT, callback);
  window.addEventListener(PRESENTATION_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(TRAINING_DEMO_EVENT, callback);
    window.removeEventListener(PRESENTATION_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

/** Demo data is shown only when switched on AND this browser holds a verified presentation grant. */
export function useTrainingDemo() {
  return useSyncExternalStore(subscribe, isTrainingDemo, () => false);
}

/** Server-verified presentation grant (prototype access) for this browser. */
export function usePresentationAccess() {
  return useSyncExternalStore(subscribe, hasPresentationAccess, () => false);
}
