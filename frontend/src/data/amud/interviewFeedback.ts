/**
 * Évaluation post-entretien (`/amud/entreprise/entretiens/:id`). Plusieurs
 * fiches peuvent exister pour un même entretien (plusieurs intervenants) —
 * append-only, comme `commercialActivites.ts`/`auditLog.ts`, plutôt qu'un
 * upsert 1:1.
 */
export type Recommendation = 'Fortement recommandé' | 'Recommandé' | 'À considérer' | 'Non recommandé';

export type InterviewFeedback = {
  id: string;
  interviewId: string;
  applicationId: string;
  candidateId: string;
  entrepriseId: string;
  authorNom: string;
  overall: number;
  technical: number;
  communication: number;
  motivation: number;
  cultureFit: number;
  recommendation: Recommendation;
  notes?: string;
  createdAt: string;
};

export const RECOMMENDATION_CLASS: Record<Recommendation, string> = {
  'Fortement recommandé': 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  Recommandé: 'bg-amud-primary-container text-amud-on-primary-container',
  'À considérer': 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  'Non recommandé': 'bg-amud-error-container text-amud-on-error-container',
};

export const interviewFeedbackSeed: InterviewFeedback[] = [
  { id: 'feedback_1', interviewId: 'interview_3', applicationId: 'application_12', candidateId: 'candidate_youssefa', entrepriseId: '1', authorNom: 'Fatima Zahra', overall: 4, technical: 4, communication: 5, motivation: 5, cultureFit: 4, recommendation: 'Recommandé', notes: 'Bon relationnel, motivation claire pour rejoindre l’équipe produit. À confirmer côté technique lors du prochain entretien.', createdAt: '2026-08-10T11:00:00.000Z' },
];

export function getFeedbackForInterview(interviewId: string, all: InterviewFeedback[] = interviewFeedbackSeed) {
  return all.filter((f) => f.interviewId === interviewId);
}
