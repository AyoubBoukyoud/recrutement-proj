// Contenu de la page /visibilite (candidat), par langue. Même contrat que employeursContent.ts :
// typer sur `typeof fr` fait échouer le build si une traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-visibilite.fr.json';
import en from '@/content/candidate-visibilite.en.json';
import de from '@/content/candidate-visibilite.de.json';
import ar from '@/content/candidate-visibilite.ar.json';

export type CandidateVisibiliteContent = typeof fr;

export const CANDIDATE_VISIBILITE: Record<Language, CandidateVisibiliteContent> = { fr, en, de, ar };

export function candidateVisibiliteContentFor(language: Language): CandidateVisibiliteContent {
  return CANDIDATE_VISIBILITE[language] ?? CANDIDATE_VISIBILITE.fr;
}
