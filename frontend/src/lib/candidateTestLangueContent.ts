// Contenu de la page /test-langue (candidat), par langue. Même contrat que
// employeursContent.ts : typer sur `typeof fr` fait échouer le build si une
// traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-test-langue.fr.json';
import en from '@/content/candidate-test-langue.en.json';
import de from '@/content/candidate-test-langue.de.json';
import ar from '@/content/candidate-test-langue.ar.json';

export type CandidateTestLangueContent = typeof fr;

export const CANDIDATE_TEST_LANGUE: Record<Language, CandidateTestLangueContent> = { fr, en, de, ar };

export function candidateTestLangueContentFor(language: Language): CandidateTestLangueContent {
  return CANDIDATE_TEST_LANGUE[language] ?? CANDIDATE_TEST_LANGUE.fr;
}
