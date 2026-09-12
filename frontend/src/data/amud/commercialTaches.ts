/**
 * Source unique des tâches commerciales pour l'espace `/amud/commercial/*`.
 * Consommée par la page centrale `/amud/commercial/taches` (le "système de
 * tâches" central demandé) et par l'onglet "Tâches" de la fiche entreprise —
 * une tâche n'existe qu'à un seul endroit, filtrée par `entrepriseId` sur la
 * fiche plutôt que dupliquée.
 */
export type PrioriteTache = 'Haute' | 'Moyenne' | 'Basse';
export type StatutTache = 'À faire' | 'En cours' | 'Terminée' | 'En retard';

export type Tache = {
  id: string;
  titre: string;
  description: string;
  entrepriseId?: string;
  entrepriseNom?: string;
  commercial: string;
  commercialId: string;
  priorite: PrioriteTache;
  echeance: string;
  statut: StatutTache;
};

export const STATUT_CLASS: Record<StatutTache, string> = {
  'À faire': 'bg-amud-surface-container-high text-amud-on-surface-variant',
  'En cours': 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant',
  Terminée: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  'En retard': 'bg-amud-error-container text-amud-on-error-container',
};

export const PRIORITE_CLASS: Record<PrioriteTache, string> = {
  Haute: 'bg-amud-error-container text-amud-on-error-container',
  Moyenne: 'bg-amud-tertiary-fixed text-amud-tertiary-container',
  Basse: 'bg-amud-surface-container-high text-amud-on-surface-variant',
};

export const tachesSeed: Tache[] = [
  {
    id: 'tache-1',
    titre: 'Envoyer la présentation candidats',
    description: 'Préparer et envoyer à Fatima Zahra la présentation des 4 candidats disponibles pour le poste Fullstack.',
    entrepriseId: '1',
    entrepriseNom: 'TechCorp SA',
    commercial: 'Ahmed Benali',
    commercialId: 'ahmed-benali',
    priorite: 'Haute',
    echeance: '22/08/2026',
    statut: 'À faire',
  },
  {
    id: 'tache-2',
    titre: 'Short-list Chef de Chantier',
    description: 'Sélectionner 3 profils Chef de Chantier et les envoyer à Hans Müller.',
    entrepriseId: '2',
    entrepriseNom: 'BuildIt Construction',
    commercial: 'Marie Lambert',
    commercialId: 'marie-lambert',
    priorite: 'Haute',
    echeance: '18/08/2026',
    statut: 'En cours',
  },
  {
    id: 'tache-3',
    titre: 'Relancer Karim Bennani',
    description: 'Rappeler suite à l’appel sans réponse du 18/08.',
    entrepriseId: '5',
    entrepriseNom: 'Innovate SA',
    commercial: 'Ahmed Benali',
    commercialId: 'ahmed-benali',
    priorite: 'Moyenne',
    echeance: '21/08/2026',
    statut: 'À faire',
  },
  {
    id: 'tache-4',
    titre: 'Compte-rendu bilan trimestriel',
    description: 'Rédiger et envoyer le compte-rendu du bilan trimestriel à MediCare Group.',
    entrepriseId: '3',
    entrepriseNom: 'MediCare Group',
    commercial: 'Sophie Martin',
    commercialId: 'sophie-martin',
    priorite: 'Basse',
    echeance: '15/08/2026',
    statut: 'En retard',
  },
  {
    id: 'tache-5',
    titre: 'Grille tarifaire Logistics Pro',
    description: 'Envoyer la grille tarifaire pour le site de Tanger.',
    entrepriseId: '6',
    entrepriseNom: 'Logistics Pro',
    commercial: 'Thomas Dubois',
    commercialId: 'thomas-dubois',
    priorite: 'Moyenne',
    echeance: '13/08/2026',
    statut: 'Terminée',
  },
  {
    id: 'tache-6',
    titre: 'Préparer démo modules RH',
    description: 'Préparer les démos des modules RH pour le rendez-vous TechCorp du 22/08.',
    entrepriseId: '1',
    entrepriseNom: 'TechCorp SA',
    commercial: 'Ahmed Benali',
    commercialId: 'ahmed-benali',
    priorite: 'Haute',
    echeance: '22/08/2026',
    statut: 'À faire',
  },
  {
    id: 'tache-7',
    titre: 'Mise à jour du portefeuille contacts',
    description: 'Nettoyer et mettre à jour les fiches contacts inactives depuis plus de 30 jours.',
    commercial: 'Ahmed Benali',
    commercialId: 'ahmed-benali',
    priorite: 'Basse',
    echeance: '25/08/2026',
    statut: 'En cours',
  },
];

/** `all` doit déjà être la collection complète (seed + ajouts) — voir `lib/amud/localCommercialTaches.ts`. */
export function getTachesForEntreprise(entrepriseId: string, all: Tache[] = tachesSeed) {
  return all.filter((t) => t.entrepriseId === entrepriseId);
}
