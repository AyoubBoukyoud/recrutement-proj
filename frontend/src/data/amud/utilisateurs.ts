/**
 * Jeu de données factice des utilisateurs plateforme (`/amud/admin/utilisateurs`),
 * extrait de la page pour être réutilisable par la recherche globale du header.
 */
export type Role = 'Candidat' | 'Recruteur' | 'Commercial' | 'Administrateur';
export type Statut = 'Actif' | 'Bloqué' | 'Inactif';

export type Utilisateur = {
  id: string;
  nom: string;
  email: string;
  role: Role;
  ville: string;
  statut: Statut;
  dernierAcces: string;
  creeLe: string;
};

export const ROLES: Role[] = ['Candidat', 'Recruteur', 'Commercial', 'Administrateur'];

export const utilisateursSeed: Utilisateur[] = [
  { id: '1', nom: 'Sophie Martin', email: 's.martin@email.com', role: 'Recruteur', ville: 'Casablanca', statut: 'Actif', dernierAcces: "Aujourd'hui", creeLe: '12/10/2023' },
  { id: '2', nom: 'Lucas Renard', email: 'l.renard@email.com', role: 'Commercial', ville: 'Paris', statut: 'Actif', dernierAcces: 'Hier', creeLe: '05/09/2023' },
  { id: '3', nom: 'Emma Leroy', email: 'e.leroy@email.com', role: 'Administrateur', ville: 'Lyon', statut: 'Bloqué', dernierAcces: '--', creeLe: '10/08/2023' },
  { id: '4', nom: 'Youssef Amrani', email: 'y.amrani@email.com', role: 'Candidat', ville: 'Casablanca', statut: 'Actif', dernierAcces: "Aujourd'hui", creeLe: '02/02/2024' },
  { id: '5', nom: 'Nadia Mansouri', email: 'n.mansouri@email.com', role: 'Candidat', ville: 'Marrakech', statut: 'Actif', dernierAcces: 'Il y a 3 jours', creeLe: '14/01/2024' },
  { id: '6', nom: 'Marie Lambert', email: 'marie.lambert@amudskills.com', role: 'Commercial', ville: 'Lyon', statut: 'Actif', dernierAcces: "Aujourd'hui", creeLe: '05/09/2023' },
  { id: '7', nom: 'Karim Bennani', email: 'k.bennani@email.com', role: 'Recruteur', ville: 'Berlin', statut: 'Inactif', dernierAcces: 'Il y a 2 semaines', creeLe: '20/06/2023' },
  { id: '8', nom: 'Jean Dupont', email: 'jean.dupont@amudskills.com', role: 'Commercial', ville: 'Paris', statut: 'Actif', dernierAcces: "Aujourd'hui", creeLe: '12/03/2023' },
];

export const STATUT_DOT: Record<Statut, string> = {
  Actif: 'bg-amud-primary-container',
  Bloqué: 'bg-amud-error',
  Inactif: 'bg-amud-outline',
};
export const STATUT_TEXT: Record<Statut, string> = {
  Actif: 'text-amud-primary-container',
  Bloqué: 'text-amud-error',
  Inactif: 'text-amud-outline',
};
