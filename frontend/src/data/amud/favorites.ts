/** Candidat mis en favori par une entreprise (`/amud/entreprise/favoris`). */
export type Favorite = {
  id: string;
  entrepriseId: string;
  candidateId: string;
  createdAt: string;
};

export const favoritesSeed: Favorite[] = [
  { id: 'favorite_1', entrepriseId: '1', candidateId: 'candidate_nadiam', createdAt: '2026-08-15T09:00:00.000Z' },
  { id: 'favorite_2', entrepriseId: '1', candidateId: 'candidate_leilat', createdAt: '2026-08-17T09:00:00.000Z' },
  { id: 'favorite_3', entrepriseId: '1', candidateId: 'candidate_karimb', createdAt: '2026-08-19T09:00:00.000Z' },
];

export function getFavoritesForEntreprise(entrepriseId: string, all: Favorite[] = favoritesSeed) {
  return all.filter((f) => f.entrepriseId === entrepriseId);
}
