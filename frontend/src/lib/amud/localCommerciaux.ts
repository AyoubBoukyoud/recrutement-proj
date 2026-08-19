'use client';

import type { Commercial } from '@/data/amud/commerciaux';

/**
 * Persistance légère (localStorage) des commerciaux créés depuis
 * `/amud/admin/commerciaux/nouveau`. Le module `/amud` n'a pas de backend
 * (cf. décision prise en amont avec l'utilisateur) — sans ce petit stockage,
 * un commercial "créé" disparaîtrait à la navigation suivante, ce qui
 * casserait le lien liste → profil que ce formulaire est censé alimenter.
 */
const KEY = 'amud:commerciaux:extra';

export function loadLocalCommerciaux(): Commercial[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Commercial[]) : [];
  } catch {
    return [];
  }
}

export function addLocalCommercial(c: Commercial) {
  if (typeof window === 'undefined') return;
  const current = loadLocalCommerciaux();
  window.localStorage.setItem(KEY, JSON.stringify([...current, c]));
}
