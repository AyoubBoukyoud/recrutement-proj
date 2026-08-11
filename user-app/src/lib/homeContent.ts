// Contenu de la page d'accueil, par langue.
//
// Aucune chaîne n'est écrite dans un composant. Le typage sur `typeof fr` est
// délibéré : si une traduction oublie une clé, le build échoue au lieu de
// laisser un trou dans la page — c'est ce qui rend la promesse du sélecteur de
// langue tenable.

import type { Language } from '@/lib/types';
import fr from '@/content/home.fr.json';
import en from '@/content/home.en.json';
import de from '@/content/home.de.json';
import ar from '@/content/home.ar.json';

export type HomeContent = typeof fr;

export const HOME: Record<Language, HomeContent> = { fr, en, de, ar };

/** Le français reste le repli : c'est la seule langue rédigée à la main d'origine. */
export function homeFor(language: Language): HomeContent {
  return HOME[language] ?? HOME.fr;
}
