'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Entreprise } from '@/data/amud/entreprises';

/**
 * Wrapper de compatibilité au-dessus de la collection centralisée
 * `AMUD_KEYS.companies` (voir `lib/amud/storage/collection.ts`). Mêmes noms
 * exportés que l'ancienne version "extras seuls", mais la sémantique change :
 * `loadLocalEntreprises()` renvoie désormais la collection ENTIÈRE (le seed,
 * écrit une fois par `initAmudDemoData`, plus tout ajout/modification), pas
 * un delta — les pages consommatrices ne doivent donc plus préfixer
 * `entreprisesSeed` elles-mêmes (ça a été corrigé dans cette même passe pour
 * toutes les pages qui le faisaient).
 */
const collection = createCollection<Entreprise>(AMUD_KEYS.companies);

export function loadLocalEntreprises(): Entreprise[] {
  return collection.getAll();
}

export function addLocalEntreprise(e: Entreprise) {
  collection.add(e);
}

export function updateLocalEntreprise(id: string, patch: Partial<Entreprise>) {
  return collection.update(id, patch);
}

export function removeLocalEntreprise(id: string) {
  collection.remove(id);
}

export function saveLocalEntreprises(all: Entreprise[]) {
  collection.replace(all);
}

export { collection as entreprisesCollection };
