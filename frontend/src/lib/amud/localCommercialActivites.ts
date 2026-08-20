'use client';

import type { Activite } from '@/data/amud/commercialActivites';

/**
 * Persistance légère (localStorage) des activités créées depuis les pages
 * `/amud/commercial/*` (fiche entreprise, page Activités). Même pattern que
 * `localEntreprises.ts` / `localOffres.ts` : c'est ce qui permet à une
 * activité créée sur la fiche entreprise ("Ajouter une activité", "Appeler")
 * d'apparaître aussi sur la page centrale Activités sans dupliquer les
 * données — une seule source, mergée au montage de chaque page.
 */
const KEY = 'amud:commercial:activites:extra';

export function loadLocalActivites(): Activite[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Activite[]) : [];
  } catch {
    return [];
  }
}

export function addLocalActivite(a: Activite) {
  if (typeof window === 'undefined') return;
  const current = loadLocalActivites();
  window.localStorage.setItem(KEY, JSON.stringify([a, ...current]));
}
