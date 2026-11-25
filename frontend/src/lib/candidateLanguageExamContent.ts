// Textes de l'examen de langue AMUD (/test-langue), par langue. Typer sur
// `typeof fr` fait échouer le build si une traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-language-exam.fr.json';
import en from '@/content/candidate-language-exam.en.json';
import de from '@/content/candidate-language-exam.de.json';
import ar from '@/content/candidate-language-exam.ar.json';

export type LanguageExamContent = typeof fr;

const CONTENT: Record<Language, LanguageExamContent> = { fr, en, de, ar };

export function languageExamContentFor(language: Language): LanguageExamContent {
  return CONTENT[language] ?? CONTENT.fr;
}

/** `{name}` placeholders, as the other content files use. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}
