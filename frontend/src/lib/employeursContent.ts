// Contenu de la page /employeurs, par langue. Même contrat que homeContent.ts :
// typer sur `typeof fr` fait échouer le build si une traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/employeurs.fr.json';
import en from '@/content/employeurs.en.json';
import de from '@/content/employeurs.de.json';
import ar from '@/content/employeurs.ar.json';

export type EmployeursContent = typeof fr;

export const EMPLOYEURS: Record<Language, EmployeursContent> = { fr, en, de, ar };

export function employeursFor(language: Language): EmployeursContent {
  return EMPLOYEURS[language] ?? EMPLOYEURS.fr;
}
