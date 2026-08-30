/**
 * Journal d'activité personnel du candidat (§33 — "Mon activité") — distinct
 * de `AMUD_KEYS.activities`, qui est le journal commercial ↔ entreprise
 * (`commercialActivites.ts`), un domaine différent.
 */
export type CandidateActivityType =
  | 'profil'
  | 'cv'
  | 'offre_favorite'
  | 'candidature'
  | 'entretien'
  | 'message'
  | 'compte';

export type CandidateActivity = {
  id: string;
  candidateAccountId: string;
  type: CandidateActivityType;
  label: string;
  href?: string;
  createdAt: string;
};

export const ACTIVITY_ICON: Record<CandidateActivityType, string> = {
  profil: 'person',
  cv: 'description',
  offre_favorite: 'star',
  candidature: 'send',
  entretien: 'event',
  message: 'mail',
  compte: 'account_circle',
};

export function getActivitiesForCandidate(candidateAccountId: string, all: CandidateActivity[]) {
  return all.filter((a) => a.candidateAccountId === candidateAccountId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
