'use client';

import { generateId } from './storage/ids';
import { candidateOfferFavoritesCollection } from './localCandidateOfferFavorites';
import { candidateActivitiesCollection } from './localCandidateActivities';
import type { CandidateOfferFavorite } from '@/data/amud/candidateOfferFavorites';
import type { Offre } from '@/data/amud/offres';

export function toggleOfferFavorite(candidateAccountId: string, offre: Offre, existing: CandidateOfferFavorite[]): { added: boolean } {
  const current = existing.find((f) => f.candidateAccountId === candidateAccountId && f.offerId === offre.id);
  if (current) {
    candidateOfferFavoritesCollection.remove(current.id);
    return { added: false };
  }
  candidateOfferFavoritesCollection.add({
    id: generateId('candidate_favorite'),
    candidateAccountId,
    offerId: offre.id,
    createdAt: new Date().toISOString(),
  });
  candidateActivitiesCollection.add({
    id: generateId('candidate_activity'),
    candidateAccountId,
    type: 'offre_favorite',
    label: `Offre ajoutée aux favoris : ${offre.titre}`,
    href: `/amud/candidat/opportunites/${offre.id}`,
    createdAt: new Date().toISOString(),
  });
  return { added: true };
}
