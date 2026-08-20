'use client';

import type { Candidat, ColonneId } from '@/data/amud/candidatures';

/**
 * Persistance légère (localStorage) des candidats ajoutés depuis la popup
 * "Ajouter un candidat" de `/amud/admin/candidatures`. Même stratégie que
 * `localCommerciaux.ts` : le module `/amud` n'a pas de backend, donc sans ce
 * stockage un candidat "ajouté" disparaîtrait à la navigation suivante.
 */
const KEY = 'amud:candidatures:extra';

export type StoredCandidat = Candidat & { colonne: ColonneId };

export function loadLocalCandidats(): StoredCandidat[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredCandidat[]) : [];
  } catch {
    return [];
  }
}

export function addLocalCandidat(c: StoredCandidat) {
  if (typeof window === 'undefined') return;
  const current = loadLocalCandidats();
  window.localStorage.setItem(KEY, JSON.stringify([...current, c]));
}
