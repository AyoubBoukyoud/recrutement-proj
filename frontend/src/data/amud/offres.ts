/**
 * Jeu de données factice des offres (`/amud/admin/offres`), extrait de la
 * page pour être réutilisable par la recherche globale du header.
 */
export type Statut = 'Brouillon' | 'En attente' | 'Publiée' | 'En pause' | 'Expirée' | 'Refusée' | 'Archivée';
export type NiveauEtudes = 'Aucun' | 'Bac' | 'Bac+2' | 'Bac+3' | 'Bac+5' | 'Doctorat';
export type NiveauExperience = 'Débutant' | '1-3 ans' | '3-5 ans' | '5-10 ans' | '10+ ans';
export type Visibilite = 'Publique' | 'Privée' | 'Sur invitation';
export type Teletravail = 'Présentiel' | 'Hybride' | 'Télétravail complet';

export type Offre = {
  id: string;
  titre: string;
  entreprise: string;
  /** FK vers `Entreprise.id` (`entreprises.ts`) — absente sur les offres du seed d'origine, qui ne liaient que par le nom affiché. */
  entrepriseId?: string;
  recruteur: string;
  ville: string;
  contrat: string;
  candidatures: number | null;
  publication: string;
  statut: Statut;
  /** Champs additionnels pour le formulaire de création complet de l'espace entreprise (`/amud/entreprise/offres/nouveau`) — optionnels pour ne pas casser les offres existantes du seed admin. */
  departement?: string;
  secteur?: string;
  localisation?: string;
  description?: string;
  responsabilites?: string[];
  missions?: string[];
  niveauEtudes?: NiveauEtudes;
  niveauExperience?: NiveauExperience;
  competences?: string[];
  langues?: string[];
  softSkills?: string[];
  salaireMin?: number;
  salaireMax?: number;
  avantages?: string[];
  teletravail?: Teletravail;
  horaires?: string;
  dateExpiration?: string;
  visibilite?: Visibilite;
  vues?: number;
};

export const offresSeed: Offre[] = [
  { id: '1', titre: 'Infirmier en soins intensifs', entreprise: 'Klinikum Berlin', entrepriseId: '4', recruteur: 'Sophie Martin', ville: 'Berlin, DE', contrat: 'CDI', candidatures: null, publication: 'En attente', statut: 'En attente' },
  { id: '2', titre: 'Développeur Fullstack React/Node', entreprise: 'TechCorp SA', entrepriseId: '1', recruteur: 'Marc Dubois', ville: 'Casablanca, MA', contrat: 'CDI', candidatures: 18, publication: '12/10/2023', statut: 'Publiée', departement: 'Ingénierie', secteur: 'IT', localisation: 'Casablanca, Maroc', description: "Nous recherchons un(e) développeur(se) Fullstack React/Node pour renforcer notre équipe produit et livrer des fonctionnalités à fort impact pour nos clients.", responsabilites: ['Concevoir et développer de nouvelles fonctionnalités front et back', 'Participer aux revues de code et à la définition de l’architecture', 'Assurer la qualité et la performance des applications livrées'], missions: ['Développement de l’application web principale', 'Mise en place de tests automatisés', 'Collaboration avec les équipes produit et design'], niveauEtudes: 'Bac+5', niveauExperience: '3-5 ans', competences: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'], langues: ['Français', 'Anglais'], softSkills: ['Autonomie', 'Esprit d’équipe', 'Communication'], salaireMin: 12000, salaireMax: 18000, avantages: ['Mutuelle', 'Tickets restaurant', 'Prime annuelle'], teletravail: 'Hybride', horaires: '9h-18h, du lundi au vendredi', dateExpiration: '2026-10-15', visibilite: 'Publique', vues: 342 },
  { id: '3', titre: 'Chef de Chantier', entreprise: 'BuildIt Construction', entrepriseId: '2', recruteur: 'Alice Lemoine', ville: 'Lyon, FR', contrat: 'CDD', candidatures: null, publication: '-', statut: 'Brouillon' },
  { id: '4', titre: 'Data Scientist', entreprise: 'Innovate SA', entrepriseId: '5', recruteur: 'Karim Bennani', ville: 'Casablanca, MA', contrat: 'CDI', candidatures: 32, publication: '08/10/2023', statut: 'Publiée' },
  { id: '5', titre: 'Ingénieur Cloud Senior', entreprise: 'TechCorp SA', entrepriseId: '1', recruteur: 'Marc Dubois', ville: 'Casablanca, MA', contrat: 'CDI', candidatures: 9, publication: '20/09/2023', statut: 'Expirée', departement: 'Infrastructure', secteur: 'IT', localisation: 'Casablanca, Maroc', description: 'Poste d’ingénieur cloud senior pour piloter la migration de nos services vers une architecture Kubernetes multi-région.', niveauEtudes: 'Bac+5', niveauExperience: '5-10 ans', competences: ['AWS', 'Kubernetes', 'Terraform'], langues: ['Français', 'Anglais'], salaireMin: 20000, salaireMax: 26000, teletravail: 'Télétravail complet', dateExpiration: '2023-09-20', visibilite: 'Publique', vues: 210 },
  { id: '6', titre: 'UX Designer', entreprise: 'Design Studio', entrepriseId: '7', recruteur: 'Alice Lemoine', ville: 'Lyon, FR', contrat: 'CDI', candidatures: null, publication: '-', statut: 'Refusée' },
  { id: '7', titre: 'Product Manager', entreprise: 'TechCorp SA', entrepriseId: '1', recruteur: 'Marc Dubois', ville: 'Casablanca, MA', contrat: 'CDI', candidatures: 6, publication: '01/10/2023', statut: 'En pause', departement: 'Produit', secteur: 'IT', localisation: 'Casablanca, Maroc', description: 'Product Manager pour porter la roadmap de notre plateforme de recrutement auprès des équipes techniques et commerciales.', niveauEtudes: 'Bac+5', niveauExperience: '3-5 ans', competences: ['Product Discovery', 'Agile', 'Analytics'], langues: ['Français', 'Anglais'], salaireMin: 16000, salaireMax: 22000, avantages: ['Mutuelle', 'RTT'], teletravail: 'Hybride', horaires: '9h-18h', dateExpiration: '2026-11-30', visibilite: 'Publique', vues: 98 },
  { id: '8', titre: 'Ingénieur DevOps', entreprise: 'TechCorp SA', entrepriseId: '1', recruteur: 'Fatima Zahra', ville: 'Casablanca, MA', contrat: 'CDI', candidatures: 0, publication: '-', statut: 'Brouillon', departement: 'Infrastructure', secteur: 'IT', localisation: 'Casablanca, Maroc', description: 'Brouillon d’offre pour un poste d’ingénieur DevOps chargé de nos pipelines CI/CD et de notre observabilité.', niveauEtudes: 'Bac+5', niveauExperience: '1-3 ans', competences: ['Docker', 'CI/CD', 'Monitoring'], langues: ['Français'], teletravail: 'Hybride', visibilite: 'Privée', vues: 0 },
];

export const STATUT_CLASS: Record<Statut, string> = {
  'En attente': 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  Publiée: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  'En pause': 'bg-amud-secondary-fixed text-amud-on-secondary-fixed',
  Brouillon: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  Expirée: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  Refusée: 'bg-amud-error-container text-amud-on-error-container',
  Archivée: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
};

export function getOffresForEntreprise(entrepriseId: string, all: Offre[] = offresSeed) {
  return all.filter((o) => o.entrepriseId === entrepriseId);
}
