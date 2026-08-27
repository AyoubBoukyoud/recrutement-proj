import type { Language } from './types';
import fr from '@/content/candidate-favoris.fr.json';
import en from '@/content/candidate-favoris.en.json';
import de from '@/content/candidate-favoris.de.json';
import ar from '@/content/candidate-favoris.ar.json';

export type CandidateFavorisContent = typeof fr;
const CONTENT: Record<Language, CandidateFavorisContent> = { fr, en, de, ar };

export function candidateFavorisContentFor(language: Language): CandidateFavorisContent {
  return CONTENT[language] ?? CONTENT.fr;
}
