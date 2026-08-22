/**
 * Le dossier candidat (informations, formation, langues), en maquette ou via
 * l'API Laravel réelle. L'implémentation HTTP délègue à `lib/candidateProfile`,
 * qui reste la description du contrat réel du back.
 */
import {
  getProfile,
  updateProfile,
  uploadPresentationVideo,
  getProfilePreview,
  submitProfile,
  listEducations,
  createEducation,
  updateEducation,
  deleteEducation,
  listLanguages,
  upsertLanguage,
  attachLanguageCertificateFile,
  attachLanguageCertificateDocument,
  detachLanguageCertificate,
  type CandidateProfileData,
  type UpdateProfileInput,
  type ProfilePreview,
  type EducationEntry,
  type EducationInput,
  type CandidateLanguageEntry,
  type LanguageCode,
  type CefrLevel,
} from '@/lib/candidateProfile';
import { fakeLatency } from './config';

export interface CandidateProfileRepository {
  get(token: string): Promise<CandidateProfileData>;
  update(data: UpdateProfileInput, token: string): Promise<CandidateProfileData>;
  uploadVideo(file: File, token: string): Promise<CandidateProfileData>;
  preview(token: string): Promise<ProfilePreview>;
  submit(token: string): Promise<CandidateProfileData>;
  listEducations(token: string): Promise<EducationEntry[]>;
  createEducation(data: EducationInput, token: string): Promise<EducationEntry>;
  updateEducation(id: number, data: Partial<EducationInput>, token: string): Promise<EducationEntry>;
  deleteEducation(id: number, token: string): Promise<void>;
  listLanguages(token: string): Promise<CandidateLanguageEntry[]>;
  upsertLanguage(language: LanguageCode, cefrLevel: CefrLevel | null, token: string): Promise<CandidateLanguageEntry>;
  attachCertificateFile(
    language: LanguageCode,
    file: File,
    cefrLevel: CefrLevel | undefined,
    token: string
  ): Promise<CandidateLanguageEntry>;
  attachCertificateDocument(
    language: LanguageCode,
    documentId: number,
    cefrLevel: CefrLevel | undefined,
    token: string
  ): Promise<CandidateLanguageEntry>;
  detachCertificate(language: LanguageCode, token: string): Promise<CandidateLanguageEntry>;
}

const httpCandidateProfile: CandidateProfileRepository = {
  get: getProfile,
  update: updateProfile,
  uploadVideo: uploadPresentationVideo,
  preview: getProfilePreview,
  submit: submitProfile,
  listEducations,
  createEducation,
  updateEducation,
  deleteEducation,
  listLanguages,
  upsertLanguage,
  attachCertificateFile: attachLanguageCertificateFile,
  attachCertificateDocument: attachLanguageCertificateDocument,
  detachCertificate: detachLanguageCertificate,
};

/* ------------------------------------------------------------------ *
 * Maquette — état en mémoire, réinitialisé au rechargement de la page.
 * ------------------------------------------------------------------ */

function emptyCompleteness(): CandidateProfileData['completeness'] {
  return {
    sections: [
      { key: 'personal', complete: false, required: true },
      { key: 'education', complete: false, required: true },
      { key: 'languages', complete: false, required: true },
      { key: 'availability', complete: false, required: true },
      { key: 'consents', complete: false, required: true },
      { key: 'video', complete: false, required: false },
      { key: 'cv', complete: false, required: false },
      { key: 'certificates', complete: false, required: false },
    ],
    completed: 0,
    total: 8,
    percent: 0,
    missing_required: ['personal', 'education', 'languages', 'availability', 'consents'],
    can_submit: false,
    submitted_at: null,
  };
}

let profile: CandidateProfileData | null = null;
let educations: EducationEntry[] = [];
let languages: CandidateLanguageEntry[] = [];
let nextEducationId = 1;

function state(): CandidateProfileData {
  if (profile === null) {
    profile = {
      id: 1,
      user_id: 1,
      first_name: null,
      last_name: null,
      profession: null,
      specialization: null,
      years_of_experience: null,
      date_of_birth: null,
      availability_status: null,
      matching_preferences: null,
      terms_consent_at: null,
      cndp_consent_at: null,
      presentation_video_path: null,
      video_url: null,
      submitted_at: null,
      verified_at: null,
      admin_notes: null,
      updated_at: new Date().toISOString(),
      educations: [],
      languages: [],
      completeness: emptyCompleteness(),
    };
  }
  return profile;
}

/** Recalcule la complétude localement — même logique que ProfileCompleteness côté back. */
function recomputeCompleteness(): void {
  const p = state();
  const flags = {
    personal: Boolean(p.first_name && p.last_name && p.date_of_birth),
    education: educations.length > 0,
    languages: languages.some((l) => l.cefr_level !== null),
    availability: Boolean(p.availability_status),
    consents: Boolean(p.terms_consent_at && p.cndp_consent_at),
    video: Boolean(p.presentation_video_path),
    cv: false,
    certificates: languages.some((l) => l.certificate_document_id !== null),
  };

  const required = ['personal', 'education', 'languages', 'availability', 'consents'] as const;
  const all = [...required, 'video', 'cv', 'certificates'] as const;
  const missing = required.filter((k) => !flags[k]);
  const completed = all.filter((k) => flags[k]).length;

  p.completeness = {
    sections: all.map((key) => ({ key, complete: flags[key], required: (required as readonly string[]).includes(key) })),
    completed,
    total: all.length,
    percent: Math.round((completed / all.length) * 100),
    missing_required: missing,
    can_submit: missing.length === 0,
    submitted_at: p.submitted_at,
  };
}

const mockCandidateProfile: CandidateProfileRepository = {
  get: () => {
    recomputeCompleteness();
    return fakeLatency({ ...state(), educations: [...educations], languages: [...languages] });
  },

  update: (data) => {
    const p = state();
    if (data.first_name !== undefined) p.first_name = data.first_name;
    if (data.last_name !== undefined) p.last_name = data.last_name;
    if (data.profession !== undefined) p.profession = data.profession;
    if (data.specialization !== undefined) p.specialization = data.specialization;
    if (data.years_of_experience !== undefined) p.years_of_experience = data.years_of_experience;
    if (data.date_of_birth !== undefined) p.date_of_birth = data.date_of_birth;
    if (data.availability_status !== undefined) p.availability_status = data.availability_status;
    if (data.matching_preferences !== undefined) p.matching_preferences = data.matching_preferences;
    if (data.terms_accepted !== undefined) p.terms_consent_at = data.terms_accepted ? new Date().toISOString() : null;
    if (data.cndp_accepted !== undefined) p.cndp_consent_at = data.cndp_accepted ? new Date().toISOString() : null;
    p.updated_at = new Date().toISOString();
    recomputeCompleteness();
    return fakeLatency({ ...p, educations: [...educations], languages: [...languages] });
  },

  uploadVideo: (file) => {
    const p = state();
    p.presentation_video_path = `videos/${file.name}`;
    p.video_url = URL.createObjectURL(file);
    recomputeCompleteness();
    return fakeLatency({ ...p, educations: [...educations], languages: [...languages] }, 700);
  },

  preview: () => {
    const p = state();
    return fakeLatency({
      visible_to_recruiters: Boolean(p.terms_consent_at && p.cndp_consent_at),
      profile: { ...p, educations: [...educations], languages: [...languages] },
    });
  },

  submit: () => {
    const p = state();
    p.submitted_at = new Date().toISOString();
    recomputeCompleteness();
    return fakeLatency({ ...p, educations: [...educations], languages: [...languages] });
  },

  listEducations: () => fakeLatency([...educations]),

  createEducation: (data) => {
    const entry: EducationEntry = {
      id: nextEducationId++,
      level: data.level,
      field: data.field ?? null,
      institution: data.institution ?? null,
      started_at: data.started_at ?? null,
      ended_at: data.ended_at ?? null,
    };
    educations = [entry, ...educations];
    recomputeCompleteness();
    return fakeLatency({ ...entry });
  },

  updateEducation: (id, data) => {
    educations = educations.map((e) => (e.id === id ? { ...e, ...data } : e));
    const updated = educations.find((e) => e.id === id)!;
    return fakeLatency({ ...updated });
  },

  deleteEducation: (id) => {
    educations = educations.filter((e) => e.id !== id);
    recomputeCompleteness();
    return fakeLatency(undefined);
  },

  listLanguages: () => fakeLatency([...languages]),

  upsertLanguage: (language, cefrLevel) => {
    const existing = languages.find((l) => l.language === language);
    const updated: CandidateLanguageEntry = existing
      ? { ...existing, cefr_level: cefrLevel, self_declared_cefr: cefrLevel }
      : {
          id: languages.length + 1,
          language,
          cefr_level: cefrLevel,
          self_declared_cefr: cefrLevel,
          ai_cefr: null,
          source: 'self_declared',
          level_discrepancy: false,
          certificate_document_id: null,
          certificate_document: null,
        };
    languages = [...languages.filter((l) => l.language !== language), updated];
    recomputeCompleteness();
    return fakeLatency({ ...updated });
  },

  attachCertificateFile: (language, file, cefrLevel) => {
    const existing = languages.find((l) => l.language === language);
    const documentId = Math.floor(Math.random() * 100000);
    const updated: CandidateLanguageEntry = {
      id: existing?.id ?? languages.length + 1,
      language,
      cefr_level: cefrLevel ?? existing?.cefr_level ?? null,
      self_declared_cefr: cefrLevel ?? existing?.self_declared_cefr ?? null,
      ai_cefr: existing?.ai_cefr ?? null,
      source: 'certified',
      level_discrepancy: false,
      certificate_document_id: documentId,
      certificate_document: { id: documentId, type: 'certificate', url: URL.createObjectURL(file) },
    };
    languages = [...languages.filter((l) => l.language !== language), updated];
    recomputeCompleteness();
    return fakeLatency({ ...updated }, 700);
  },

  attachCertificateDocument: (language, documentId, cefrLevel) => {
    const existing = languages.find((l) => l.language === language);
    const updated: CandidateLanguageEntry = {
      id: existing?.id ?? languages.length + 1,
      language,
      cefr_level: cefrLevel ?? existing?.cefr_level ?? null,
      self_declared_cefr: cefrLevel ?? existing?.self_declared_cefr ?? null,
      ai_cefr: existing?.ai_cefr ?? null,
      source: 'certified',
      level_discrepancy: false,
      certificate_document_id: documentId,
      certificate_document: { id: documentId, type: 'certificate', url: null },
    };
    languages = [...languages.filter((l) => l.language !== language), updated];
    recomputeCompleteness();
    return fakeLatency({ ...updated });
  },

  detachCertificate: (language) => {
    const existing = languages.find((l) => l.language === language);
    if (!existing) return fakeLatency({} as CandidateLanguageEntry);
    const updated: CandidateLanguageEntry = {
      ...existing,
      source: 'self_declared',
      certificate_document_id: null,
      certificate_document: null,
    };
    languages = [...languages.filter((l) => l.language !== language), updated];
    recomputeCompleteness();
    return fakeLatency({ ...updated });
  },
};

export const candidateProfileRepository: CandidateProfileRepository =
  process.env.NEXT_PUBLIC_USE_MOCKS === '1' ? mockCandidateProfile : httpCandidateProfile;
