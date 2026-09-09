/**
 * Documents du candidat (`/amud/candidat/documents`) — représentés comme de
 * simples objets localStorage (§14 du cahier des charges) : pas de vrai
 * stockage de fichiers, `dataUrl` est optionnelle (remplie via `FileReader`
 * quand un vrai fichier est choisi, pour permettre un aperçu réaliste).
 */
export type DocumentType = 'CV' | 'Diplome' | 'Certificat' | 'Portfolio' | 'Autre';

export type CandidateDocument = {
  id: string;
  candidateAccountId: string;
  type: DocumentType;
  nom: string;
  dataUrl?: string;
  mimeType?: string;
  tailleKo?: number;
  uploadedAt: string;
};

export const DOCUMENT_TYPES: DocumentType[] = ['CV', 'Diplome', 'Certificat', 'Portfolio', 'Autre'];

export const DOCUMENT_TYPE_ICON: Record<DocumentType, string> = {
  CV: 'description',
  Diplome: 'school',
  Certificat: 'workspace_premium',
  Portfolio: 'collections',
  Autre: 'attach_file',
};

export function getDocumentsForCandidate(candidateAccountId: string, all: CandidateDocument[]) {
  return all.filter((d) => d.candidateAccountId === candidateAccountId);
}
