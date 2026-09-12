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
  capaciteMax: number;
  dateDebut: string;
  dateFin: string;
  statut: GroupStatus;
};

export type EnrollmentStatus = 'ACTIF' | 'TERMINE' | 'ABANDONNE';

/**
 * Rattachement étudiant ↔ groupe comme entité de première classe (cahier
 * des charges §17, clé `amud_enrollments`) — remplace le champ
 * `CenterGroup.studentIds` qui dupliquait cette relation dans la ligne du
 * groupe. Un étudiant peut avoir plusieurs inscriptions dans le temps
 * (`TERMINE`/`ABANDONNE` puis réinscription), donc pas de contrainte
 * d'unicité forte au-delà de "un étudiant n'est ACTIF que dans une seule
 * ligne par groupe" (appliquée par `enrollStudent`, pas par le stockage).
 */
export type CenterEnrollment = {
  id: string;
  centerId: string;
  groupId: string;
  studentId: string;
  enrolledAt: string;
  statut: EnrollmentStatus;
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
  // --- Champs Smart Attendance QR (cahier des charges §11-17) ---
  /** 'QR' quand la ligne vient d'un scan (check-in/check-out), absent/'MANUAL' pour une saisie enseignant/centre classique. */
  source?: 'MANUAL' | 'QR';
  checkInTime?: string; // ISO — horodatage du scan QR_CHECK_IN
  checkOutTime?: string; // ISO — horodatage du scan QR_CHECK_OUT
  durationMinutes?: number; // calculé à partir de checkInTime/checkOutTime
  correctedBy?: string; // utilisateur ayant appliqué une correction manuelle
  correctedAt?: string; // ISO
};

export type SessionQrStatus = 'NOT_STARTED' | 'CHECKIN_OPEN' | 'IN_PROGRESS' | 'CHECKOUT_OPEN' | 'ENDED';

/**
 * État éphémère d'exécution QR d'un cours (clé `amud_center_session_states`,
 * cahier des charges §11-17) — sidecar 1:1 par `scheduleId`, PAS un doublon
 * de `CenterSchedule` : le créneau (groupe/enseignant/salle/date/heure) reste
 * entièrement porté par `CenterSchedule`, cette entité ne garde que ce qui
 * change pendant le déroulement réel de la séance (jetons QR, horodatages).
 */
export type CenterSessionState = {
  id: string;
  centerId: string;
  scheduleId: string;
  status: SessionQrStatus;
  checkInToken?: string; // régénéré à chaque (ré)ouverture du QR d'entrée
  checkOutToken?: string; // régénéré à l'ouverture du QR de sortie
  startedAt?: string;
  checkOutOpenedAt?: string;
  endedAt?: string;
  startedBy: string; // teacherId
};

/** Contenu encodé dans les QR codes d'entrée/sortie/rejoindre-quiz — décodé côté scanner (`useQrScanner`). */
export type QrPayload =
  | { v: 1; type: 'CHECK_IN' | 'CHECK_OUT'; centerId: string; scheduleId: string; groupId: string; teacherId: string; sessionStateId: string; token: string; issuedAt: string }
  | { v: 1; type: 'QUIZ_JOIN'; centerId: string; quizSessionId: string; quizId: string; groupId: string; teacherId: string; token: string; issuedAt: string };

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

export type TeacherPaymentStatus = 'PAYE' | 'EN_ATTENTE';
export const TEACHER_PAYMENT_STATUS_LABELS: Record<TeacherPaymentStatus, string> = {
  PAYE: 'Payé',
  EN_ATTENTE: 'En attente',
};
export const TEACHER_PAYMENT_STATUS_CLASS: Record<TeacherPaymentStatus, string> = {
  PAYE: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  EN_ATTENTE: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant border-amud-tertiary-fixed-dim',
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
  statut: TeacherPaymentStatus;
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

/**
 * Un membre de l'équipe d'un centre, avec son rôle dans la matrice de
 * permissions (`centerPermissions.ts`) — remplace la simple simulation
 * "je suis connecté en tant que <rôle>" par un vrai répertoire d'équipe que
 * `CENTER_OWNER`/`CENTER_ADMIN` gère depuis `/amud/centre/parametres`
 * (cahier des charges : clé `amud_center_users`).
 */
export type CenterUser = {
  id: string;
  centerId: string;
  nom: string;
  email: string;
  telephone?: string;
  role: CenterRole;
  actif: boolean;
  createdAt: string;
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

/**
 * Les 8 rôles du cahier des charges (§19) : les 6 `CenterRole` ci-dessus
 * (internes à *un* centre, simulés via le sélecteur `useCurrentCenter`) plus
 * `ADMIN`/`COMMERCIAL`, qui opèrent au niveau plateforme, sur potentiellement
 * tous les centres. Ces deux-là restent identifiés par l'espace où l'on se
 * trouve (`/amud/admin/*`, `/amud/commercial/*`) plutôt que par un
 * sélecteur — il n'existe qu'un seul Admin et qu'un seul Commercial "vous",
 * pas un choix parmi plusieurs — mais `canPerform`/`actionsFor` les
 * acceptent désormais au même titre que les autres, pour que les actions
 * Admin/Commercial sur les centres soient elles aussi vérifiées en fonction
 * (pas seulement en façade) plutôt que par convention de route seule.
 */
export type AppRole = CenterRole | 'ADMIN' | 'COMMERCIAL';

/** Les 13 événements métier typés du cahier des charges (§20) — un centre_activities distinct de l'audit log libre (`amud_audit_logs`) : feed léger pour tableau de bord / notifications, pas la trace de conformité. */
export type CenterActivityType =
  | 'CENTER_CREATED'
  | 'CENTER_UPDATED'
  | 'PARTNERSHIP_UPDATED'
  | 'STUDENT_CREATED'
  | 'TEACHER_CREATED'
  | 'FORMATION_CREATED'
  | 'GROUP_CREATED'
  | 'SCHEDULE_CREATED'
  | 'ATTENDANCE_RECORDED'
  | 'PAYMENT_RECEIVED'
  | 'WEBSITE_UPDATED'
  | 'THEME_CHANGED'
  | 'LEAD_CREATED'
  // --- Smart Attendance QR + Quick Quiz (cahier des charges §55) ---
  | 'SESSION_STARTED'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'SESSION_COMPLETED'
  | 'QUIZ_CREATED'
  | 'QUIZ_STARTED'
  | 'QUIZ_JOINED'
  | 'QUIZ_COMPLETED'
  | 'RESULT_RECORDED';

export type CenterActivity = {
  id: string;
  centerId: string;
  type: CenterActivityType;
  message: string;
  utilisateur: string;
  role: string;
  createdAt: string;
};

/**
 * Historique des heures d'enseignement comptées à chaque versement de
 * rémunération (clé `amud_teacher_hours`) — PAS la source du nombre
 * d'heures "actuel" (ça reste `computeTeacherHours()`, calculé en direct
 * depuis `amud_schedules` pour ne jamais coder les statistiques en dur,
 * cahier des charges §21). C'est un instantané horodaté : "à la date où ce
 * paiement a été enregistré, l'enseignant avait X heures à son crédit" —
 * utile pour l'historique/audit, sans dupliquer la vérité courante.
 */
export type CenterTeacherHoursRecord = {
  id: string;
  centerId: string;
  enseignantId: string;
  periode: string;
  heures: number;
  recordedAt: string;
};

/** Résultat / évaluation d'un étudiant (clé `amud_student_results`). */
export type StudentResult = {
  id: string;
  centerId: string;
  studentId: string;
  formationId: string;
  module: string;
  date: string;
  note: number; // 0-20
  noteMax: number;
  observation?: string;
};

/** Catégories de ressources pédagogiques disponibles pour les enseignants. */
export type ResourceCategory = 'PDF' | 'Document' | 'Lien' | 'Exercice' | 'Vidéo' | 'Support';
export const RESOURCE_CATEGORIES: ResourceCategory[] = ['PDF', 'Document', 'Lien', 'Exercice', 'Vidéo', 'Support'];

/** Ressource pédagogique partagée avec les enseignants (clé `amud_teacher_resources`). */
export type TeacherResource = {
  id: string;
  centerId: string;
  /** Si null, disponible pour tous les enseignants du centre. */
  teacherId?: string;
  titre: string;
  description?: string;
  categorie: ResourceCategory;
  /** URL ou chemin fictif (demo) */
  url?: string;
  createdAt: string;
};

