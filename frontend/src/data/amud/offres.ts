/**
 * Jeu de données factice des offres (`/amud/admin/offres`), extrait de la
 * page pour être réutilisable par la recherche globale du header.
 */
export type Statut = 'Brouillon' | 'En attente' | 'Publiée' | 'Expirée' | 'Refusée';

export type Offre = {
  id: string;
  titre: string;
  entreprise: string;
  recruteur: string;
  ville: string;
  contrat: string;
  candidatures: number | null;
  publication: string;
  statut: Statut;
};

export const offresSeed: Offre[] = [
  { id: '1', titre: 'Infirmier en soins intensifs', entreprise: 'Klinikum Berlin', recruteur: 'Sophie Martin', ville: 'Berlin, DE', contrat: 'CDI', candidatures: null, publication: 'En attente', statut: 'En attente' },
  { id: '2', titre: 'Développeur Fullstack React/Node', entreprise: 'TechCorp SA', recruteur: 'Marc Dubois', ville: 'Paris, FR', contrat: 'CDI', candidatures: 18, publication: '12/10/2023', statut: 'Publiée' },
  { id: '3', titre: 'Chef de Chantier', entreprise: 'BuildIt Construction', recruteur: 'Alice Lemoine', ville: 'Lyon, FR', contrat: 'CDD', candidatures: null, publication: '-', statut: 'Brouillon' },
  { id: '4', titre: 'Data Scientist', entreprise: 'Innovate SA', recruteur: 'Karim Bennani', ville: 'Casablanca, MA', contrat: 'CDI', candidatures: 32, publication: '08/10/2023', statut: 'Publiée' },
  { id: '5', titre: 'Ingénieur Cloud Senior', entreprise: 'TechCorp SA', recruteur: 'Marc Dubois', ville: 'Casablanca, MA', contrat: 'CDI', candidatures: 9, publication: '20/09/2023', statut: 'Expirée' },
  { id: '6', titre: 'UX Designer', entreprise: 'Design Studio', recruteur: 'Alice Lemoine', ville: 'Lyon, FR', contrat: 'CDI', candidatures: null, publication: '-', statut: 'Refusée' },
];

export const STATUT_CLASS: Record<Statut, string> = {
  'En attente': 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  Publiée: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  Brouillon: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  Expirée: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  Refusée: 'bg-amud-error-container text-amud-on-error-container',
};
