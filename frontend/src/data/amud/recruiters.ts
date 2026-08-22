/**
 * Entité Recruteur — jusqu'ici seulement une valeur du champ générique
 * `Utilisateur.role`, sans fiche ni CRUD propre (la sidebar admin avait déjà
 * un `InertNavItem` "Recruteurs" en attente). Chaque recruteur est rattaché
 * à une entreprise existante (`entrepriseId`, FK vers `entreprises.ts`),
 * pour que `/amud/admin/recruteurs` et la fiche entreprise se répondent.
 */
export type StatutRecruteur = 'Actif' | 'Inactif' | 'Bloqué';
/** Rôle au sein de l'espace entreprise (`/amud/entreprise/equipe`) — optionnel pour ne pas casser les recruteurs seedés avant cette extension. */
export type RecruiterRole = 'ADMIN_ENTREPRISE' | 'RECRUTEUR' | 'ASSISTANT_RECRUTEUR';

export type Recruiter = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  poste: string;
  entrepriseId: string;
  entrepriseNom: string;
  ville: string;
  statut: StatutRecruteur;
  verifie: boolean;
  creeLe: string;
  dernierAcces: string;
  role?: RecruiterRole;
};

export const STATUT_CLASS: Record<StatutRecruteur, string> = {
  Actif: 'bg-amud-primary-container text-amud-on-primary-container',
  Inactif: 'bg-amud-surface-container-high text-amud-on-surface-variant',
  Bloqué: 'bg-amud-error-container text-amud-on-error-container',
};

export const ROLE_LABEL: Record<RecruiterRole, string> = {
  ADMIN_ENTREPRISE: 'Administrateur entreprise',
  RECRUTEUR: 'Recruteur',
  ASSISTANT_RECRUTEUR: 'Assistant recruteur',
};

export const ROLE_CLASS: Record<RecruiterRole, string> = {
  ADMIN_ENTREPRISE: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant',
  RECRUTEUR: 'bg-amud-primary-fixed text-amud-on-primary-fixed-variant',
  ASSISTANT_RECRUTEUR: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
};

export const recruitersSeed: Recruiter[] = [
  { id: 'recruiter_techcorp1', nom: 'Fatima Zahra', email: 'f.zahra@techcorp-sa.com', telephone: '+212 6 61 22 33 44', poste: 'Responsable RH', entrepriseId: '1', entrepriseNom: 'TechCorp SA', ville: 'Casablanca', statut: 'Actif', verifie: true, creeLe: '03/02/2022', dernierAcces: "Aujourd'hui", role: 'ADMIN_ENTREPRISE' },
  { id: 'recruiter_techcorp2', nom: 'Marc Dubois', email: 'm.dubois@techcorp-sa.com', telephone: '+212 6 61 22 33 45', poste: 'Talent Acquisition Manager', entrepriseId: '1', entrepriseNom: 'TechCorp SA', ville: 'Casablanca', statut: 'Actif', verifie: true, creeLe: '14/03/2022', dernierAcces: "Aujourd'hui", role: 'RECRUTEUR' },
  { id: 'recruiter_techcorp3', nom: 'Salma Idrissi', email: 's.idrissi@techcorp-sa.com', telephone: '+212 6 61 22 33 46', poste: 'Recruteuse Tech', entrepriseId: '1', entrepriseNom: 'TechCorp SA', ville: 'Casablanca', statut: 'Actif', verifie: true, creeLe: '02/06/2023', dernierAcces: 'Hier', role: 'RECRUTEUR' },
  { id: 'recruiter_techcorp4', nom: 'Ayoub Naciri', email: 'a.naciri@techcorp-sa.com', telephone: '+212 6 61 22 33 47', poste: 'Assistant recrutement', entrepriseId: '1', entrepriseNom: 'TechCorp SA', ville: 'Casablanca', statut: 'Actif', verifie: false, creeLe: '20/01/2026', dernierAcces: 'Il y a 3h', role: 'ASSISTANT_RECRUTEUR' },
  { id: 'recruiter_buildit1', nom: 'Hans Müller', email: 'h.muller@buildit-construction.de', telephone: '+49 176 22 33 44', poste: 'Directeur des opérations', entrepriseId: '2', entrepriseNom: 'BuildIt Construction', ville: 'Berlin', statut: 'Actif', verifie: true, creeLe: '18/06/2022', dernierAcces: 'Hier', role: 'ADMIN_ENTREPRISE' },
  { id: 'recruiter_medicare1', nom: 'Isabelle Roche', email: 'i.roche@medicare-group.fr', telephone: '+33 6 12 22 33 44', poste: 'DRH', entrepriseId: '3', entrepriseNom: 'MediCare Group', ville: 'Lyon', statut: 'Inactif', verifie: false, creeLe: '25/11/2022', dernierAcces: 'Il y a 2 semaines', role: 'ADMIN_ENTREPRISE' },
  { id: 'recruiter_innovate1', nom: 'Karim Bennani', email: 'k.bennani@innovate-sa.com', telephone: '+212 6 62 33 44 55', poste: 'DRH', entrepriseId: '5', entrepriseNom: 'Innovate SA', ville: 'Casablanca', statut: 'Actif', verifie: true, creeLe: '02/09/2022', dernierAcces: "Aujourd'hui", role: 'ADMIN_ENTREPRISE' },
  { id: 'recruiter_logistics1', nom: 'Younes Idrissi', email: 'y.idrissi@logistics-pro.ma', telephone: '+212 6 63 44 55 66', poste: 'Responsable logistique', entrepriseId: '6', entrepriseNom: 'Logistics Pro', ville: 'Marrakech', statut: 'Bloqué', verifie: false, creeLe: '10/04/2023', dernierAcces: 'Il y a 1 mois', role: 'ADMIN_ENTREPRISE' },
];
