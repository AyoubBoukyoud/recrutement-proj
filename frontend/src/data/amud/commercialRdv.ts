import { addDays, getMonday, isoDate } from '@/lib/amud/weekDates';

/**
 * Rendez-vous commerciaux — utilisé par le calendrier hebdomadaire dynamique
 * de `/amud/commercial/rendez-vous` ET réutilisable tel quel par l'onglet
 * "Rendez-vous" de la fiche entreprise (`/amud/commercial/entreprises/:id`),
 * même pattern d'extraction que `commerciaux.ts`/`entreprises.ts`/`offres.ts`
 * pour `/amud/admin/*`. `entrepriseId` relie chaque rendez-vous à
 * `entreprisesSeed` quand l'entreprise de la maquette source a un
 * équivalent dans ce jeu de données (sinon `undefined`).
 *
 * Chaque rendez-vous porte une vraie date ISO + heure de début/fin (plutôt
 * que les coordonnées pixel `top`/`height`/`hourRow` sur une semaine figée
 * "Octobre 2023" de la première version) — condition nécessaire pour que le
 * calendrier puisse réellement naviguer semaine par semaine et accepter des
 * rendez-vous créés dynamiquement. La position dans la grille est
 * recalculée à l'affichage à partir de `debut`/`fin` (voir `rendez-vous/page.tsx`).
 */
export type StatutRdv = 'programme' | 'confirme' | 'termine' | 'annule' | 'reporte';
export type TypeRdv = 'Visioconférence' | 'Appel téléphonique' | 'Sur site' | 'Présentiel';

export type Rdv = {
  id: string;
  entrepriseId?: string;
  date: string; // ISO 'YYYY-MM-DD'
  debut: string; // 'HH:MM'
  fin: string; // 'HH:MM'
  nom: string;
  entreprise: string;
  statut: StatutRdv;
  type: TypeRdv;
  lien?: string;
  objectif: string;
  notes: string[];
};

export const STATUTS: StatutRdv[] = ['programme', 'confirme', 'termine', 'reporte', 'annule'];
export const TYPES: TypeRdv[] = ['Visioconférence', 'Appel téléphonique', 'Sur site', 'Présentiel'];

export const STATUT_STYLE: Record<StatutRdv, { bg: string; border: string; text: string; label: string }> = {
  programme: { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1', label: 'Programmé' },
  confirme: { bg: '#dcfce7', border: '#16a34a', text: '#15803d', label: 'Confirmé' },
  termine: { bg: '#f3f4f6', border: '#6b7280', text: '#374151', label: 'Terminé' },
  annule: { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c', label: 'Annulé' },
  reporte: { bg: '#ffedd5', border: '#f97316', text: '#c2410c', label: 'Reporté' },
};

export const TYPE_ICON: Record<TypeRdv, string> = {
  'Visioconférence': 'videocam',
  'Appel téléphonique': 'call',
  'Sur site': 'location_on',
  'Présentiel': 'location_on',
};

/** Semaine courante (lundi→vendredi), pour que la maquette semble toujours "à jour" quelle que soit la date d'ouverture. */
export function buildSeedRdvs(): Rdv[] {
  const monday = getMonday(new Date());
  const d = (jour: number) => isoDate(addDays(monday, jour - 1)); // jour: 1 = Lun … 5 = Ven

  return [
    {
      id: 'youssef',
      entrepriseId: '1',
      date: d(2),
      debut: '09:00',
      fin: '11:00',
      nom: 'Youssef Amrani',
      entreprise: 'TechCorp',
      statut: 'confirme',
      type: 'Visioconférence',
      lien: '#',
      objectif: 'Présentation de la nouvelle offre de services "Pillar Alpha" et discussion sur les besoins d\'intégration CRM pour 2024.',
      notes: ['Revoir le contrat précédent', 'Préparer les démos modules RH', 'Vérifier dispo technique semaine 42'],
    },
    {
      id: 'amina',
      date: d(4),
      debut: '10:00',
      fin: '10:30',
      nom: 'Amina Berrada',
      entreprise: 'Consulting Group',
      statut: 'termine',
      type: 'Sur site',
      objectif: 'Bilan trimestriel du partenariat.',
      notes: ['Préparer le récapitulatif des placements du trimestre'],
    },
    {
      id: 'khalid',
      entrepriseId: '6',
      date: d(1),
      debut: '11:30',
      fin: '13:00',
      nom: 'Khalid El Fassi',
      entreprise: 'Logistics Pro',
      statut: 'programme',
      type: 'Appel téléphonique',
      objectif: 'Qualification du besoin logistique pour le site de Tanger.',
      notes: ["Envoyer la grille tarifaire avant l'appel"],
    },
    {
      id: 'sarah',
      entrepriseId: '7',
      date: d(3),
      debut: '14:00',
      fin: '14:30',
      nom: 'Sarah Tazi',
      entreprise: 'Design Studio',
      statut: 'annule',
      type: 'Sur site',
      objectif: 'Annulé par le client — à reprogrammer.',
      notes: [],
    },
    {
      id: 'karim',
      entrepriseId: '2',
      date: d(4),
      debut: '15:00',
      fin: '15:30',
      nom: 'Karim Bennani',
      entreprise: 'BuildIt Sarl',
      statut: 'reporte',
      type: 'Sur site',
      objectif: 'Reporté à la demande du client.',
      notes: [],
    },
    {
      id: 'nadia',
      entrepriseId: '5',
      date: d(5),
      debut: '15:30',
      fin: '17:00',
      nom: 'Nadia Mansouri',
      entreprise: 'Innovate SA',
      statut: 'confirme',
      type: 'Présentiel',
      objectif: "Signature du contrat cadre et présentation de l'équipe dédiée.",
      notes: ['Apporter les exemplaires du contrat', 'Confirmer la présence du directeur commercial'],
    },
    {
      id: 'rdv-techcorp-relance',
      entrepriseId: '1',
      date: d(5),
      debut: '10:00',
      fin: '10:30',
      nom: 'Fatima Zahra',
      entreprise: 'TechCorp SA',
      statut: 'programme',
      type: 'Appel téléphonique',
      objectif: 'Rappel suite à l’appel précédent pour finaliser la présentation des candidats disponibles.',
      notes: ['Confirmer la disponibilité de Fatima Zahra'],
    },
  ];
}

/** Snapshot statique (calculée une fois au chargement du module) pour le code qui n'a pas besoin du live localStorage — ex. la fiche entreprise, qui combine elle-même `rdvsSeed` + ses propres extras. */
export const rdvsSeed: Rdv[] = buildSeedRdvs();

export function getRdvsForEntreprise(entrepriseId: string, all: Rdv[] = rdvsSeed) {
  return all.filter((r) => r.entrepriseId === entrepriseId);
}
