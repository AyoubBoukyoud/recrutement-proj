'use client';

import type { Entreprise } from '@/data/amud/entreprises';

/** Persistance légère (localStorage) des entreprises ajoutées depuis la popup "Ajouter une entreprise". */
const KEY = 'amud:entreprises:extra';

export function loadLocalEntreprises(): Entreprise[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Entreprise[]) : [];
  } catch {
    return [];
  }
}

export function addLocalEntreprise(e: Entreprise) {
  if (typeof window === 'undefined') return;
  const current = loadLocalEntreprises();
  window.localStorage.setItem(KEY, JSON.stringify([...current, e]));
}

export function saveLocalEntreprises(all: Entreprise[], seedIds: Set<string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(all.filter((e) => !seedIds.has(e.id))));
}
