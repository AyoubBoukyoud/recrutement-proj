/**
 * Portefeuille personnel du commercial ("Mes contacts",
 * `/amud/commercial/contacts`) — distinct de `commercialContacts.ts`
 * (contacts *d'une entreprise donnée*). Extrait de la page pour pouvoir être
 * seedé par `initAmudDemoData()` au même titre que les autres entités.
 */
export type TypeContact = 'Candidat' | 'Recruteur' | 'Entreprise';
export type Priorite = 'Haute' | 'Normale' | 'Basse';
export type Resultat = 'Positif' | 'À relancer' | 'Sans suite';

export type Contact = {
  id: string;
  nom: string;
  poste: string;
  type: TypeContact;
  telephone: string;
  ville: string;
  dernierContact: string;
  resultat: Resultat;
  resultatDate: string;
  prochaineAction: string;
  prochaineDate: string;
  priorite: Priorite;
  aRappeler: boolean;
  /** FK optionnelles vers les vraies entités — absentes sur les contacts historiques de la maquette. */
  entrepriseId?: string;
  candidateId?: string;
  recruiterId?: string;
};

export const mesContactsSeed: Contact[] = [
  { id: 'c1', nom: 'Thomas Dubois', poste: 'Développeur Full-Stack', type: 'Candidat', telephone: '06 12 34 56 78', ville: 'Paris', dernierContact: '12 Oct 2023, 14:30', resultat: 'Positif', resultatDate: 'Le 12 Oct (Appel)', prochaineAction: 'Envoyer CV au client', prochaineDate: "Aujourd'hui", priorite: 'Haute', aRappeler: false },
  { id: 'c2', nom: 'Sophie Laurent', poste: 'Chef de Projet IT', type: 'Candidat', telephone: '06 98 76 54 32', ville: 'Lyon', dernierContact: '05 Oct 2023, 09:15', resultat: 'À relancer', resultatDate: 'Le 05 Oct (Email)', prochaineAction: 'Point téléphonique', prochaineDate: '15 Oct 2023', priorite: 'Normale', aRappeler: true },
  { id: 'c3', nom: 'Léa Martin', poste: 'Data Analyst', type: 'Candidat', telephone: '06 45 67 89 01', ville: 'Nantes', dernierContact: '01 Oct 2023, 11:00', resultat: 'Sans suite', resultatDate: 'Le 01 Oct (Entretien)', prochaineAction: 'Aucune action prévue', prochaineDate: '', priorite: 'Basse', aRappeler: false },
  { id: 'c4', nom: 'Youssef Amrani', poste: 'Ingénieur Cloud Senior', type: 'Candidat', telephone: '06 61 22 33 44', ville: 'Casablanca', dernierContact: '12 Oct 2023, 14:30', resultat: 'Positif', resultatDate: 'Le 12 Oct (Appel)', prochaineAction: 'Entretien technique', prochaineDate: 'Demain', priorite: 'Haute', aRappeler: true },
  { id: 'c5', nom: 'Nadia Mansouri', poste: 'UX Designer', type: 'Candidat', telephone: '06 65 88 99 00', ville: 'Marrakech', dernierContact: '10 Oct 2023, 09:15', resultat: 'À relancer', resultatDate: 'Le 10 Oct (Email)', prochaineAction: 'Relance portfolio', prochaineDate: '18 Oct 2023', priorite: 'Normale', aRappeler: true },
  { id: 'c6', nom: 'Sophie Martin', poste: 'Recruteuse Senior', type: 'Recruteur', telephone: '06 11 22 33 44', ville: 'Casablanca', dernierContact: '11 Oct 2023, 10:00', resultat: 'Positif', resultatDate: 'Le 11 Oct (Appel)', prochaineAction: 'Envoyer short-list', prochaineDate: 'Demain', priorite: 'Haute', aRappeler: false },
  { id: 'c7', nom: 'BuildIt Construction', poste: 'Compte entreprise', type: 'Entreprise', telephone: '05 22 00 00 00', ville: 'Berlin', dernierContact: '08 Oct 2023, 16:00', resultat: 'À relancer', resultatDate: 'Le 08 Oct (Email)', prochaineAction: 'Point trimestriel', prochaineDate: '20 Oct 2023', priorite: 'Normale', aRappeler: false, entrepriseId: '2' },
];
