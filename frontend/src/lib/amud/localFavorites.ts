'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Favorite } from '@/data/amud/favorites';

const collection = createCollection<Favorite>(AMUD_KEYS.favorites);

export function loadLocalFavorites(): Favorite[] {
  return collection.getAll();
}

export function addLocalFavorite(f: Favorite) {
  collection.add(f);
}

export function removeLocalFavorite(id: string) {
  collection.remove(id);
}

export { collection as favoritesCollection };
