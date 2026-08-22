'use client';

import { generateId } from './storage/ids';
import { favoritesCollection } from './localFavorites';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import type { Favorite } from '@/data/amud/favorites';

export function toggleFavorite(candidateId: string, existing: Favorite[]): { added: boolean } {
  const current = existing.find((f) => f.entrepriseId === CURRENT_EMPLOYER.entrepriseId && f.candidateId === candidateId);
  if (current) {
    favoritesCollection.remove(current.id);
    return { added: false };
  }
  favoritesCollection.add({ id: generateId('favorite'), entrepriseId: CURRENT_EMPLOYER.entrepriseId, candidateId, createdAt: new Date().toISOString() });
  return { added: true };
}
