// Contenu de la page /video (candidat), par langue. Même contrat que employeursContent.ts :
// typer sur `typeof fr` fait échouer le build si une traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-video.fr.json';
import en from '@/content/candidate-video.en.json';
import de from '@/content/candidate-video.de.json';
import ar from '@/content/candidate-video.ar.json';

export type CandidateVideoContent = typeof fr;

export const CANDIDATE_VIDEO: Record<Language, CandidateVideoContent> = { fr, en, de, ar };

export function candidateVideoContentFor(language: Language): CandidateVideoContent {
  return CANDIDATE_VIDEO[language] ?? CANDIDATE_VIDEO.fr;
}
