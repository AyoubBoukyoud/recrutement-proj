/**
 * Note privée d'une entreprise sur un candidat (`/amud/entreprise/candidats/:id`,
 * `/amud/entreprise/candidatures/:id`). Scopée par `(entrepriseId, candidateId)`
 * plutôt que rattachée au `Candidate` global (qui est partagé entre toutes
 * les entreprises) ou à une `Application` (le candidat n'a pas forcément
 * postulé — cas de la découverte libre dans `/amud/entreprise/candidats`).
 */
export type CandidateNote = {
  id: string;
  entrepriseId: string;
  candidateId: string;
  authorNom: string;
  text: string;
  createdAt: string;
};

export const candidateNotesSeed: CandidateNote[] = [
  { id: 'note_1', entrepriseId: '1', candidateId: 'candidate_youssefa', authorNom: 'Fatima Zahra', text: 'Très bon niveau technique en entretien téléphonique. À prioriser pour la suite du process.', createdAt: '2026-08-10T11:30:00.000Z' },
  { id: 'note_2', entrepriseId: '1', candidateId: 'candidate_nadiam', authorNom: 'Marc Dubois', text: 'Profil repéré via la recherche de candidats, pas encore postulé. À recontacter pour le poste de Data Scientist.', createdAt: '2026-08-18T08:05:00.000Z' },
];

export function getNotesForCandidate(entrepriseId: string, candidateId: string, all: CandidateNote[] = candidateNotesSeed) {
  return all.filter((n) => n.entrepriseId === entrepriseId && n.candidateId === candidateId);
}
