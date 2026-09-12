// Contenu de la page candidat /offres, par langue. Même contrat que
// employeursContent.ts : typer sur `typeof fr` fait échouer le build si une
// traduction oublie une clé.
//
// `filters.labels` traduit uniquement l'affichage des puces de filtre : les
// valeurs canoniques (définies dans la page, ex. FILTERS) restent en
// français, car elles servent aussi de clé de comparaison (`selectedFilter
// === filter`) pour le style actif/inactif.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-offres.fr.json';
import en from '@/content/candidate-offres.en.json';
import de from '@/content/candidate-offres.de.json';
import ar from '@/content/candidate-offres.ar.json';

export type CandidateOffresContent = typeof fr;

const CANDIDATE_OFFRES: Record<Language, CandidateOffresContent> = { fr, en, de, ar };

export function candidateOffresContentFor(language: Language): CandidateOffresContent {
  return CANDIDATE_OFFRES[language] ?? CANDIDATE_OFFRES.fr;
}

/** Libellé traduit d'un filtre ; retombe sur la valeur canonique si absente. */
export function filterLabelFor(content: CandidateOffresContent, filter: string): string {
  return (content.filters.labels as Record<string, string>)[filter] ?? filter;
}
