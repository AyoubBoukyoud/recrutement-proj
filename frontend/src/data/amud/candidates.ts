/**
 * Entité Candidat — profil riche, distinct de la carte Kanban légère
 * (`data/amud/candidatures.ts`, désormais vue-Kanban de `Application`, voir
 * `applications.ts`). Utilisée par les nouvelles pages `/amud/admin/candidats`
 * et par les fiches candidat référencées depuis `Application`.
 */
export type StatutCandidate = 'Actif' | 'Inactif' | 'Bloqué';

export type Candidate = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  posteRecherche: string;
  competences: string[];
  disponibilite: string;
  statut: StatutCandidate;
  score: number;
  creeLe: string;
  dernierAcces: string;
};

export const STATUT_CLASS: Record<StatutCandidate, string> = {
  Actif: 'bg-amud-primary-container text-amud-on-primary-container',
  Inactif: 'bg-amud-surface-container-high text-amud-on-surface-variant',
  Bloqué: 'bg-amud-error-container text-amud-on-error-container',
};

export const candidatesSeed: Candidate[] = [
  { id: 'candidate_sophiem', nom: 'Sophie Martin', email: 's.martin@email.com', telephone: '+33 6 10 20 30 40', ville: 'Casablanca', posteRecherche: 'Infirmier D.E.', competences: ['Soins Intensifs', 'Bloc Opératoire'], disponibilite: 'Immédiate', statut: 'Actif', score: 95, creeLe: '10/10/2023', dernierAcces: 'Il y a 2h' },
  { id: 'candidate_lucasm', nom: 'Lucas Moreau', email: 'l.moreau@email.com', telephone: '+33 6 11 21 31 41', ville: 'Rabat', posteRecherche: 'Électricien Industriel', competences: ['Haute Tension', 'Maintenance'], disponibilite: 'Sous 1 mois', statut: 'Actif', score: 82, creeLe: '11/10/2023', dernierAcces: 'Il y a 4h' },
  { id: 'candidate_karimb', nom: 'Karim Bennani', email: 'k.bennani@email.com', telephone: '+212 6 62 10 20 30', ville: 'Casablanca', posteRecherche: 'Chef de Chantier', competences: ['BTP', 'Management'], disponibilite: 'Immédiate', statut: 'Actif', score: 98, creeLe: '05/10/2023', dernierAcces: '11/10/2023' },
  { id: 'candidate_nadiam', nom: 'Nadia Mansouri', email: 'n.mansouri@email.com', telephone: '+212 6 63 20 30 40', ville: 'Marrakech', posteRecherche: 'Data Scientist', competences: ['Python', 'AWS'], disponibilite: 'Sous 2 mois', statut: 'Actif', score: 91, creeLe: '01/10/2023', dernierAcces: 'Il y a 1j' },
  { id: 'candidate_youssefa', nom: 'Youssef Amrani', email: 'y.amrani@email.com', telephone: '+212 6 64 30 40 50', ville: 'Casablanca', posteRecherche: 'Full-Stack Developer', competences: ['Node.js', 'React'], disponibilite: 'Immédiate', statut: 'Actif', score: 96, creeLe: '02/10/2023', dernierAcces: 'Il y a 3j' },
  { id: 'candidate_fatimaz', nom: 'Fatima Ezzahra', email: 'f.ezzahra@email.com', telephone: '+212 6 65 40 50 60', ville: 'Fès', posteRecherche: 'UX Designer', competences: ['Figma', 'Recherche utilisateur'], disponibilite: 'Immédiate', statut: 'Actif', score: 88, creeLe: '15/10/2023', dernierAcces: "Aujourd'hui" },
  { id: 'candidate_omark', nom: 'Omar Kadiri', email: 'o.kadiri@email.com', telephone: '+212 6 66 50 60 70', ville: 'Tanger', posteRecherche: 'Ingénieur Cloud', competences: ['AWS', 'Kubernetes'], disponibilite: 'Sous 1 mois', statut: 'Actif', score: 90, creeLe: '18/10/2023', dernierAcces: 'Hier' },
  { id: 'candidate_salmab', nom: 'Salma Bouziane', email: 's.bouziane@email.com', telephone: '+212 6 67 60 70 80', ville: 'Agadir', posteRecherche: 'Infirmier D.E.', competences: ['Urgences', 'Pédiatrie'], disponibilite: 'Immédiate', statut: 'Inactif', score: 79, creeLe: '20/10/2023', dernierAcces: 'Il y a 3 semaines' },
  { id: 'candidate_yassineh', nom: 'Yassine Haddad', email: 'y.haddad@email.com', telephone: '+212 6 68 70 80 90', ville: 'Meknès', posteRecherche: 'Chef de Chantier', competences: ['BTP', 'Sécurité chantier'], disponibilite: 'Sous 2 mois', statut: 'Actif', score: 74, creeLe: '22/10/2023', dernierAcces: 'Il y a 5j' },
  { id: 'candidate_leilat', nom: 'Leila Tazi', email: 'l.tazi@email.com', telephone: '+212 6 69 80 90 10', ville: 'Casablanca', posteRecherche: 'UX Designer', competences: ['Design System', 'Prototypage'], disponibilite: 'Immédiate', statut: 'Bloqué', score: 60, creeLe: '25/10/2023', dernierAcces: 'Il y a 2 mois' },
];
