import type { Language } from './types';
import fr from '@/content/candidate-notifications.fr.json';
import en from '@/content/candidate-notifications.en.json';
import de from '@/content/candidate-notifications.de.json';
import ar from '@/content/candidate-notifications.ar.json';

export type CandidateNotificationsContent = typeof fr;
const CONTENT: Record<Language, CandidateNotificationsContent> = { fr, en, de, ar };

export function candidateNotificationsContentFor(language: Language): CandidateNotificationsContent {
  return CONTENT[language] ?? CONTENT.fr;
}
