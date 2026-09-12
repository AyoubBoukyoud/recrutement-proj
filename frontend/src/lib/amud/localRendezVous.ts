'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Rdv } from '@/data/amud/commercialRdv';

/**
 * Wrapper de compatibilité au-dessus de la collection centralisée
 * `AMUD_KEYS.appointments`. `AMUD_KEYS.appointments` est seedé une fois par
 * `initAmudDemoData()` avec `buildSeedRdvs()` — la collection contient donc
 * toujours quelque chose après le montage, `loadLocalRendezVous()` ne
 * renvoie plus `null`.
 */
export const rendezVousCollection = createCollection<Rdv>(AMUD_KEYS.appointments);

export function loadLocalRendezVous(): Rdv[] {
  return rendezVousCollection.getAll();
}

export function saveLocalRendezVous(all: Rdv[]) {
  rendezVousCollection.replace(all);
}
