// Contenu de la page candidat /matching-preferences, par langue. Même contrat
// que employeursContent.ts : typer sur `typeof fr` fait échouer le build si
// une traduction oublie une clé.
//
// `regionLabels` / `sectorLabels` traduisent uniquement l'affichage : les
// valeurs canoniques de REGIONS / ALL_SECTORS (définies dans la page) restent
// en français, car elles servent aussi de clés de comparaison (`includes`) et
// sont persistées telles quelles dans `matching_preferences` côté API.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-matching-preferences.fr.json';
import en from '@/content/candidate-matching-preferences.en.json';
import de from '@/content/candidate-matching-preferences.de.json';
import ar from '@/content/candidate-matching-preferences.ar.json';

export type CandidateMatchingPreferencesContent = typeof fr;

const CANDIDATE_MATCHING_PREFERENCES: Record<Language, CandidateMatchingPreferencesContent> = {
  fr,
  en,
  de,
  ar,
};

export function candidateMatchingPreferencesContentFor(
  language: Language
): CandidateMatchingPreferencesContent {
  return CANDIDATE_MATCHING_PREFERENCES[language] ?? CANDIDATE_MATCHING_PREFERENCES.fr;
}

/** Libellé traduit d'une région ; retombe sur la valeur canonique si absente. */
export function regionLabelFor(content: CandidateMatchingPreferencesContent, region: string): string {
  return (content.regionLabels as Record<string, string>)[region] ?? region;
}

/** Libellé traduit d'un secteur ; retombe sur la valeur canonique si absente. */
export function sectorLabelFor(content: CandidateMatchingPreferencesContent, sector: string): string {
  return (content.sectorLabels as Record<string, string>)[sector] ?? sector;
}
