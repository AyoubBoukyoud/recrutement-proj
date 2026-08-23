// Contenu de la page /salaire, par langue. Même contrat que employeursContent.ts :
// typer sur `typeof fr` fait échouer le build si une traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-salaire.fr.json';
import en from '@/content/candidate-salaire.en.json';
import de from '@/content/candidate-salaire.de.json';
import ar from '@/content/candidate-salaire.ar.json';

export type SalaireContent = typeof fr;

export const SALAIRE: Record<Language, SalaireContent> = { fr, en, de, ar };

export function salaireContentFor(language: Language): SalaireContent {
  return SALAIRE[language] ?? SALAIRE.fr;
}
