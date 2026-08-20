'use client';

import type { Offre } from '@/data/amud/offres';

/** Persistance légère (localStorage) des offres ajoutées depuis la popup "Ajouter une offre". */
const KEY = 'amud:offres:extra';

export function loadLocalOffres(): Offre[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Offre[]) : [];
  } catch {
    return [];
  }
}

export function addLocalOffre(o: Offre) {
  if (typeof window === 'undefined') return;
  const current = loadLocalOffres();
  window.localStorage.setItem(KEY, JSON.stringify([...current, o]));
}

export function saveLocalOffres(all: Offre[], seedIds: Set<string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(all.filter((o) => !seedIds.has(o.id))));
}
