/**
 * Personnes de contact rattachées à une entreprise partenaire, affichées
 * dans l'onglet "Contacts" de `/amud/commercial/entreprises/:id`. Distinct
 * du portefeuille personnel du commercial (`/amud/commercial/contacts`,
 * candidats/recruteurs/entreprises suivis individuellement) : ici il s'agit
 * des interlocuteurs *au sein* d'une entreprise cliente donnée.
 */
export type StatutContact = 'Actif' | 'À relancer' | 'Inactif';

export type ContactEntreprise = {
  id: string;
  entrepriseId: string;
  nom: string;
  poste: string;
  telephone: string;
  email: string;
  statut: StatutContact;
  dernierContact: string;
  commercialResponsable: string;
};

export const STATUT_CLASS: Record<StatutContact, string> = {
  Actif: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  'À relancer': 'bg-amud-tertiary-fixed text-amud-tertiary-container',
  Inactif: 'bg-amud-surface-container-high text-amud-on-surface-variant',
};

export const contactsEntrepriseSeed: ContactEntreprise[] = [
  { id: 'ce-1', entrepriseId: '1', nom: 'Fatima Zahra', poste: 'Responsable RH', telephone: '+212 6 61 22 33 44', email: 'f.zahra@techcorp-sa.com', statut: 'Actif', dernierContact: '20/08/2026', commercialResponsable: 'Ahmed Benali' },
  { id: 'ce-2', entrepriseId: '1', nom: 'Marc Lefèvre', poste: 'Talent Acquisition Manager', telephone: '+212 6 61 55 66 77', email: 'm.lefevre@techcorp-sa.com', statut: 'Actif', dernierContact: '15/08/2026', commercialResponsable: 'Ahmed Benali' },
  { id: 'ce-3', entrepriseId: '2', nom: 'Hans Müller', poste: 'Directeur des opérations', telephone: '+49 176 22 33 44', email: 'h.muller@buildit-construction.de', statut: 'Actif', dernierContact: '18/08/2026', commercialResponsable: 'Marie Lambert' },
  { id: 'ce-4', entrepriseId: '3', nom: 'Isabelle Roche', poste: 'DRH', telephone: '+33 6 12 22 33 44', email: 'i.roche@medicare-group.fr', statut: 'À relancer', dernierContact: '14/08/2026', commercialResponsable: 'Sophie Martin' },
  { id: 'ce-5', entrepriseId: '4', nom: 'Dr. Anna Weber', poste: 'Cheffe de service Cardiologie', telephone: '+49 176 55 66 77', email: 'a.weber@klinikum-berlin.de', statut: 'Actif', dernierContact: '17/08/2026', commercialResponsable: 'Ahmed Benali' },
  { id: 'ce-6', entrepriseId: '5', nom: 'Karim Bennani', poste: 'DRH', telephone: '+212 6 62 33 44 55', email: 'k.bennani@innovate-sa.com', statut: 'À relancer', dernierContact: '19/08/2026', commercialResponsable: 'Ahmed Benali' },
  { id: 'ce-7', entrepriseId: '6', nom: 'Younes Idrissi', poste: 'Responsable logistique', telephone: '+212 6 63 44 55 66', email: 'y.idrissi@logistics-pro.ma', statut: 'Inactif', dernierContact: '12/08/2026', commercialResponsable: 'Thomas Dubois' },
  { id: 'ce-8', entrepriseId: '7', nom: 'Camille Perrin', poste: 'Directrice artistique', telephone: '+33 6 78 22 33 44', email: 'c.perrin@design-studio.fr', statut: 'Actif', dernierContact: '08/08/2026', commercialResponsable: 'Marie Lambert' },
];

export function getContactsForEntreprise(entrepriseId: string) {
  return contactsEntrepriseSeed.filter((c) => c.entrepriseId === entrepriseId);
}
