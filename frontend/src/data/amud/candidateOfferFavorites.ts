/**
 * Offre mise en favori par un candidat (`/amud/candidat/favoris`) — distinct
 * de `Favorite` (`favorites.ts`), qui est la direction opposée (une
 * entreprise met un candidat en favori).
 */
export type CandidateOfferFavorite = {
  id: string;
  candidateAccountId: string;
  offerId: string;
  createdAt: string;
};

export function getOfferFavoritesForCandidate(candidateAccountId: string, all: CandidateOfferFavorite[]) {
  return all.filter((f) => f.candidateAccountId === candidateAccountId);
}
