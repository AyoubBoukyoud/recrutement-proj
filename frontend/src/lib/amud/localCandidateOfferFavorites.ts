'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CandidateOfferFavorite } from '@/data/amud/candidateOfferFavorites';

export const candidateOfferFavoritesCollection = createCollection<CandidateOfferFavorite>(AMUD_KEYS.candidateOfferFavorites);

export function loadLocalCandidateOfferFavorites(): CandidateOfferFavorite[] {
  return candidateOfferFavoritesCollection.getAll();
}
