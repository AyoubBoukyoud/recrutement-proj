/**
 * Relance (follow-up) — entité dédiée avec son propre cycle de vie
 * (créer/compléter/reporter/annuler/supprimer), distincte de l'`Activite`
 * de type `'Follow-up'` (qui reste l'entrée d'historique correspondante dans
 * le journal d'activité). Un `CallTicket` avec `followUpRequired: true` crée
 * automatiquement une `FollowUp` (cahier des charges §10 et §13).
 */
export type FollowUpStatus = 'Planifiée' | 'Terminée' | 'Reportée' | 'Annulée';

export type FollowUp = {
  id: string;
  entrepriseId?: string;
  entrepriseNom?: string;
  contactNom: string;
  /** Optionnel — id + type du contact rappelé (ex. `candidate_xxx` / `'Candidat'`), pour relier ce rappel à sa fiche (`/amud/commercial/candidats/:id` → onglet Historique). Absent pour les rappels créés avant cette extension ou sans contact identifié. */
  contactId?: string;
  contactType?: 'Entreprise' | 'Candidat' | 'Recruteur' | 'Portefeuille';
  commercialId: string;
  commercialNom: string;
  dueDate: string; // 'DD/MM/YYYY'
  dueTime: string; // 'HH:MM'
  note: string;
  status: FollowUpStatus;
  callTicketId?: string;
  createdAt: string;
};

export const STATUS_CLASS: Record<FollowUpStatus, string> = {
  Planifiée: 'bg-amud-tertiary-fixed text-amud-tertiary-container',
  Terminée: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  Reportée: 'bg-amud-secondary-container text-amud-on-secondary-container',
  Annulée: 'bg-amud-surface-container-high text-amud-on-surface-variant',
};

export const followupsSeed: FollowUp[] = [
  { id: 'followup_1', entrepriseId: '1', entrepriseNom: 'TechCorp SA', contactNom: 'Fatima Zahra', commercialId: 'ahmed-benali', commercialNom: 'Ahmed Benali', dueDate: '22/08/2026', dueTime: '10:00', note: 'Finaliser la présentation candidats.', status: 'Planifiée', createdAt: '2026-08-20T14:36:00.000Z' },
  { id: 'followup_2', entrepriseId: '5', entrepriseNom: 'Innovate SA', contactNom: 'Karim Bennani', commercialId: 'ahmed-benali', commercialNom: 'Ahmed Benali', dueDate: '21/08/2026', dueTime: '09:30', note: 'Rappel suite à appel sans réponse.', status: 'Planifiée', createdAt: '2026-08-19T09:35:00.000Z' },
  { id: 'followup_3', entrepriseId: '2', entrepriseNom: 'BuildIt Construction', contactNom: 'Hans Müller', commercialId: 'marie-lambert', commercialNom: 'Marie Lambert', dueDate: '18/08/2026', dueTime: '18:00', note: 'Confirmer réception de la short-list.', status: 'Terminée', createdAt: '2026-08-16T10:18:00.000Z' },
  { id: 'followup_4', entrepriseId: '3', entrepriseNom: 'MediCare Group', contactNom: 'Isabelle Roche', commercialId: 'sophie-martin', commercialNom: 'Sophie Martin', dueDate: '05/01/2027', dueTime: '09:00', note: 'Reprendre contact après le gel budgétaire.', status: 'Planifiée', createdAt: '2026-08-14T13:04:00.000Z' },
  { id: 'followup_5', entrepriseId: '6', entrepriseNom: 'Logistics Pro', contactNom: 'Younes Idrissi', commercialId: 'thomas-dubois', commercialNom: 'Thomas Dubois', dueDate: '13/08/2026', dueTime: '16:00', note: 'Envoi grille tarifaire Tanger.', status: 'Terminée', createdAt: '2026-08-12T16:27:00.000Z' },
];

export function getFollowUpsForEntreprise(entrepriseId: string, all: FollowUp[] = followupsSeed) {
  return all.filter((f) => f.entrepriseId === entrepriseId);
}
