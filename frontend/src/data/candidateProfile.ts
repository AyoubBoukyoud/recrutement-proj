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
} from "@/lib/candidateProfile";
import { fakeLatency } from "./config";
import { readStorage, writeStorage, STORAGE_KEYS } from "@/lib/storage";

export interface CandidateProfileRepository {
  get(token: string): Promise<CandidateProfileData>;
  update(
    data: UpdateProfileInput,
    token: string,
  ): Promise<CandidateProfileData>;
  uploadVideo(file: File, token: string): Promise<CandidateProfileData>;
  preview(token: string): Promise<ProfilePreview>;
  submit(token: string): Promise<CandidateProfileData>;
  listEducations(token: string): Promise<EducationEntry[]>;
  createEducation(data: EducationInput, token: string): Promise<EducationEntry>;
  updateEducation(
    id: number,
    data: Partial<EducationInput>,
    token: string,
  ): Promise<EducationEntry>;
  deleteEducation(id: number, token: string): Promise<void>;
  listLanguages(token: string): Promise<CandidateLanguageEntry[]>;
  upsertLanguage(
    language: LanguageCode,
    cefrLevel: CefrLevel | null,
    token: string,
  ): Promise<CandidateLanguageEntry>;
  attachCertificateFile(
    language: LanguageCode,
    file: File,
    cefrLevel: CefrLevel | undefined,
    token: string,
  ): Promise<CandidateLanguageEntry>;
  attachCertificateDocument(
    language: LanguageCode,
    documentId: number,
    cefrLevel: CefrLevel | undefined,
    token: string,
  ): Promise<CandidateLanguageEntry>;
  detachCertificate(
    language: LanguageCode,
    token: string,
  ): Promise<CandidateLanguageEntry>;
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
 * Maquette — prototype localStorage. L'état est persisté (et non plus
 * remis à zéro au rechargement) pour servir de prototype réel : voir
 * implementation_plan.md. Le candidat de démonstration (Youssef Amrani)
 * correspond au compte id 101 de `data/fixtures/auth.ts`, celui qu'ouvre
 * aussi bien /auth-phone que le contournement de AuthContext/middleware.
 * ------------------------------------------------------------------ */

function emptyCompleteness(): CandidateProfileData["completeness"] {
  return {
    sections: [
      { key: "personal", complete: false, required: true },
      { key: "education", complete: false, required: true },
      { key: "languages", complete: false, required: true },
      { key: "availability", complete: false, required: true },
      { key: "consents", complete: false, required: true },
      { key: "video", complete: false, required: false },
      { key: "cv", complete: false, required: false },
      { key: "certificates", complete: false, required: false },
    ],
    completed: 0,
    total: 8,
    percent: 0,
    missing_required: [
      "personal",
      "education",
      "languages",
      "availability",
      "consents",
    ],
    can_submit: false,
    submitted_at: null,
  };
}

function demoProfile(): CandidateProfileData {
  return {
    id: 1,
    user_id: 101,
    first_name: "Youssef",
    last_name: "Amrani",
    profession: "Développeur Full-Stack",
    specialization: "React / Laravel",
    years_of_experience: 4,
    date_of_birth: "1996-03-18",
    availability_status: "within_1_month",
    matching_preferences: null,
    terms_consent_at: new Date().toISOString(),
    cndp_consent_at: new Date().toISOString(),
    presentation_video_path: null,
    video_url: null,
    submitted_at: null,
    verified_at: null,
    admin_notes: null,
    // Renseignés par le quiz métier (`/quiz-metier`) via
    // `candidateProfileRepository.update` : `null` tant qu'il n'a pas été passé.
    orientation_result: null,
    orientation_score: null,
    updated_at: new Date().toISOString(),
    educations: [],
    languages: [],
    skills: [],
    completeness: emptyCompleteness(),
  };
}

function demoEducations(): EducationEntry[] {
  return [
    {
      id: 1,
      level: "master",
      field: "Génie logiciel",
      institution: "ENSIAS, Rabat",
      started_at: "2017-09",
      ended_at: "2019-07",
    },
  ];
}

function demoLanguages(): CandidateLanguageEntry[] {
  return [
    {
      id: 1,
      language: "ar",
      cefr_level: "C2",
      self_declared_cefr: "C2",
      ai_cefr: null,
      source: "self_declared",
      level_discrepancy: false,
      certificate_document_id: null,
      certificate_document: null,
    },
    {
      id: 2,
      language: "fr",
      cefr_level: "C1",
      self_declared_cefr: "C1",
      ai_cefr: null,
      source: "self_declared",
      level_discrepancy: false,
      certificate_document_id: null,
      certificate_document: null,
    },
    {
      id: 3,
      language: "de",
      cefr_level: "B1",
      self_declared_cefr: "B1",
      ai_cefr: null,
      source: "self_declared",
      level_discrepancy: false,
      certificate_document_id: null,
      certificate_document: null,
    },
  ];
}

interface PersistedState {
  profile: CandidateProfileData;
  educations: EducationEntry[];
  languages: CandidateLanguageEntry[];
  nextEducationId: number;
}

let cache: PersistedState | null = null;

function load(): PersistedState {
  if (cache === null) {
    cache = readStorage<PersistedState | null>(
      STORAGE_KEYS.candidateProfileV2,
      null,
    ) ?? {
      profile: demoProfile(),
      educations: demoEducations(),
      languages: demoLanguages(),
      nextEducationId: 2,
    };
  }
  return cache;
}

function save(): void {
  if (cache) writeStorage(STORAGE_KEYS.candidateProfileV2, cache);
}

function state(): CandidateProfileData {
  return load().profile;
}

/**
 * Pont entre `data/languageAssessment` et ce module : un test de langue
 * réussi met à jour le niveau allemand ici, comme le ferait le back après
 * un `LanguageAssessment` complété. Pas d'export dans `CandidateProfileRepository`
 * — c'est un détail d'intégration entre deux maquettes, pas un appel d'écran.
 */
export function applyLanguageAssessmentResult(
  language: LanguageCode,
  cefrLevel: CefrLevel,
): void {
  const s = load();
  const existing = s.languages.find((l) => l.language === language);
  const updated: CandidateLanguageEntry = existing
    ? {
        ...existing,
        ai_cefr: cefrLevel,
        cefr_level: cefrLevel,
        source: "ai_assessed",
      }
    : {
        id: s.languages.length + 1,
        language,
        cefr_level: cefrLevel,
        self_declared_cefr: null,
        ai_cefr: cefrLevel,
        source: "ai_assessed",
        level_discrepancy: false,
        certificate_document_id: null,
        certificate_document: null,
      };
  s.languages = [
    ...s.languages.filter((l) => l.language !== language),
    updated,
  ];
  recomputeCompleteness();
  save();
}

/** Recalcule la complétude localement — même logique que ProfileCompleteness côté back. */
function recomputeCompleteness(): void {
  const s = load();
  const p = s.profile;
  const flags = {
    personal: Boolean(p.first_name && p.last_name && p.date_of_birth),
    education: s.educations.length > 0,
    languages: s.languages.some((l) => l.cefr_level !== null),
    availability: Boolean(p.availability_status),
    consents: Boolean(p.terms_consent_at && p.cndp_consent_at),
    video: Boolean(p.presentation_video_path),
    cv: false,
    certificates: s.languages.some((l) => l.certificate_document_id !== null),
  };

  const required = [
    "personal",
    "education",
    "languages",
    "availability",
    "consents",
  ] as const;
  const all = [...required, "video", "cv", "certificates"] as const;
  const missing = required.filter((k) => !flags[k]);
  const completed = all.filter((k) => flags[k]).length;

  p.completeness = {
    sections: all.map((key) => ({
      key,
      complete: flags[key],
      required: (required as readonly string[]).includes(key),
    })),
    completed,
    total: all.length,
    percent: Math.round((completed / all.length) * 100),
    missing_required: missing,
    can_submit: missing.length === 0,
    submitted_at: p.submitted_at,
  };
}

function snapshot(): CandidateProfileData {
  const s = load();
  return {
    ...s.profile,
    educations: [...s.educations],
    languages: [...s.languages],
  };
}

const mockCandidateProfile: CandidateProfileRepository = {
  get: () => {
    recomputeCompleteness();
    return fakeLatency(snapshot());
  },

  update: (data) => {
    const p = state();
    if (data.first_name !== undefined) p.first_name = data.first_name;
    if (data.last_name !== undefined) p.last_name = data.last_name;
    if (data.profession !== undefined) p.profession = data.profession;
    if (data.specialization !== undefined)
      p.specialization = data.specialization;
    if (data.years_of_experience !== undefined)
      p.years_of_experience = data.years_of_experience;
    if (data.date_of_birth !== undefined) p.date_of_birth = data.date_of_birth;
    if (data.availability_status !== undefined)
      p.availability_status = data.availability_status;
    if (data.matching_preferences !== undefined)
      p.matching_preferences = data.matching_preferences;
    if (data.terms_accepted !== undefined)
      p.terms_consent_at = data.terms_accepted
        ? new Date().toISOString()
        : null;
    if (data.cndp_accepted !== undefined)
      p.cndp_consent_at = data.cndp_accepted ? new Date().toISOString() : null;
    p.updated_at = new Date().toISOString();
    recomputeCompleteness();
    save();
    return fakeLatency(snapshot());
  },

  uploadVideo: (file) => {
    const p = state();
    p.presentation_video_path = `videos/${file.name}`;
    p.video_url = URL.createObjectURL(file);
    recomputeCompleteness();
    save();
    return fakeLatency(snapshot(), 700);
  },

  preview: () => {
    const p = state();
    return fakeLatency({
      visible_to_recruiters: Boolean(p.terms_consent_at && p.cndp_consent_at),
      profile: { ...snapshot() },
    });
  },

  submit: () => {
    const p = state();
    p.submitted_at = new Date().toISOString();
    recomputeCompleteness();
    save();
    return fakeLatency(snapshot());
  },

  listEducations: () => fakeLatency([...load().educations]),

  createEducation: (data) => {
    const s = load();
    const entry: EducationEntry = {
      id: s.nextEducationId++,
      level: data.level,
      field: data.field ?? null,
      institution: data.institution ?? null,
      started_at: data.started_at ?? null,
      ended_at: data.ended_at ?? null,
    };
    s.educations = [entry, ...s.educations];
    recomputeCompleteness();
    save();
    return fakeLatency({ ...entry });
  },

  updateEducation: (id, data) => {
    const s = load();
    s.educations = s.educations.map((e) =>
      e.id === id ? { ...e, ...data } : e,
    );
    const updated = s.educations.find((e) => e.id === id)!;
    save();
    return fakeLatency({ ...updated });
  },

  deleteEducation: (id) => {
    const s = load();
    s.educations = s.educations.filter((e) => e.id !== id);
    recomputeCompleteness();
    save();
    return fakeLatency(undefined);
  },

  listLanguages: () => fakeLatency([...load().languages]),

  upsertLanguage: (language, cefrLevel) => {
    const s = load();
    const existing = s.languages.find((l) => l.language === language);
    const updated: CandidateLanguageEntry = existing
      ? { ...existing, cefr_level: cefrLevel, self_declared_cefr: cefrLevel }
      : {
          id: s.languages.length + 1,
          language,
          cefr_level: cefrLevel,
          self_declared_cefr: cefrLevel,
          ai_cefr: null,
          source: "self_declared",
          level_discrepancy: false,
          certificate_document_id: null,
          certificate_document: null,
        };
    s.languages = [
      ...s.languages.filter((l) => l.language !== language),
      updated,
    ];
    recomputeCompleteness();
    save();
    return fakeLatency({ ...updated });
  },

  attachCertificateFile: (language, file, cefrLevel) => {
    const s = load();
    const existing = s.languages.find((l) => l.language === language);
    const documentId = Math.floor(Math.random() * 100000);
    const updated: CandidateLanguageEntry = {
      id: existing?.id ?? s.languages.length + 1,
      language,
      cefr_level: cefrLevel ?? existing?.cefr_level ?? null,
      self_declared_cefr: cefrLevel ?? existing?.self_declared_cefr ?? null,
      ai_cefr: existing?.ai_cefr ?? null,
      source: "certified",
      level_discrepancy: false,
      certificate_document_id: documentId,
      certificate_document: {
        id: documentId,
        type: "certificate",
        url: URL.createObjectURL(file),
      },
    };
    s.languages = [
      ...s.languages.filter((l) => l.language !== language),
      updated,
    ];
    recomputeCompleteness();
    save();
    return fakeLatency({ ...updated }, 700);
  },

  attachCertificateDocument: (language, documentId, cefrLevel) => {
    const s = load();
    const existing = s.languages.find((l) => l.language === language);
    const updated: CandidateLanguageEntry = {
      id: existing?.id ?? s.languages.length + 1,
      language,
      cefr_level: cefrLevel ?? existing?.cefr_level ?? null,
      self_declared_cefr: cefrLevel ?? existing?.self_declared_cefr ?? null,
      ai_cefr: existing?.ai_cefr ?? null,
      source: "certified",
      level_discrepancy: false,
      certificate_document_id: documentId,
      certificate_document: { id: documentId, type: "certificate", url: null },
    };
    s.languages = [
      ...s.languages.filter((l) => l.language !== language),
      updated,
    ];
    recomputeCompleteness();
    save();
    return fakeLatency({ ...updated });
  },

  detachCertificate: (language) => {
    const s = load();
    const existing = s.languages.find((l) => l.language === language);
    if (!existing) return fakeLatency({} as CandidateLanguageEntry);
    const updated: CandidateLanguageEntry = {
      ...existing,
      source: "self_declared",
      certificate_document_id: null,
      certificate_document: null,
    };
    s.languages = [
      ...s.languages.filter((l) => l.language !== language),
      updated,
    ];
    recomputeCompleteness();
    save();
    return fakeLatency({ ...updated });
  },
};

export const candidateProfileRepository: CandidateProfileRepository =
  process.env.NEXT_PUBLIC_USE_MOCKS === "1"
    ? mockCandidateProfile
    : httpCandidateProfile;
