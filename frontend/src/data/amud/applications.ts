/**
 * Entité Candidature — pipeline complet à 6 statuts (cahier des charges
 * §16), remplaçant le modèle Kanban à 4 colonnes de `candidatures.ts`
 * (`nouvelle|preselection|entretien|shortlist`, sans état terminal). Les 4
 * premiers statuts restent affichables comme colonnes Kanban via
 * `colonneForStatus`/`statusesForColonne` — `ACCEPTED`/`REJECTED` sont des
 * actions qui sortent la carte du board plutôt que des colonnes de drop
 * (voir `admin/candidatures/page.tsx`, migré en phase 6).
 *
 * Les 5 premières entrées reprennent exactement les 5 cartes historiques de
 * `candidaturesSeed` (mêmes noms/postes) pour préserver la continuité
 * visuelle du Kanban existant.
 */
export type ApplicationStatus = 'NEW' | 'SCREENING' | 'INTERVIEW' | 'SHORTLIST' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type ColonneId = 'NEW' | 'SCREENING' | 'INTERVIEW' | 'SHORTLIST';

export type Application = {
  id: string;
  candidateId: string;
  candidateNom: string;
  offerId: string;
  offerTitre: string;
  entrepriseId: string;
  entrepriseNom: string;
  recruiterId?: string;
  recruiterNom?: string;
  tags: string[];
  score: number;
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
};

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  NEW: 'Nouvelle',
  SCREENING: 'Présélection',
  INTERVIEW: 'Entretien',
  SHORTLIST: 'Shortlist',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  WITHDRAWN: 'Retirée',
};

export const KANBAN_COLUMNS: { id: ColonneId; label: string; dot: string }[] = [
  { id: 'NEW', label: 'Nouvelle', dot: 'bg-amud-surface-tint' },
  { id: 'SCREENING', label: 'Présélection', dot: 'bg-amud-secondary-container' },
  { id: 'INTERVIEW', label: 'Entretien', dot: 'bg-amud-tertiary-fixed-dim' },
  { id: 'SHORTLIST', label: 'Shortlist', dot: 'bg-amud-primary-fixed-dim' },
];

const KANBAN_STATUSES: ColonneId[] = ['NEW', 'SCREENING', 'INTERVIEW', 'SHORTLIST'];

export function colonneForStatus(status: ApplicationStatus): ColonneId | null {
  return (KANBAN_STATUSES as string[]).includes(status) ? (status as ColonneId) : null;
}

export function statusesForColonne(colonne: ColonneId): ApplicationStatus {
  return colonne;
}

export function isDecided(status: ApplicationStatus): boolean {
  return status === 'ACCEPTED' || status === 'REJECTED' || status === 'WITHDRAWN';
}

export const applicationsSeed: Application[] = [
  { id: 'application_c1', candidateId: 'candidate_sophiem', candidateNom: 'Sophie Martin', offerId: '1', offerTitre: 'Infirmier en soins intensifs', entrepriseId: '4', entrepriseNom: 'Klinikum Berlin', recruiterId: undefined, tags: ['Soins Intensifs', 'Bloc Opératoire'], score: 95, createdAt: '2023-10-12T08:00:00.000Z', updatedAt: '2023-10-12T08:00:00.000Z', status: 'NEW' },
  { id: 'application_c2', candidateId: 'candidate_lucasm', candidateNom: 'Lucas Moreau', offerId: '3', offerTitre: 'Chef de Chantier', entrepriseId: '2', entrepriseNom: 'BuildIt Construction', tags: ['Haute Tension', 'Maintenance'], score: 82, createdAt: '2023-10-12T06:00:00.000Z', updatedAt: '2023-10-12T06:00:00.000Z', status: 'NEW' },
  { id: 'application_c3', candidateId: 'candidate_karimb', candidateNom: 'Karim Bennani', offerId: '3', offerTitre: 'Chef de Chantier', entrepriseId: '2', entrepriseNom: 'BuildIt Construction', tags: ['BTP', 'Management'], score: 98, createdAt: '2023-10-10T09:00:00.000Z', updatedAt: '2023-10-11T09:00:00.000Z', status: 'SCREENING' },
  { id: 'application_c4', candidateId: 'candidate_nadiam', candidateNom: 'Nadia Mansouri', offerId: '4', offerTitre: 'Data Scientist', entrepriseId: '5', entrepriseNom: 'Innovate SA', tags: ['Python', 'AWS'], score: 91, createdAt: '2023-10-09T09:00:00.000Z', updatedAt: '2023-10-19T09:00:00.000Z', status: 'INTERVIEW' },
  { id: 'application_c5', candidateId: 'candidate_youssefa', candidateNom: 'Youssef Amrani', offerId: '2', offerTitre: 'Développeur Fullstack React/Node', entrepriseId: '1', entrepriseNom: 'TechCorp SA', tags: ['Node.js', 'React'], score: 96, createdAt: '2023-10-05T09:00:00.000Z', updatedAt: '2023-10-19T09:00:00.000Z', status: 'SHORTLIST' },

  { id: 'application_6', candidateId: 'candidate_fatimaz', candidateNom: 'Fatima Ezzahra', offerId: '6', offerTitre: 'UX Designer', entrepriseId: '7', entrepriseNom: 'Design Studio', tags: ['Figma', 'Recherche utilisateur'], score: 88, createdAt: '2023-10-16T09:00:00.000Z', updatedAt: '2023-10-16T09:00:00.000Z', status: 'NEW' },
  { id: 'application_7', candidateId: 'candidate_omark', candidateNom: 'Omar Kadiri', offerId: '5', offerTitre: 'Ingénieur Cloud Senior', entrepriseId: '1', entrepriseNom: 'TechCorp SA', tags: ['AWS', 'Kubernetes'], score: 90, createdAt: '2023-10-18T09:00:00.000Z', updatedAt: '2023-10-20T09:00:00.000Z', status: 'SCREENING' },
  { id: 'application_8', candidateId: 'candidate_salmab', candidateNom: 'Salma Bouziane', offerId: '1', offerTitre: 'Infirmier en soins intensifs', entrepriseId: '4', entrepriseNom: 'Klinikum Berlin', tags: ['Urgences', 'Pédiatrie'], score: 79, createdAt: '2023-10-21T09:00:00.000Z', updatedAt: '2023-10-22T09:00:00.000Z', status: 'REJECTED' },
  { id: 'application_9', candidateId: 'candidate_yassineh', candidateNom: 'Yassine Haddad', offerId: '3', offerTitre: 'Chef de Chantier', entrepriseId: '2', entrepriseNom: 'BuildIt Construction', tags: ['BTP', 'Sécurité chantier'], score: 74, createdAt: '2023-10-23T09:00:00.000Z', updatedAt: '2023-10-24T09:00:00.000Z', status: 'INTERVIEW' },
  { id: 'application_10', candidateId: 'candidate_leilat', candidateNom: 'Leila Tazi', offerId: '6', offerTitre: 'UX Designer', entrepriseId: '7', entrepriseNom: 'Design Studio', tags: ['Design System', 'Prototypage'], score: 60, createdAt: '2023-10-25T09:00:00.000Z', updatedAt: '2023-10-27T09:00:00.000Z', status: 'REJECTED' },
  { id: 'application_11', candidateId: 'candidate_sophiem', candidateNom: 'Sophie Martin', offerId: '1', offerTitre: 'Infirmier en soins intensifs', entrepriseId: '4', entrepriseNom: 'Klinikum Berlin', tags: ['Soins Intensifs'], score: 93, createdAt: '2023-09-02T09:00:00.000Z', updatedAt: '2023-09-20T09:00:00.000Z', status: 'ACCEPTED' },
  { id: 'application_12', candidateId: 'candidate_youssefa', candidateNom: 'Youssef Amrani', offerId: '2', offerTitre: 'Développeur Fullstack React/Node', entrepriseId: '1', entrepriseNom: 'TechCorp SA', tags: ['Node.js'], score: 94, createdAt: '2023-08-15T09:00:00.000Z', updatedAt: '2023-09-01T09:00:00.000Z', status: 'ACCEPTED' },
  { id: 'application_13', candidateId: 'candidate_omark', candidateNom: 'Omar Kadiri', offerId: '5', offerTitre: 'Ingénieur Cloud Senior', entrepriseId: '1', entrepriseNom: 'TechCorp SA', tags: ['AWS'], score: 85, createdAt: '2023-10-01T09:00:00.000Z', updatedAt: '2023-10-15T09:00:00.000Z', status: 'SHORTLIST' },
  { id: 'application_14', candidateId: 'candidate_nadiam', candidateNom: 'Nadia Mansouri', offerId: '4', offerTitre: 'Data Scientist', entrepriseId: '5', entrepriseNom: 'Innovate SA', tags: ['Python'], score: 87, createdAt: '2023-10-03T09:00:00.000Z', updatedAt: '2023-10-04T09:00:00.000Z', status: 'NEW' },
  { id: 'application_15', candidateId: 'candidate_karimb', candidateNom: 'Karim Bennani', offerId: '3', offerTitre: 'Chef de Chantier', entrepriseId: '2', entrepriseNom: 'BuildIt Construction', tags: ['BTP'], score: 80, createdAt: '2023-09-10T09:00:00.000Z', updatedAt: '2023-09-25T09:00:00.000Z', status: 'REJECTED' },
  { id: 'application_16', candidateId: 'candidate_fatimaz', candidateNom: 'Fatima Ezzahra', offerId: '6', offerTitre: 'UX Designer', entrepriseId: '7', entrepriseNom: 'Design Studio', tags: ['Figma'], score: 76, createdAt: '2023-10-05T09:00:00.000Z', updatedAt: '2023-10-06T09:00:00.000Z', status: 'SCREENING' },
  { id: 'application_17', candidateId: 'candidate_lucasm', candidateNom: 'Lucas Moreau', offerId: '3', offerTitre: 'Chef de Chantier', entrepriseId: '2', entrepriseNom: 'BuildIt Construction', tags: ['Maintenance'], score: 70, createdAt: '2023-10-08T09:00:00.000Z', updatedAt: '2023-10-09T09:00:00.000Z', status: 'INTERVIEW' },
  { id: 'application_18', candidateId: 'candidate_salmab', candidateNom: 'Salma Bouziane', offerId: '1', offerTitre: 'Infirmier en soins intensifs', entrepriseId: '4', entrepriseNom: 'Klinikum Berlin', tags: ['Urgences'], score: 81, createdAt: '2023-10-11T09:00:00.000Z', updatedAt: '2023-10-12T09:00:00.000Z', status: 'NEW' },
  { id: 'application_19', candidateId: 'candidate_yassineh', candidateNom: 'Yassine Haddad', offerId: '3', offerTitre: 'Chef de Chantier', entrepriseId: '2', entrepriseNom: 'BuildIt Construction', tags: ['Sécurité chantier'], score: 68, createdAt: '2023-10-14T09:00:00.000Z', updatedAt: '2023-10-15T09:00:00.000Z', status: 'SHORTLIST' },
  { id: 'application_20', candidateId: 'candidate_leilat', candidateNom: 'Leila Tazi', offerId: '6', offerTitre: 'UX Designer', entrepriseId: '7', entrepriseNom: 'Design Studio', tags: ['Prototypage'], score: 65, createdAt: '2023-10-17T09:00:00.000Z', updatedAt: '2023-10-18T09:00:00.000Z', status: 'SCREENING' },
];

export function getApplicationsForEntreprise(entrepriseId: string, all: Application[] = applicationsSeed) {
  return all.filter((a) => a.entrepriseId === entrepriseId);
}

export function getApplicationsForCandidate(candidateId: string, all: Application[] = applicationsSeed) {
  return all.filter((a) => a.candidateId === candidateId);
}
