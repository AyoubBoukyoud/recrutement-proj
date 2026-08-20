'use client';

import type { Rdv } from '@/data/amud/commercialRdv';

/**
 * Persistance légère (localStorage) de l'agenda commercial. Contrairement
 * aux autres modules `/amud` (qui ne persistent que les *ajouts*), l'agenda
 * doit aussi persister les modifications/reports/suppressions d'un
 * rendez-vous existant du seed — on stocke donc l'état complet de la liste
 * plutôt qu'un delta.
 */
const KEY = 'amud:rendezvous:all';

export function loadLocalRendezVous(): Rdv[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Rdv[]) : null;
  } catch {
    return null;
  }
}

export function saveLocalRendezVous(all: Rdv[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(all));
}
