'use client';

/**
 * Bus d'événements minimal pour la réactivité inter-pages (cahier des
 * charges §32 : aucune page ne doit nécessiter un refresh manuel après une
 * mutation faite ailleurs). Pas de librairie de state management — un
 * `CustomEvent` sur `window` suffit puisque toutes les pages tournent déjà
 * côté client et que `createCollection` est un singleton par clé.
 */
const EVENT_NAME = 'amud:changed';

type AmudChangeDetail = { key: string };

export function emitAmudChange(key: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AmudChangeDetail>(EVENT_NAME, { detail: { key } }));
}

/** S'abonne aux changements d'une clé précise : mutations dans le même onglet (CustomEvent) et depuis un autre onglet (event natif `storage`). */
export function subscribeAmudChange(key: string, cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e: Event) => {
    const detail = (e as CustomEvent<AmudChangeDetail>).detail;
    if (!detail || detail.key === key) cb();
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === key) cb();
  };

  window.addEventListener(EVENT_NAME, handleCustom);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}
