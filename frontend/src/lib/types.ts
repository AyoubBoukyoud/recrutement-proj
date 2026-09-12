// Types partagés de l'application Amud Skills

export type UserRole = 'candidate' | 'employer' | 'admin' | 'agent';

export type Language = 'fr' | 'ar' | 'en' | 'de';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  phone?: string;
  email?: string;
  /** Rôles Spatie bruts renvoyés par l'API (ex. "Administrator", "Company") —
   *  conservés pour les écrans portés depuis web-admin, qui les affichent tels quels. */
  roles?: string[];
}

export type ProfileStep = 1 | 2 | 3 | 4 | 5;

export interface DocumentEntry {
  id: string;
  type: 'cv' | 'passeport' | 'diplome' | 'autre';
  name: string;
  uploadedAt: string;
  status: 'en_attente' | 'valide' | 'rejete';
}

export interface CEFRLevel {
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
}

export interface CandidateProfile {
  // Étape 1 — informations personnelles
  firstName: string;
  lastName: string;
  birthDate: string;
  city: string;
  // Étape 2 — secteur d'activité
  sector: string;
  jobTitle: string;
  yearsExperience: number;
  // Étape 3 — compétences linguistiques
  languages: CEFRLevel[];
  // Étape 4 — disponibilités
  desiredStartDate: string;
  noticePeriodWeeks: number;
  // Étape 5 — documents
  documents: DocumentEntry[];
  videoUrl: string | null;
  testLangueScore: number | null;
  identityVerified: boolean;
  // méta
  completedSteps: ProfileStep[];
  isComplete: boolean;
  avatarInitials: string;
}

export interface TimelineStep {
  id: string;
  label: string;
  description: string;
  status: 'termine' | 'en_cours' | 'a_venir';
  date: string | null;
}

export interface ReclamationEntry {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: 'ouverte' | 'en_cours' | 'resolue';
  createdAt: string;
  authorName: string;
  authorRole: UserRole;
}

export type SyncActionType =
  | 'upload_document'
  | 'submit_profile'
  | 'submit_reclamation'
  | 'submit_video'
  | 'submit_test_langue'
  | 'employer_message'
  | 'employer_interest';

export interface SyncAction {
  id: string;
  type: SyncActionType;
  payload: Record<string, unknown>;
  createdAt: string;
}
