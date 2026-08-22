/**
 * Ticket d'appel — schéma formel (cahier des charges §10), créé par toute
 * action "Appeler"/"Nouveau ticket" (dashboard commercial, fiche entreprise,
 * Mes contacts). Une fois enregistré, un `CallTicket` déclenche la cascade
 * complète : `Activite` liée créée, dernier contact mis à jour, `FollowUp`
 * créée si `followUpRequired`, `Rdv` créé si un rendez-vous est fixé,
 * notification poussée, entrée d'audit écrite — voir
 * `lib/amud/localCallTickets.ts`.
 */
export type CallResult =
  | 'Répondu'
  | 'Pas de réponse'
  | 'Ligne occupée'
  | 'Téléphone éteint'
  | 'Numéro incorrect'
  | 'Refus'
  | 'Intéressé'
  | 'À rappeler'
  | 'Rendez-vous fixé';

export type ContactType = 'Entreprise' | 'Candidat' | 'Recruteur' | 'Portefeuille';

export type CallTicket = {
  id: string;
  commercialId: string;
  commercialNom: string;
  contactId: string;
  contactNom: string;
  contactType: ContactType;
  entrepriseId?: string;
  entrepriseNom?: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  result: CallResult;
  summary: string;
  followUpRequired: boolean;
  followUpDate?: string;
  followUpTime?: string;
  appointmentId?: string;
  createdAt: string;
};

export const RESULT_CLASS: Record<CallResult, string> = {
  Répondu: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  Intéressé: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  'Rendez-vous fixé': 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  'À rappeler': 'bg-amud-tertiary-fixed text-amud-tertiary-container border-amud-tertiary-fixed-dim',
  'Pas de réponse': 'bg-amud-surface-container-high text-amud-on-surface-variant border-amud-outline-variant',
  'Ligne occupée': 'bg-amud-surface-container-high text-amud-on-surface-variant border-amud-outline-variant',
  'Téléphone éteint': 'bg-amud-surface-container-high text-amud-on-surface-variant border-amud-outline-variant',
  'Numéro incorrect': 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
  Refus: 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
};

export const callTicketsSeed: CallTicket[] = [
  {
    id: 'ticket_seed1', commercialId: 'ahmed-benali', commercialNom: 'Ahmed Benali',
    contactId: 'ce-1', contactNom: 'Fatima Zahra', contactType: 'Entreprise',
    entrepriseId: '1', entrepriseNom: 'TechCorp SA',
    startedAt: '2026-08-20T14:30:00.000Z', endedAt: '2026-08-20T14:35:32.000Z', durationSeconds: 332,
    result: 'Répondu', summary: 'Le responsable RH souhaite recevoir une présentation des candidats disponibles.',
    followUpRequired: true, followUpDate: '22/08/2026', followUpTime: '10:00',
    createdAt: '2026-08-20T14:35:32.000Z',
  },
  {
    id: 'ticket_seed2', commercialId: 'marie-lambert', commercialNom: 'Marie Lambert',
    contactId: 'ce-3', contactNom: 'Hans Müller', contactType: 'Entreprise',
    entrepriseId: '2', entrepriseNom: 'BuildIt Construction',
    startedAt: '2026-08-16T10:05:00.000Z', endedAt: '2026-08-16T10:18:02.000Z', durationSeconds: 782,
    result: 'Intéressé', summary: 'Très intéressé par notre offre de chasse pour le poste de Chef de Chantier.',
    followUpRequired: true, followUpDate: '18/08/2026', followUpTime: '18:00',
    createdAt: '2026-08-16T10:18:02.000Z',
  },
];
