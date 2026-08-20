import type { Language } from './types';
import languages from '@/content/languages.json';
import fr from '@/content/i18n.fr.json';
import ar from '@/content/i18n.ar.json';
import en from '@/content/i18n.en.json';
import de from '@/content/i18n.de.json';

export const LANGUAGES = languages as { code: Language; label: string; flag: string }[];

// Dictionnaire des chaînes transversales (navigation, actions, onboarding, statuts communs),
// une entrée par langue dans src/content/i18n.<lang>.json. Le contenu spécifique à chaque
// écran reste rédigé directement en français dans les pages.
const dict = { fr, ar, en, de } as const;

export type TranslationKey = keyof (typeof dict)['fr'];

export function translate(language: Language, key: TranslationKey): string {
  return dict[language]?.[key] ?? dict.fr[key];
}
