/**
 * Jeu de données factice des entreprises partenaires (`/amud/admin/entreprises`),
 * extrait de la page pour être réutilisable par la recherche globale du header.
 */
export type Statut = 'Vérifiée' | 'Active' | 'En attente' | 'Bloquée';
export type CompanyType = 'PME' | 'Grande entreprise' | 'Startup' | 'Cabinet de recrutement' | 'Multinationale' | 'Association/ONG';
export type SocialLinks = { linkedin?: string; facebook?: string; twitter?: string; instagram?: string };

export type Entreprise = {
  id: string;
  nom: string;
  icon: string;
  recruteurs: number;
  offres: number;
  candidatures: number;
  ville: string;
  secteur: string;
  statut: Statut;
  derniereActivite: string;
  /** Champs additionnels pour la fiche détaillée (`/amud/commercial/entreprises/:id`) — optionnels pour ne pas casser les entreprises ajoutées via la popup admin, qui ne les saisit pas. */
  siteWeb?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  taille?: string;
  dateInscription?: string;
  commercialResponsable?: string;
  /** Champs additionnels pour le profil complet de l'espace entreprise (`/amud/entreprise/profil`) — optionnels pour la même raison. */
  logo?: string;
  description?: string;
  foundedYear?: number;
  companyType?: CompanyType;
  pays?: string;
  socialLinks?: SocialLinks;
};

export const entreprisesSeed: Entreprise[] = [
  { id: '1', nom: 'TechCorp SA', icon: 'apartment', recruteurs: 4, offres: 12, candidatures: 145, ville: 'Casablanca', secteur: 'IT', statut: 'Vérifiée', derniereActivite: "Aujourd'hui", siteWeb: 'www.techcorp-sa.com', telephone: '+212 5 22 00 11 22', email: 'contact@techcorp-sa.com', adresse: '12 Boulevard Zerktouni, Casablanca', taille: '250-500 employés', dateInscription: '03/02/2022', commercialResponsable: 'Ahmed Benali', description: "TechCorp SA est une entreprise technologique marocaine spécialisée dans le développement de solutions logicielles sur mesure et le conseil en transformation digitale pour les grands groupes du Maghreb et d'Europe.", foundedYear: 2011, companyType: 'Grande entreprise', pays: 'Maroc', socialLinks: { linkedin: 'linkedin.com/company/techcorp-sa', twitter: 'twitter.com/techcorpsa' } },
  { id: '2', nom: 'BuildIt Construction', icon: 'construction', recruteurs: 2, offres: 5, candidatures: 68, ville: 'Berlin', secteur: 'BTP', statut: 'Active', derniereActivite: 'Hier', siteWeb: 'www.buildit-construction.de', telephone: '+49 30 555 0142', email: 'kontakt@buildit-construction.de', adresse: 'Alexanderplatz 5, Berlin', taille: '50-100 employés', dateInscription: '18/06/2022', commercialResponsable: 'Marie Lambert', description: 'BuildIt Construction conçoit et réalise des projets de gros œuvre et de génie civil pour des clients industriels et institutionnels en Allemagne.', foundedYear: 2005, companyType: 'PME', pays: 'Allemagne', socialLinks: { linkedin: 'linkedin.com/company/buildit-construction' } },
  { id: '3', nom: 'MediCare Group', icon: 'local_hospital', recruteurs: 8, offres: 20, candidatures: 312, ville: 'Lyon', secteur: 'Santé', statut: 'En attente', derniereActivite: '12/10/2023', siteWeb: 'www.medicare-group.fr', telephone: '+33 4 78 00 11 22', email: 'contact@medicare-group.fr', adresse: '8 Rue de la République, Lyon', taille: '500+ employés', dateInscription: '25/11/2022', commercialResponsable: 'Sophie Martin' },
  { id: '4', nom: 'Klinikum Berlin', icon: 'medical_services', recruteurs: 3, offres: 9, candidatures: 88, ville: 'Berlin', secteur: 'Santé', statut: 'Active', derniereActivite: 'Il y a 2 jours', siteWeb: 'www.klinikum-berlin.de', telephone: '+49 30 555 0198', email: 'info@klinikum-berlin.de', adresse: 'Charitéplatz 1, Berlin', taille: '250-500 employés', dateInscription: '14/01/2023', commercialResponsable: 'Ahmed Benali' },
  { id: '5', nom: 'Innovate SA', icon: 'lightbulb', recruteurs: 5, offres: 14, candidatures: 176, ville: 'Casablanca', secteur: 'IT', statut: 'Vérifiée', derniereActivite: "Aujourd'hui", siteWeb: 'www.innovate-sa.com', telephone: '+212 5 22 33 44 55', email: 'hello@innovate-sa.com', adresse: '45 Avenue Hassan II, Casablanca', taille: '100-250 employés', dateInscription: '02/09/2022', commercialResponsable: 'Ahmed Benali', description: "Innovate SA accompagne les entreprises marocaines dans leurs projets data et intelligence artificielle, du POC à la mise en production.", foundedYear: 2018, companyType: 'Startup', pays: 'Maroc', socialLinks: { linkedin: 'linkedin.com/company/innovate-sa', instagram: 'instagram.com/innovatesa' } },
  { id: '6', nom: 'Logistics Pro', icon: 'local_shipping', recruteurs: 1, offres: 3, candidatures: 22, ville: 'Marrakech', secteur: 'Transport', statut: 'Bloquée', derniereActivite: '01/09/2023', siteWeb: 'www.logistics-pro.ma', telephone: '+212 5 24 11 22 33', email: 'contact@logistics-pro.ma', adresse: 'Zone Industrielle Sidi Ghanem, Marrakech', taille: '10-50 employés', dateInscription: '10/04/2023', commercialResponsable: 'Thomas Dubois' },
  { id: '7', nom: 'Design Studio', icon: 'palette', recruteurs: 2, offres: 4, candidatures: 41, ville: 'Lyon', secteur: 'Design', statut: 'Active', derniereActivite: 'Il y a 5 jours', siteWeb: 'www.design-studio.fr', telephone: '+33 4 78 22 33 44', email: 'bonjour@design-studio.fr', adresse: '22 Rue Garibaldi, Lyon', taille: '10-50 employés', dateInscription: '30/07/2023', commercialResponsable: 'Marie Lambert' },
];

export const STATUT_CLASS: Record<Statut, string> = {
  Vérifiée: 'bg-amud-primary-fixed-dim text-amud-on-primary-fixed-variant',
  Active: 'bg-amud-surface-container-highest text-amud-primary',
  'En attente': 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant',
  Bloquée: 'bg-amud-error-container text-amud-on-error-container',
};
