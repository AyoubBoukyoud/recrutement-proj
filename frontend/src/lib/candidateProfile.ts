// Dossier candidat — appels à l'API Laravel et vocabulaire associé.
//
// `PUT /candidate/profile` porte à la fois les champs personnels et les deux
// consentements (`terms_accepted`/`cndp_accepted`, traduits côté back en
// `terms_consent_at`/`cndp_consent_at`). La visibilité recruteur démarre dès
// que les deux consentements sont enregistrés — pas à la soumission, qui ne
// fait que déclarer le dossier prêt et qualifier le parrainage éventuel.

import { apiDelete, apiGet, apiGetList, apiPost, apiPut } from '@/lib/api';

export type AvailabilityStatus = 'immediate' | 'within_1_month' | 'within_2_months';

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  immediate: 'Immédiatement',
  within_1_month: "Sous 1 mois",
  within_2_months: 'Sous 2 mois',
};

/** Les seuls codes acceptés par CandidateLanguageController. */
export type LanguageCode = 'fr' | 'ar' | 'en' | 'de';

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  fr: 'Français',
  ar: 'Arabe',
  en: 'Anglais',
  de: 'Allemand',
};

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Les seuls niveaux acceptés par EducationController. */
export type EducationLevel =
  | 'general_school'
  | 'vocational'
  | 'professional_training'
  | 'bachelor'
  | 'master'
  | 'other';

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  general_school: 'Scolarité générale',
  vocational: 'Formation professionnelle',
  professional_training: 'Formation continue',
  bachelor: 'Licence / Bachelor',
  master: 'Master',
  other: 'Autre',
};

export interface EducationEntry {
  id: number;
  level: EducationLevel;
  field: string | null;
  institution: string | null;
  started_at: string | null;
  ended_at: string | null;
}

export interface EducationInput {
  level: EducationLevel;
  field?: string | null;
  institution?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
}

/** Champ minimal du document attaché à une langue certifiée — évite une dépendance circulaire vers lib/documents. */
export interface CertificateDocumentRef {
  id: number;
  type: string;
  url: string | null;
}

export interface CandidateLanguageEntry {
  id: number;
  language: LanguageCode;
  /** Le niveau retenu — le plus élevé entre déclaré et évalué, sauf certificat qui l'emporte toujours. */
  cefr_level: CefrLevel | null;
  self_declared_cefr: CefrLevel | null;
  ai_cefr: CefrLevel | null;
  source: 'self_declared' | 'ai_assessed' | 'certified';
  level_discrepancy: boolean;
  certificate_document_id: number | null;
  certificate_document?: CertificateDocumentRef | null;
}

/**
 * Correspondance entre une section requise par ProfileCompleteness et l'étape
 * du wizard `/profile-creation` qui la couvre — utilisée à la fois par le
 * wizard lui-même et par le garde-fou de complétude dans `(candidate)/layout.tsx`.
 */
export const REQUIRED_SECTION_TO_STEP: Record<string, number> = {
  personal: 1,
  education: 3,
  languages: 4,
  availability: 5,
  consents: 6,
};

export interface ProfileCompleteness {
  sections: { key: string; complete: boolean; required: boolean }[];
  completed: number;
  total: number;
  percent: number;
  missing_required: string[];
  can_submit: boolean;
  submitted_at: string | null;
}

export interface MatchingPreferences {
  regions?: string[];
  sectors?: string[];
  min_salary?: number | null;
}

export interface CandidateProfileData {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  profession: string | null;
  specialization: string | null;
  years_of_experience: number | null;
  date_of_birth: string | null;
  availability_status: AvailabilityStatus | null;
  matching_preferences: MatchingPreferences | null;
  terms_consent_at: string | null;
  cndp_consent_at: string | null;
  presentation_video_path: string | null;
  /** URL signée de courte durée — jamais un lien public permanent. */
  video_url: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  admin_notes: string | null;
  orientation_result: string | null;
  orientation_score: number | null;
  updated_at: string;
  educations: EducationEntry[];
  languages: CandidateLanguageEntry[];
  completeness: ProfileCompleteness;
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  profession?: string | null;
  specialization?: string | null;
  years_of_experience?: number | null;
  date_of_birth?: string;
  availability_status?: AvailabilityStatus;
  matching_preferences?: MatchingPreferences;
  terms_accepted?: boolean;
  cndp_accepted?: boolean;
  orientation_result?: string | null;
  orientation_score?: number | null;
  /** Concurrence optimiste : `updated_at` tel que connu du client avant l'édition. */
  base_updated_at?: string;
  /** « Je sais, applique quand même » — la résolution d'un 409. */
  force?: boolean;
}

export interface ProfilePreview {
  visible_to_recruiters: boolean;
  profile: Record<string, unknown>;
}

export function getProfile(token: string): Promise<CandidateProfileData> {
  return apiGet<CandidateProfileData>('/candidate/profile', token);
}

export function updateProfile(data: UpdateProfileInput, token: string): Promise<CandidateProfileData> {
  return apiPut<CandidateProfileData>('/candidate/profile', data, token);
}

export function uploadPresentationVideo(file: File, token: string): Promise<CandidateProfileData> {
  const form = new FormData();
  form.append('video', file);

  return apiPost<CandidateProfileData>('/candidate/profile/video', form, token);
}

export function getProfilePreview(token: string): Promise<ProfilePreview> {
  return apiGet<ProfilePreview>('/candidate/profile/preview', token);
}

export interface TimelineMilestone {
  key: string;
  label: string;
  completed_at: string | null;
}

export function getProfileTimeline(token: string): Promise<TimelineMilestone[]> {
  return apiGetList<TimelineMilestone>('/candidate/profile/timeline', token);
}

export function submitProfile(token: string): Promise<CandidateProfileData> {
  return apiPost<CandidateProfileData>('/candidate/profile/submit', {}, token);
}

// --- Formation -------------------------------------------------------------

export function listEducations(token: string): Promise<EducationEntry[]> {
  return apiGetList<EducationEntry>('/candidate/educations', token);
}

export function createEducation(data: EducationInput, token: string): Promise<EducationEntry> {
  return apiPost<EducationEntry>('/candidate/educations', data, token);
}

export function updateEducation(id: number, data: Partial<EducationInput>, token: string): Promise<EducationEntry> {
  return apiPut<EducationEntry>(`/candidate/educations/${id}`, data, token);
}

export function deleteEducation(id: number, token: string): Promise<void> {
  return apiDelete<void>(`/candidate/educations/${id}`, token);
}

// --- Langues -----------------------------------------------------------

export function listLanguages(token: string): Promise<CandidateLanguageEntry[]> {
  return apiGetList<CandidateLanguageEntry>('/candidate/languages', token);
}

export function upsertLanguage(
  language: LanguageCode,
  cefrLevel: CefrLevel | null,
  token: string
): Promise<CandidateLanguageEntry> {
  return apiPut<CandidateLanguageEntry>('/candidate/languages', { language, cefr_level: cefrLevel }, token);
}

/** Preuve par fichier inline : le seul chemin qui produit une langue `certified`. */
export function attachLanguageCertificateFile(
  language: LanguageCode,
  file: File,
  cefrLevel: CefrLevel | undefined,
  token: string
): Promise<CandidateLanguageEntry> {
  const form = new FormData();
  form.append('file', file);
  if (cefrLevel) form.append('cefr_level', cefrLevel);

  return apiPost<CandidateLanguageEntry>(`/candidate/languages/${language}/certificate`, form, token);
}

/** Preuve par document déjà présent dans Documents. */
export function attachLanguageCertificateDocument(
  language: LanguageCode,
  documentId: number,
  cefrLevel: CefrLevel | undefined,
  token: string
): Promise<CandidateLanguageEntry> {
  return apiPost<CandidateLanguageEntry>(
    `/candidate/languages/${language}/certificate`,
    { document_id: documentId, ...(cefrLevel ? { cefr_level: cefrLevel } : {}) },
    token
  );
}

export function detachLanguageCertificate(language: LanguageCode, token: string): Promise<CandidateLanguageEntry> {
  return apiDelete<CandidateLanguageEntry>(`/candidate/languages/${language}/certificate`, token);
}
