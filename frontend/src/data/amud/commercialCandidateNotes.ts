/**
 * Note privée d'un Commercial sur un candidat (`/amud/commercial/candidats/:id`).
 * Même principe que `data/amud/candidateNotes.ts` (notes d'une entreprise sur
 * un candidat) mais scopée `(commercialId, candidateId)` — les deux espaces
 * ont chacun leur propre calepin sur le même candidat partagé, sans se voir
 * mutuellement.
 */
export type CommercialCandidateNote = {
  id: string;
  commercialId: string;
  candidateId: string;
  authorNom: string;
  text: string;
  createdAt: string;
};

export const commercialCandidateNotesSeed: CommercialCandidateNote[] = [];

export function getCommercialNotesForCandidate(commercialId: string, candidateId: string, all: CommercialCandidateNote[] = commercialCandidateNotesSeed) {
  return all.filter((n) => n.commercialId === commercialId && n.candidateId === candidateId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
