/**
 * Source unique des activités commerciales (appels, emails, notes, tâches,
 * rendez-vous, offres, follow-ups…) pour l'espace `/amud/commercial/*`.
 * Consommée à la fois par la page centrale `/amud/commercial/activites` et
 * par l'onglet "Activités" / "Historique des contacts" de la fiche
 * entreprise (`/amud/commercial/entreprises/:id`) — une seule liste, jamais
 * dupliquée entre les deux vues, comme le fait déjà `entreprisesSeed` pour
 * `/amud/admin/entreprises` et la recherche globale.
 */
export type TypeActivite = 'Appel' | 'Email' | 'Note' | 'Tâche' | 'Rendez-vous' | 'Offre créée' | 'Offre publiée' | 'Candidat proposé' | 'Follow-up';
export type ResultatActivite = 'Répondu' | 'Sans réponse' | 'Positif' | 'Négatif' | 'En cours' | '—';
export type StatutActivite = 'Terminé' | 'Planifié' | 'En cours';

export type Activite = {
  id: string;
  entrepriseId: string;
  entrepriseNom: string;
  contact: string;
  commercialId: string;
  commercial: string;
  date: string;
  heureDebut: string;
  heureFin?: string;
  duree: string;
  type: TypeActivite;
  resultat: ResultatActivite;
  resume: string;
  prochaineAction: string;
  prochaineDate?: string;
  statut: StatutActivite;
  tacheId?: string;
  rdvId?: string;
};

export const TYPE_ICON: Record<TypeActivite, string> = {
  Appel: 'call',
  Email: 'mail',
  Note: 'edit_document',
  Tâche: 'task_alt',
  'Rendez-vous': 'event',
  'Offre créée': 'post_add',
  'Offre publiée': 'campaign',
  'Candidat proposé': 'person_add',
  'Follow-up': 'history',
};

export const RESULTAT_CLASS: Record<ResultatActivite, string> = {
  Répondu: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  Positif: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  'En cours': 'bg-amud-tertiary-fixed text-amud-tertiary-container border-amud-tertiary-fixed-dim',
  'Sans réponse': 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
  Négatif: 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
  '—': 'bg-amud-surface-container-high text-amud-on-surface-variant border-amud-outline-variant',
};

export const STATUT_CLASS: Record<StatutActivite, string> = {
  Terminé: 'text-amud-primary',
  Planifié: 'text-amud-tertiary',
  'En cours': 'text-amud-secondary',
};

export const activitesSeed: Activite[] = [
  {
    id: 'act-1',
    entrepriseId: '1',
    entrepriseNom: 'TechCorp SA',
    contact: 'Fatima Zahra (RH)',
    commercialId: 'ahmed-benali',
    commercial: 'Ahmed Benali',
    date: '20/08/2026',
    heureDebut: '14:30',
    heureFin: '14:36',
    duree: '05:32',
    type: 'Appel',
    resultat: 'Répondu',
    resume: 'Le responsable RH souhaite recevoir une présentation des candidats disponibles.',
    prochaineAction: 'Rappeler le 22/08/2026 à 10:00',
    prochaineDate: '22/08/2026 10:00',
    statut: 'Terminé',
    rdvId: 'rdv-techcorp-relance',
  },
  {
    id: 'act-2',
    entrepriseId: '1',
    entrepriseNom: 'TechCorp SA',
    contact: 'Fatima Zahra (RH)',
    commercialId: 'ahmed-benali',
    commercial: 'Ahmed Benali',
    date: '19/08/2026',
    heureDebut: '09:10',
    duree: '-',
    type: 'Email',
    resultat: '—',
    resume: 'Envoi de la présentation des candidats disponibles pour le poste de Développeur Fullstack.',
    prochaineAction: 'Attendre retour avant le 22/08',
    statut: 'Terminé',
  },
  {
    id: 'act-3',
    entrepriseId: '1',
    entrepriseNom: 'TechCorp SA',
    contact: 'Fatima Zahra (RH)',
    commercialId: 'ahmed-benali',
    commercial: 'Ahmed Benali',
    date: '22/08/2026',
    heureDebut: '10:00',
    duree: '-',
    type: 'Rendez-vous',
    resultat: 'En cours',
    resume: 'Rappel planifié suite à l’appel du 20/08 pour finaliser la présentation candidats.',
    prochaineAction: 'Confirmer la disponibilité de Fatima Zahra',
    prochaineDate: '22/08/2026 10:00',
    statut: 'Planifié',
    rdvId: 'rdv-techcorp-relance',
  },
  {
    id: 'act-4',
    entrepriseId: '1',
    entrepriseNom: 'TechCorp SA',
    contact: 'Marc Lefèvre (Recruteur)',
    commercialId: 'ahmed-benali',
    commercial: 'Ahmed Benali',
    date: '15/08/2026',
    heureDebut: '16:00',
    duree: '-',
    type: 'Offre publiée',
    resultat: '—',
    resume: 'Publication de l’offre "Développeur Fullstack React/Node" suite à validation client.',
    prochaineAction: 'Suivre les premières candidatures',
    statut: 'Terminé',
  },
  {
    id: 'act-5',
    entrepriseId: '1',
    entrepriseNom: 'TechCorp SA',
    contact: 'Fatima Zahra (RH)',
    commercialId: 'ahmed-benali',
    commercial: 'Ahmed Benali',
    date: '10/08/2026',
    heureDebut: '11:20',
    heureFin: '11:27',
    duree: '07:10',
    type: 'Appel',
    resultat: 'Répondu',
    resume: 'Premier contact — présentation d’Amud Skills et qualification des besoins de recrutement.',
    prochaineAction: 'Envoyer la présentation candidats',
    statut: 'Terminé',
  },
  {
    id: 'act-6',
    entrepriseId: '5',
    entrepriseNom: 'Innovate SA',
    contact: 'Karim Bennani (DRH)',
    commercialId: 'ahmed-benali',
    commercial: 'Ahmed Benali',
    date: '18/08/2026',
    heureDebut: '11:15',
    heureFin: '11:15',
    duree: '00:00',
    type: 'Appel',
    resultat: 'Sans réponse',
    resume: 'Aucune réponse — message vocal laissé.',
    prochaineAction: 'Rappeler demain matin',
    prochaineDate: '19/08/2026 09:30',
    statut: 'Terminé',
  },
  {
    id: 'act-7',
    entrepriseId: '5',
    entrepriseNom: 'Innovate SA',
    contact: 'Karim Bennani (DRH)',
    commercialId: 'ahmed-benali',
    commercial: 'Ahmed Benali',
    date: '19/08/2026',
    heureDebut: '09:35',
    duree: '-',
    type: 'Follow-up',
    resultat: 'En cours',
    resume: 'Relance après appel manqué de la veille.',
    prochaineAction: 'Nouvel appel prévu',
    prochaineDate: '21/08/2026',
    statut: 'En cours',
  },
  {
    id: 'act-8',
    entrepriseId: '4',
    entrepriseNom: 'Klinikum Berlin',
    contact: 'Dr. Anna Weber',
    commercialId: 'ahmed-benali',
    commercial: 'Ahmed Benali',
    date: '17/08/2026',
    heureDebut: '15:45',
    duree: '-',
    type: 'Note',
    resultat: '—',
    resume: 'Le service cardiologie recherche 2 infirmiers spécialisés pour la rentrée.',
    prochaineAction: 'Préparer une short-list',
    statut: 'Terminé',
  },
  {
    id: 'act-9',
    entrepriseId: '2',
    entrepriseNom: 'BuildIt Construction',
    contact: 'Hans Müller',
    commercialId: 'marie-lambert',
    commercial: 'Marie Lambert',
    date: '16/08/2026',
    heureDebut: '10:05',
    heureFin: '10:18',
    duree: '13:02',
    type: 'Appel',
    resultat: 'Positif',
    resume: 'Très intéressé par notre offre de chasse pour le poste de Chef de Chantier.',
    prochaineAction: 'Envoyer 3 profils sous 48h',
    prochaineDate: '18/08/2026',
    statut: 'Terminé',
  },
  {
    id: 'act-10',
    entrepriseId: '2',
    entrepriseNom: 'BuildIt Construction',
    contact: 'Hans Müller',
    commercialId: 'marie-lambert',
    commercial: 'Marie Lambert',
    date: '18/08/2026',
    heureDebut: '08:00',
    duree: '-',
    type: 'Tâche',
    resultat: '—',
    resume: 'Préparer et envoyer la short-list de 3 profils Chef de Chantier.',
    prochaineAction: 'Envoyer avant 18h',
    statut: 'En cours',
    tacheId: 'tache-2',
  },
  {
    id: 'act-11',
    entrepriseId: '3',
    entrepriseNom: 'MediCare Group',
    contact: 'Isabelle Roche',
    commercialId: 'sophie-martin',
    commercial: 'Sophie Martin',
    date: '14/08/2026',
    heureDebut: '13:00',
    heureFin: '13:04',
    duree: '04:12',
    type: 'Appel',
    resultat: 'Négatif',
    resume: 'Budget de recrutement gelé jusqu’au prochain trimestre.',
    prochaineAction: 'Reprendre contact en janvier',
    prochaineDate: '05/01/2027',
    statut: 'Terminé',
  },
  {
    id: 'act-12',
    entrepriseId: '3',
    entrepriseNom: 'MediCare Group',
    contact: 'Isabelle Roche',
    commercialId: 'sophie-martin',
    commercial: 'Sophie Martin',
    date: '09/08/2026',
    heureDebut: '09:30',
    duree: '-',
    type: 'Rendez-vous',
    resultat: 'Positif',
    resume: 'Présentation du bilan trimestriel du partenariat.',
    prochaineAction: 'Envoyer le compte-rendu',
    statut: 'Terminé',
  },
  {
    id: 'act-13',
    entrepriseId: '6',
    entrepriseNom: 'Logistics Pro',
    contact: 'Younes Idrissi',
    commercialId: 'thomas-dubois',
    commercial: 'Thomas Dubois',
    date: '12/08/2026',
    heureDebut: '16:20',
    heureFin: '16:27',
    duree: '06:40',
    type: 'Appel',
    resultat: 'Répondu',
    resume: 'Qualification du besoin logistique pour le site de Tanger.',
    prochaineAction: 'Envoyer la grille tarifaire',
    prochaineDate: '13/08/2026',
    statut: 'Terminé',
  },
  {
    id: 'act-14',
    entrepriseId: '7',
    entrepriseNom: 'Design Studio',
    contact: 'Camille Perrin',
    commercialId: 'marie-lambert',
    commercial: 'Marie Lambert',
    date: '08/08/2026',
    heureDebut: '11:00',
    duree: '-',
    type: 'Candidat proposé',
    resultat: '—',
    resume: 'Proposition du profil de Nadia Mansouri (UX Designer) pour le poste ouvert.',
    prochaineAction: 'Attendre retour entretien',
    statut: 'En cours',
  },
];

/** `all` doit déjà être la collection complète (seed + ajouts) — voir `lib/amud/localCommercialActivites.ts`. */
export function getActivitesForEntreprise(entrepriseId: string, all: Activite[] = activitesSeed) {
  return all
    .filter((a) => a.entrepriseId === entrepriseId)
    .sort((a, b) => (a.date === b.date ? b.heureDebut.localeCompare(a.heureDebut) : b.date.localeCompare(a.date)));
}
