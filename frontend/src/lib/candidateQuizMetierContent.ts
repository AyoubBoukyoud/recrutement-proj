// Contenu de la page /quiz-metier (candidat), par langue. Même contrat que employeursContent.ts :
// typer sur `typeof fr` fait échouer le build si une traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-quiz-metier.fr.json';
import en from '@/content/candidate-quiz-metier.en.json';
import de from '@/content/candidate-quiz-metier.de.json';
import ar from '@/content/candidate-quiz-metier.ar.json';

export type CandidateQuizMetierContent = typeof fr;

export const CANDIDATE_QUIZ_METIER: Record<Language, CandidateQuizMetierContent> = { fr, en, de, ar };

export function candidateQuizMetierContentFor(language: Language): CandidateQuizMetierContent {
  return CANDIDATE_QUIZ_METIER[language] ?? CANDIDATE_QUIZ_METIER.fr;
}
