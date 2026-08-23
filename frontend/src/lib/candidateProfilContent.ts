// Contenu de la page /profil, par langue. Même contrat que employeursContent.ts :
// typer sur `typeof fr` fait échouer le build si une traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-profil.fr.json';
import en from '@/content/candidate-profil.en.json';
import de from '@/content/candidate-profil.de.json';
import ar from '@/content/candidate-profil.ar.json';

export type ProfilContent = typeof fr;

export const PROFIL: Record<Language, ProfilContent> = { fr, en, de, ar };

export function profilContentFor(language: Language): ProfilContent {
  return PROFIL[language] ?? PROFIL.fr;
}
