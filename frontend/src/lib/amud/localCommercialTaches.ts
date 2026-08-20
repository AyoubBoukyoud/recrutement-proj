'use client';

import type { Tache } from '@/data/amud/commercialTaches';

/** Persistance légère (localStorage) des tâches ajoutées/modifiées depuis `/amud/commercial/*`. */
const KEY = 'amud:commercial:taches:extra';
const OVERRIDES_KEY = 'amud:commercial:taches:overrides';

export function loadLocalTaches(): Tache[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Tache[]) : [];
  } catch {
    return [];
  }
}

export function addLocalTache(t: Tache) {
  if (typeof window === 'undefined') return;
  const current = loadLocalTaches();
  window.localStorage.setItem(KEY, JSON.stringify([t, ...current]));
}

/** Sur-couche { id: Partial<Tache> } pour les modifications d'une tâche du seed (statut, échéance…) sans dupliquer l'enregistrement. */
export function loadLocalOverrides(): Record<string, Partial<Tache>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Partial<Tache>>) : {};
  } catch {
    return {};
  }
}

export function setLocalOverride(id: string, patch: Partial<Tache>) {
  if (typeof window === 'undefined') return;
  const current = loadLocalOverrides();
  window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify({ ...current, [id]: { ...current[id], ...patch } }));
}
