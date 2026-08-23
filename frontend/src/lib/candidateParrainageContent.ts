// Contenu de la page candidat /parrainage, par langue. Même contrat que
// employeursContent.ts : typer sur `typeof fr` fait échouer le build si une
// traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-parrainage.fr.json';
import en from '@/content/candidate-parrainage.en.json';
import de from '@/content/candidate-parrainage.de.json';
import ar from '@/content/candidate-parrainage.ar.json';

export type CandidateParrainageContent = typeof fr;

const CANDIDATE_PARRAINAGE: Record<Language, CandidateParrainageContent> = { fr, en, de, ar };

export function candidateParrainageContentFor(language: Language): CandidateParrainageContent {
  return CANDIDATE_PARRAINAGE[language] ?? CANDIDATE_PARRAINAGE.fr;
}
