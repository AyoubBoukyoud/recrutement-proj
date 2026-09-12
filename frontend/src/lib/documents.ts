// Extraction de CV — appels à l'API Laravel et vocabulaire associé.
//
// Le pipeline côté back tient en trois temps : `POST /candidate/documents`
// stocke le fichier et met l'analyse en file d'attente, `GET .../{id}` est
// interrogé jusqu'à ce que `ocr_status` se fige, puis `PATCH .../{id}/review`
// écrit sur le profil ce que le candidat a confirmé. Tant que ce dernier appel
// n'a pas lieu, les valeurs lues restent scellées dans l'extraction.

import { apiGet, apiGetList, apiPatch, apiPost } from '@/lib/api';
import type { DocumentEntry, Language } from '@/lib/types';

/** Les quatre seuls types acceptés par la validation du back. */
export type BackendDocumentType = 'cv' | 'certificate' | 'diploma' | 'identity';

/**
 * `needs_review` signifie qu'une lecture a bien eu lieu mais sans certitude :
 * le candidat corrige un formulaire pré-rempli. `failed` signifie que la page
 * n'a pas pu être lue du tout et qu'il faut une meilleure photo.
 */
export type OcrStatus = 'pending' | 'processing' | 'completed' | 'needs_review' | 'failed';

export interface ExtractedEducation {
  level?: string;
  field?: string;
  institution?: string;
  started_at?: string;
  ended_at?: string;
}

export interface ExtractedLanguage {
  language?: string;
  cefr_level?: string;
}

export interface ExtractedFields {
  /** Quel moteur a produit ces valeurs — Gemini lit les PDF, Tesseract les images. */
  extracted_by?: 'gemini' | 'tesseract';
  escalated_to_cloud?: boolean;
  raw_text?: string;
  full_name?: string;
  /** Ce que la passe Tesseract devine d'une ligne de texte, faute de mieux. */
  probable_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  profession?: string;
  specialization?: string;
  years_of_experience?: number | null;
  educations?: ExtractedEducation[];
  languages?: ExtractedLanguage[];
  [key: string]: unknown;
}

export interface DocumentExtraction {
  id: number;
  extracted_fields: ExtractedFields | null;
  confidence: number | null;
  reviewed_at: string | null;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface CandidateDocument {
  id: number;
  type: BackendDocumentType;
  file_path: string;
  /** URL signée de courte durée — jamais un lien public permanent. */
  url: string | null;
  ocr_status: OcrStatus;
  /** Jugement d'un administrateur sur le document lui-même — distinct de `ocr_status`, qui ne parle que du scanner. */
  approval_status?: ApprovalStatus;
  rejection_reason?: string | null;
  created_at?: string;
  extraction?: DocumentExtraction | null;
}

/** Ce que `review` a réellement écrit sur le profil, et ce qu'il a laissé en place. */
export interface ProfileUpdateResult {
  applied: string[];
  skipped: string[];
}

export type ReviewResponse = CandidateDocument & { profile_update: ProfileUpdateResult };

const DOCUMENT_TYPE_LABELS: Record<Language, Record<BackendDocumentType, string>> = {
  fr: { cv: 'CV', diploma: 'Diplôme', certificate: 'Certificat de langue', identity: "Pièce d'identité" },
  en: { cv: 'CV', diploma: 'Diploma', certificate: 'Language certificate', identity: 'ID document' },
  de: { cv: 'Lebenslauf', diploma: 'Diplom', certificate: 'Sprachzertifikat', identity: 'Ausweisdokument' },
  ar: { cv: 'السيرة الذاتية', diploma: 'الشهادة الجامعية', certificate: 'شهادة لغة', identity: 'وثيقة الهوية' },
};

export const documentTypeLabel = (type: BackendDocumentType, language: Language): string =>
  (DOCUMENT_TYPE_LABELS[language] ?? DOCUMENT_TYPE_LABELS.fr)[type];

/** Colonnes du profil telles que l'API les nomme, dans les mots du candidat. */
const FIELD_LABELS: Record<Language, Record<string, string>> = {
  fr: {
    first_name: 'prénom',
    last_name: 'nom',
    date_of_birth: 'date de naissance',
    profession: 'métier',
    specialization: 'spécialisation',
    years_of_experience: "années d'expérience",
    educations: 'formation',
    languages: 'langues',
  },
  en: {
    first_name: 'first name',
    last_name: 'last name',
    date_of_birth: 'date of birth',
    profession: 'occupation',
    specialization: 'specialization',
    years_of_experience: 'years of experience',
    educations: 'education',
    languages: 'languages',
  },
  de: {
    first_name: 'Vorname',
    last_name: 'Nachname',
    date_of_birth: 'Geburtsdatum',
    profession: 'Beruf',
    specialization: 'Spezialisierung',
    years_of_experience: 'Berufserfahrung',
    educations: 'Ausbildung',
    languages: 'Sprachen',
  },
  ar: {
    first_name: 'الاسم الشخصي',
    last_name: 'الاسم العائلي',
    date_of_birth: 'تاريخ الميلاد',
    profession: 'المهنة',
    specialization: 'التخصص',
    years_of_experience: 'سنوات الخبرة',
    educations: 'التكوين',
    languages: 'اللغات',
  },
};

export const fieldLabel = (key: string, language: Language): string =>
  (FIELD_LABELS[language] ?? FIELD_LABELS.fr)[key] ?? key.replace(/_/g, ' ');

const STATUS_LABELS: Record<Language, Record<OcrStatus, string>> = {
  fr: {
    pending: "En attente d'analyse…",
    processing: 'Analyse en cours…',
    completed: 'Analyse terminée',
    needs_review: 'Analysé — vérifiez les informations',
    failed: 'Page illisible',
  },
  en: {
    pending: 'Waiting to be analyzed…',
    processing: 'Analyzing…',
    completed: 'Analysis complete',
    needs_review: 'Analyzed — please check the information',
    failed: 'Page unreadable',
  },
  de: {
    pending: 'Wartet auf Analyse…',
    processing: 'Analyse läuft…',
    completed: 'Analyse abgeschlossen',
    needs_review: 'Analysiert — bitte Angaben prüfen',
    failed: 'Seite nicht lesbar',
  },
  ar: {
    pending: 'في انتظار التحليل…',
    processing: 'جارٍ التحليل…',
    completed: 'اكتمل التحليل',
    needs_review: 'تم التحليل — يرجى مراجعة المعلومات',
    failed: 'تعذّرت قراءة الصفحة',
  },
};

export const ocrStatusLabel = (status: OcrStatus, language: Language): string =>
  (STATUS_LABELS[language] ?? STATUS_LABELS.fr)[status];

export const isScanning = (status: OcrStatus): boolean => status === 'pending' || status === 'processing';

/**
 * Le back ne connaît que trois types, l'application locale quatre libellés :
 * un certificat retombe sur « autre », qui est ce que le tableau de bord et le
 * profil savent afficher.
 */
export function toLocalEntry(document: CandidateDocument, name: string): DocumentEntry {
  const type: DocumentEntry['type'] =
    document.type === 'cv' ? 'cv' : document.type === 'diploma' ? 'diplome' : 'autre';

  const status: DocumentEntry['status'] =
    document.ocr_status === 'failed' ? 'rejete' : isScanning(document.ocr_status) ? 'en_attente' : 'valide';

  return {
    id: `doc_${document.id}`,
    type,
    name,
    uploadedAt: document.created_at ?? new Date().toISOString(),
    status,
  };
}

/** Nom lisible pour un document dont on n'a que le chemin de stockage. */
export function fileNameOf(document: CandidateDocument): string {
  const base = document.file_path.split('/').pop() ?? `document_${document.id}`;
  return decodeURIComponent(base);
}

export function listDocuments(token: string): Promise<CandidateDocument[]> {
  return apiGetList<CandidateDocument>('/candidate/documents', token);
}

export function getDocument(id: number, token: string): Promise<CandidateDocument> {
  return apiGet<CandidateDocument>(`/candidate/documents/${id}`, token);
}

export function uploadDocument(file: File, type: BackendDocumentType, token: string): Promise<CandidateDocument> {
  const form = new FormData();
  form.append('type', type);
  form.append('file', file);

  return apiPost<CandidateDocument>('/candidate/documents', form, token);
}

/**
 * Confirmer, c'est écrire : `overwrite` à false ne remplit que les champs
 * vides du profil, de sorte que ce que le candidat a saisi lui-même l'emporte
 * sur ce qu'un CV a été lu comme disant.
 */
export function reviewDocument(
  id: number,
  fields: ExtractedFields,
  token: string,
  overwrite = false
): Promise<ReviewResponse> {
  return apiPatch<ReviewResponse>(
    `/candidate/documents/${id}/review`,
    { extracted_fields: fields, apply: true, overwrite },
    token
  );
}

/** Repasser le même fichier dans le pipeline — le cas d'un échec passager de l'API. */
export function retryDocument(id: number, token: string): Promise<CandidateDocument> {
  return apiPost<CandidateDocument>(`/candidate/documents/${id}/retry`, {}, token);
}

/** Remplacer le fichier — le cas d'une page réellement illisible. */
export function rescanDocument(id: number, file: File, token: string): Promise<CandidateDocument> {
  const form = new FormData();
  form.append('file', file);

  return apiPost<CandidateDocument>(`/candidate/documents/${id}/rescan`, form, token);
}
