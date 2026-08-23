// Contenu de la page /faq (candidat), par langue. Même contrat que employeursContent.ts :
// typer sur `typeof fr` fait échouer le build si une traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-faq.fr.json';
import en from '@/content/candidate-faq.en.json';
import de from '@/content/candidate-faq.de.json';
import ar from '@/content/candidate-faq.ar.json';

export type CandidateFaqContent = typeof fr;

export const CANDIDATE_FAQ: Record<Language, CandidateFaqContent> = { fr, en, de, ar };

export function candidateFaqContentFor(language: Language): CandidateFaqContent {
  return CANDIDATE_FAQ[language] ?? CANDIDATE_FAQ.fr;
}
