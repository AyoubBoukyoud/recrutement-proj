// Contenu de la page /documents (candidat), par langue. Même contrat que
// employeursContent.ts : typer sur `typeof fr` fait échouer le build si une
// traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-documents.fr.json';
import en from '@/content/candidate-documents.en.json';
import de from '@/content/candidate-documents.de.json';
import ar from '@/content/candidate-documents.ar.json';

export type CandidateDocumentsContent = typeof fr;

export const CANDIDATE_DOCUMENTS: Record<Language, CandidateDocumentsContent> = { fr, en, de, ar };

export function candidateDocumentsContentFor(language: Language): CandidateDocumentsContent {
  return CANDIDATE_DOCUMENTS[language] ?? CANDIDATE_DOCUMENTS.fr;
}
