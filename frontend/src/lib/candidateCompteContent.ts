import type { Language } from './types';
import fr from '@/content/candidate-compte.fr.json';
import en from '@/content/candidate-compte.en.json';
import de from '@/content/candidate-compte.de.json';
import ar from '@/content/candidate-compte.ar.json';

export type CandidateCompteContent = typeof fr;
const CONTENT: Record<Language, CandidateCompteContent> = { fr, en, de, ar };

export function candidateCompteContentFor(language: Language): CandidateCompteContent {
  return CONTENT[language] ?? CONTENT.fr;
}
