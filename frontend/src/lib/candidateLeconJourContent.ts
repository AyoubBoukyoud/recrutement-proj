// Contenu de la page /lecon-jour (candidat), par langue. Même contrat que employeursContent.ts :
// typer sur `typeof fr` fait échouer le build si une traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-lecon-jour.fr.json';
import en from '@/content/candidate-lecon-jour.en.json';
import de from '@/content/candidate-lecon-jour.de.json';
import ar from '@/content/candidate-lecon-jour.ar.json';

export type CandidateLeconJourContent = typeof fr;

export const CANDIDATE_LECON_JOUR: Record<Language, CandidateLeconJourContent> = { fr, en, de, ar };

export function candidateLeconJourContentFor(language: Language): CandidateLeconJourContent {
  return CANDIDATE_LECON_JOUR[language] ?? CANDIDATE_LECON_JOUR.fr;
}
