// Évaluation de langue orale — appels à l'API Laravel et vocabulaire associé.
//
// `POST` met l'enregistrement en file (transcription + notation), `GET .../{id}`
// est interrogé jusqu'à ce que `status` se fige. Sans `python3`+`faster-whisper`
// installé côté back, l'évaluation se termine `failed` avec
// `failure_reason=transcription_unavailable` plutôt que de planter la file —
// l'écran doit donc savoir montrer cet échec proprement, pas juste le succès.

import { apiGet, apiGetList, apiPost } from '@/lib/api';
import type { LanguageCode, CefrLevel } from '@/lib/candidateProfile';

export type AssessmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ScoreComponent {
  label?: string;
  score?: number;
  weight?: number;
  [key: string]: unknown;
}

export interface LanguageAssessmentResult {
  id: number;
  language: LanguageCode;
  status: AssessmentStatus;
  transcript: string | null;
  duration_seconds: number | null;
  words_per_minute: number | null;
  filler_word_ratio: number | null;
  pronunciation_score: number | null;
  predicted_cefr: CefrLevel | null;
  score_breakdown: Record<string, ScoreComponent> | null;
  failure_reason: string | null;
  badge_awarded_at: string | null;
  created_at: string;
}

export const isPending = (status: AssessmentStatus): boolean => status === 'pending' || status === 'processing';

export function listLanguageAssessments(token: string): Promise<LanguageAssessmentResult[]> {
  return apiGetList<LanguageAssessmentResult>('/candidate/language-assessments', token);
}

export function getLanguageAssessment(id: number, token: string): Promise<LanguageAssessmentResult> {
  return apiGet<LanguageAssessmentResult>(`/candidate/language-assessments/${id}`, token);
}

export function submitLanguageAssessment(
  language: LanguageCode,
  audio: Blob,
  token: string
): Promise<LanguageAssessmentResult> {
  const form = new FormData();
  form.append('language', language);
  form.append('audio', audio, 'assessment.webm');

  return apiPost<LanguageAssessmentResult>('/candidate/language-assessments', form, token);
}

export const FAILURE_REASON_LABELS: Record<string, string> = {
  transcription_unavailable: "La transcription n'est pas disponible sur ce serveur pour le moment.",
  too_short: "L'enregistrement est trop court pour être évalué (20 secondes minimum).",
  unintelligible: "Trop peu de parole intelligible n'a pu être détectée dans l'enregistrement.",
};

export function failureMessage(reason: string | null): string {
  if (!reason) return "L'évaluation a échoué. Réessayez.";
  return FAILURE_REASON_LABELS[reason] ?? "L'évaluation a échoué. Réessayez.";
}
