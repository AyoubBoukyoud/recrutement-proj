// Contenu de la page /dashboard (candidat), par langue. Même contrat que
// employeursContent.ts : typer sur `typeof fr` fait échouer le build si une
// traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-dashboard.fr.json';
import en from '@/content/candidate-dashboard.en.json';
import de from '@/content/candidate-dashboard.de.json';
import ar from '@/content/candidate-dashboard.ar.json';

export type CandidateDashboardContent = typeof fr;

export const CANDIDATE_DASHBOARD: Record<Language, CandidateDashboardContent> = { fr, en, de, ar };

export function candidateDashboardContentFor(language: Language): CandidateDashboardContent {
  return CANDIDATE_DASHBOARD[language] ?? CANDIDATE_DASHBOARD.fr;
}
