/**
 * Types du module "Centres de formation" (`/amud/admin/centres`,
 * `/amud/commercial/centres`, `/amud/centre/*`, site public `/amud/centres/:slug`).
 * Regroupés ici (plutôt qu'un fichier par entité comme `entreprises.ts`) car
 * `centerDemoFactory.ts` a besoin de tous les types en même temps pour
 * générer un jeu de données démo réellement croisé (mêmes ids réutilisés
 * entre étudiants/groupes/plannings/présences/paiements) — les fichiers
 * `data/amud/center*.ts` réexportent ensuite juste le type + le seed
 * correspondant pour garder les mêmes conventions d'import que le reste du
 * module (`import { centresSeed, type Centre } from '@/data/amud/centres'`).
 */

export type GermanLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export const GERMAN_LEVELS: GermanLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export type PartnershipStatus = 'PROSPECT' | 'CONTACTE' | 'NEGOCIATION' | 'ESSAI' | 'ACTIF' | 'SUSPENDU' | 'EXPIRE' | 'TERMINE';
export const PARTNERSHIP_STATUSES: PartnershipStatus[] = ['PROSPECT', 'CONTACTE', 'NEGOCIATION', 'ESSAI', 'ACTIF', 'SUSPENDU', 'EXPIRE', 'TERMINE'];
export const PARTNERSHIP_LABELS: Record<PartnershipStatus, string> = {
  PROSPECT: 'Prospect',
  CONTACTE: 'Contacté',
  NEGOCIATION: 'Négociation',
  ESSAI: 'Essai',
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  EXPIRE: 'Expiré',
  TERMINE: 'Terminé',
};
export const PARTNERSHIP_CLASS: Record<PartnershipStatus, string> = {
  PROSPECT: 'bg-amud-surface-container-high text-amud-on-surface-variant border-amud-outline-variant',
  CONTACTE: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant border-amud-tertiary-fixed-dim',
  NEGOCIATION: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant border-amud-tertiary-fixed-dim',
  ESSAI: 'bg-amud-secondary/10 text-amud-secondary border-amud-secondary/30',
  ACTIF: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  SUSPENDU: 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
  EXPIRE: 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
  TERMINE: 'bg-amud-surface-container-high text-amud-on-surface-variant border-amud-outline-variant',
};

export type CenterStatus = 'Actif' | 'Inactif' | 'En attente';

export type ThemeId = 'modern-education' | 'professional-academy' | 'german-excellence' | 'minimal-learning' | 'premium-training';
export const THEMES: { id: ThemeId; nom: string; description: string }[] = [
  { id: 'modern-education', nom: 'Modern Education', description: 'Cartes arrondies, dégradés doux, mise en avant des formations en grille.' },
  { id: 'professional-academy', nom: 'Professional Academy', description: 'Look institutionnel, sobre, orienté crédibilité et chiffres clés.' },
  { id: 'german-excellence', nom: 'German Excellence', description: 'Identité noir/rouge/or, typographie affirmée, esprit "précision allemande".' },
  { id: 'minimal-learning', nom: 'Minimal Learning', description: 'Beaucoup de blanc, typographie fine, une seule couleur d’accent.' },
  { id: 'premium-training', nom: 'Premium Training', description: 'Fond sombre, accents dorés, mise en scène haut de gamme.' },
];

export type CenterSocialLinks = { facebook?: string; instagram?: string; linkedin?: string; youtube?: string };
export type CenterHoraire = { jour: string; ouverture: string; fermeture: string; ferme?: boolean };

export type CenterTestimonial = { nom: string; role: string; texte: string; note: number };
export type CenterFaqItem = { question: string; reponse: string };

export type CenterSiteContent = {
  enabled: boolean;
  tagline: string;
  heroImage?: string;
  avantages: string[];
  temoignages: CenterTestimonial[];
  faq: CenterFaqItem[];
  ctaLabel: string;
};

export type Centre = {
  id: string;
  slug: string;
  nom: string;
  logo: string;
  coverImage?: string;
  description: string;
  telephone: string;
  email: string;
  siteWeb?: string;
  contactNom: string;
  contactTelephone: string;
  contactEmail: string;
  pays: string;
  ville: string;
  adresse: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  statut: CenterStatus;
  partnershipStatus: PartnershipStatus;
  partnershipDateDebut: string;
  partnershipDateFin?: string;
  assignedCommercialId: string;
  assignedCommercialNom: string;
  theme: ThemeId;
  socialLinks?: CenterSocialLinks;
  horaires: CenterHoraire[];
  site: CenterSiteContent;
  createdAt: string;
  updatedAt: string;
};

export type StudentStatus = 'Actif' | 'Inactif' | 'Diplômé' | 'Suspendu';
export const STUDENT_STATUSES: StudentStatus[] = ['Actif', 'Inactif', 'Diplômé', 'Suspendu'];

export type CenterStudent = {
  id: string;
  centerId: string;
  nom: string;
  prenom: string;
  photo?: string;
  telephone: string;
  email: string;
  ville: string;
  niveau: GermanLevel;
  niveauCible: GermanLevel;
  dateInscription: string;
  statut: StudentStatus;
  notes?: string;
};

export type ContractType = 'CDI' | 'CDD' | 'Freelance' | 'Vacataire';
export const CONTRACT_TYPES: ContractType[] = ['CDI', 'CDD', 'Freelance', 'Vacataire'];
export type TeacherStatus = 'Actif' | 'Inactif';

export type CenterTeacher = {
  id: string;
  centerId: string;
  nom: string;
  prenom: string;
  photo?: string;
  email: string;
  telephone: string;
  specialite: string;
  niveauxEnseignes: GermanLevel[];
  experienceAnnees: number;
  typeContrat: ContractType;
  tauxHoraire: number;
  statut: TeacherStatus;
  dateEntree: string;
};

export type FormationStatus = 'Active' | 'Planifiée' | 'Terminée' | 'Archivée';
export const FORMATION_STATUSES: FormationStatus[] = ['Active', 'Planifiée', 'Terminée', 'Archivée'];

export type CenterFormation = {
  id: string;
  centerId: string;
  nom: string;
  niveau: GermanLevel | 'Autres';
  description: string;
  dureeSemaines: number;
  nombreHeures: number;
  nombreSeances: number;
  prix: number;
  dateDebut: string;
  dateFin: string;
  statut: FormationStatus;
};

export type GroupStatus = 'Actif' | 'À venir' | 'Terminé' | 'Complet';
export const GROUP_STATUSES: GroupStatus[] = ['Actif', 'À venir', 'Terminé', 'Complet'];

export type CenterGroup = {
  id: string;
  centerId: string;
  nom: string;
  formationId: string;
  niveau: GermanLevel;
  enseignantId: string;
  salle: string;
  studentIds: string[];
  capaciteMax: number;
  dateDebut: string;
  dateFin: string;
  statut: GroupStatus;
};

export type CenterSchedule = {
  id: string;
  centerId: string;
  formationId: string;
  groupId: string;
  enseignantId: string;
  salle: string;
  date: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
};

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'RETARD' | 'EXCUSE';
export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  RETARD: 'Retard',
  EXCUSE: 'Excusé',
};
export const ATTENDANCE_CLASS: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  ABSENT: 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
  RETARD: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant border-amud-tertiary-fixed-dim',
  EXCUSE: 'bg-amud-surface-container-high text-amud-on-surface-variant border-amud-outline-variant',
};

export type CenterAttendanceRecord = {
  id: string;
  centerId: string;
  scheduleId: string;
  groupId: string;
  studentId: string;
  date: string;
  statut: AttendanceStatus;
};

export type PaymentMode = 'Espèces' | 'Virement' | 'Carte' | 'Chèque';
export const PAYMENT_MODES: PaymentMode[] = ['Espèces', 'Virement', 'Carte', 'Chèque'];
export type PaymentStatus = 'PAYE' | 'PARTIEL' | 'IMPAYE' | 'EN_RETARD';
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAYE: 'Payé',
  PARTIEL: 'Partiel',
  IMPAYE: 'Impayé',
  EN_RETARD: 'En retard',
};
export const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  PAYE: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  PARTIEL: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant border-amud-tertiary-fixed-dim',
  IMPAYE: 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
  EN_RETARD: 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
};

export type CenterStudentPayment = {
  id: string;
  centerId: string;
  studentId: string;
  formationId: string;
  prixTotal: number;
  montantPaye: number;
  date: string;
  mode: PaymentMode;
  reference?: string;
  note?: string;
  statut: PaymentStatus;
};

export type CenterTeacherPayment = {
  id: string;
  centerId: string;
  enseignantId: string;
  periode: string;
  nombreHeures: number;
  tauxHoraire: number;
  montant: number;
  date: string;
  statut: 'PAYE' | 'EN_ATTENTE';
};

export type CenterTarif = {
  id: string;
  centerId: string;
  formationId: string;
  niveau: GermanLevel | 'Autres';
  dureeSemaines: number;
  nombreHeures: number;
  prix: number;
  fraisInscription: number;
  mensualite?: number;
  reduction?: number;
  promotion?: string;
  dateValidite?: string;
};

export type LeadStatus = 'NOUVEAU' | 'CONTACTE' | 'INTERESSE' | 'INSCRIT' | 'REJETE';
export const LEAD_STATUSES: LeadStatus[] = ['NOUVEAU', 'CONTACTE', 'INTERESSE', 'INSCRIT', 'REJETE'];
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NOUVEAU: 'Nouveau',
  CONTACTE: 'Contacté',
  INTERESSE: 'Intéressé',
  INSCRIT: 'Inscrit',
  REJETE: 'Rejeté',
};

export type CenterLead = {
  id: string;
  centerId: string;
  nom: string;
  telephone: string;
  email: string;
  niveauSouhaite: GermanLevel | 'Non précisé';
  horairePrefere?: string;
  message?: string;
  statut: LeadStatus;
  createdAt: string;
};

export type ModificationRequestStatus = 'PENDING' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
export const MODIFICATION_REQUEST_LABELS: Record<ModificationRequestStatus, string> = {
  PENDING: 'En attente',
  REVIEWED: 'Examinée',
  APPROVED: 'Approuvée',
  REJECTED: 'Rejetée',
};

export type CenterModificationRequest = {
  id: string;
  centerId: string;
  centerNom: string;
  commercialId: string;
  commercialNom: string;
  message: string;
  date: string;
  statut: ModificationRequestStatus;
};

/** Rôles du workspace `/amud/centre/*` (cahier des charges §49-50) — un seul espace, le rôle change les permissions, pas l'UI. */
export type CenterRole = 'CENTER_OWNER' | 'CENTER_ADMIN' | 'COORDINATOR' | 'TEACHER' | 'ACCOUNTANT' | 'STUDENT';
export const CENTER_ROLES: CenterRole[] = ['CENTER_OWNER', 'CENTER_ADMIN', 'COORDINATOR', 'TEACHER', 'ACCOUNTANT', 'STUDENT'];
export const CENTER_ROLE_LABELS: Record<CenterRole, string> = {
  CENTER_OWNER: 'Propriétaire du centre',
  CENTER_ADMIN: 'Administrateur du centre',
  COORDINATOR: 'Coordinateur pédagogique',
  TEACHER: 'Enseignant',
  ACCOUNTANT: 'Comptable',
  STUDENT: 'Étudiant',
};
