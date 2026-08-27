import type { Language } from './types';
import fr from '@/content/candidate-candidatures.fr.json';
import en from '@/content/candidate-candidatures.en.json';
import de from '@/content/candidate-candidatures.de.json';
import ar from '@/content/candidate-candidatures.ar.json';

export type CandidateCandidaturesContent = typeof fr;
const CONTENT: Record<Language, CandidateCandidaturesContent> = { fr, en, de, ar };

export function candidateCandidaturesContentFor(language: Language): CandidateCandidaturesContent {
  return CONTENT[language] ?? CONTENT.fr;
}
