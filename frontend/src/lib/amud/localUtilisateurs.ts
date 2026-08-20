'use client';

import type { Utilisateur } from '@/data/amud/utilisateurs';

/** Persistance légère (localStorage) des utilisateurs ajoutés depuis la popup "Ajouter un utilisateur". */
const KEY = 'amud:utilisateurs:extra';

export function loadLocalUtilisateurs(): Utilisateur[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Utilisateur[]) : [];
  } catch {
    return [];
  }
}

export function addLocalUtilisateur(u: Utilisateur) {
  if (typeof window === 'undefined') return;
  const current = loadLocalUtilisateurs();
  window.localStorage.setItem(KEY, JSON.stringify([...current, u]));
}
