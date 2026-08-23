// Contenu de la page candidat /reclamation, par langue. Même contrat que
// employeursContent.ts : typer sur `typeof fr` fait échouer le build si une
// traduction oublie une clé.
//
// `categoryLabels` traduit uniquement l'affichage des options du <select> :
// les valeurs canoniques de CATEGORIES (définies dans la page) restent en
// français, car elles sont préfixées telles quelles dans `body` lors de
// l'envoi (`submitTextComplaint`/`submitVoiceComplaint`) puis relues par
// `parseSubject` — les garder stables évite des sujets incohérents selon la
// langue active au moment de l'envoi.
//
// `statusLabels` est en revanche indexé par `Complaint['status']`
// ('open' | 'in_review' | 'resolved'), qui est une valeur métier fixe non
// affectée par la langue : pas de fallback nécessaire.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-reclamation.fr.json';
import en from '@/content/candidate-reclamation.en.json';
import de from '@/content/candidate-reclamation.de.json';
import ar from '@/content/candidate-reclamation.ar.json';

export type CandidateReclamationContent = typeof fr;

const CANDIDATE_RECLAMATION: Record<Language, CandidateReclamationContent> = { fr, en, de, ar };

export function candidateReclamationContentFor(language: Language): CandidateReclamationContent {
  return CANDIDATE_RECLAMATION[language] ?? CANDIDATE_RECLAMATION.fr;
}

/** Libellé traduit d'une catégorie ; retombe sur la valeur canonique si absente. */
export function categoryLabelFor(content: CandidateReclamationContent, category: string): string {
  return (content.categoryLabels as Record<string, string>)[category] ?? category;
}
