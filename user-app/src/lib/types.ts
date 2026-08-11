// Types partagés de l'application Amud Skills

export type UserRole = 'candidate' | 'employer' | 'admin' | 'agent';

export type Language = 'fr' | 'ar' | 'en' | 'de';

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

export interface JobOffer {
  id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  status: 'entretien' | 'envoye' | 'nouveau';
}

export interface CandidateSummary {
  id: string;
  name: string;
  avatarInitials: string;
  role: string;
  sector: string;
  city: string;
  languageLevel: string;
  yearsExperience: number;
  status: 'nouveau' | 'contacte' | 'entretien' | 'valide';
  matchScore: number;
  mutualInterest: boolean;
}

export interface Message {
  id: string;
  authorId: string;
  authorRole: UserRole;
  text: string;
  sentAt: string;
}

export interface Conversation {
  id: string;
  candidateId: string;
  candidateName: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  messages: Message[];
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

export interface AdminUserEntry {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  status: 'actif' | 'suspendu' | 'en_attente';
  createdAt: string;
}

export interface ReferralEntry {
  id: string;
  sponsorName: string;
  refereeName: string;
  status: 'invite' | 'inscrit' | 'recrute';
  reward: string;
  createdAt: string;
}

export interface JobListing {
  id: string;
  role: string;
  company: string;
  sector: string;
  location: string;
  salaryRange: string;
  levelRequired: string;
  contractType: string;
  urgent?: boolean;
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
