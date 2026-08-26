/**
 * Points d'entrée nommés demandés par le cahier des charges du module
 * Candidats/Performance/Notifications/Profil (§36) : `getCommercialCandidateStats`,
 * `getCommercialPerformance`, `getCommercialNotifications`, `getCommercialProfile`,
 * `getCommercialObjectives`. Pour la plupart, la logique existe déjà ailleurs
 * (`analytics/commercialStats.ts`, `analytics/commercialCandidates.ts`,
 * `data/amud/objectives.ts`) — ce fichier ne fait que les exposer sous les
 * noms attendus au même endroit, pour que les pages n'aient jamais à
 * recalculer un KPI directement dans le JSX.
 */
import type { CallTicket } from '@/data/amud/callTickets';
import type { FollowUp } from '@/data/amud/followups';
import type { Activite } from '@/data/amud/commercialActivites';
import type { Notification } from '@/data/amud/notifications';
import type { Objective } from '@/data/amud/objectives';
import { getObjectiveForCommercial } from '@/data/amud/objectives';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { getProfileSettingsForCommercial, type CommercialProfileSettings } from '@/data/amud/commercialProfileSettings';
import { getCommercialCandidateStats as computeCandidateStats, type CommercialCandidateStats } from './analytics/commercialCandidates';
import { getCommercialStats, type CommercialScope, type CommercialStats } from './analytics/commercialStats';
import type { PeriodRange } from './analytics/period';

export { computeCandidateStats as getCommercialCandidateStats };
export type { CommercialCandidateStats };

/** Alias de `getCommercialStats` (§12-16, tableau de bord Performance). */
export function getCommercialPerformance(activites: Activite[], callTickets: CallTicket[], scope: CommercialScope, range: PeriodRange): CommercialStats {
  return getCommercialStats(activites, callTickets, scope, range);
}

/** Notifications de l'espace commercial, triées récentes d'abord (§17-20). */
export function getCommercialNotifications(all: Notification[]): Notification[] {
  return all.filter((n) => n.scope === 'commercial').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type CommercialProfile = {
  id: string;
  nom: string;
  initiales: string;
  fonction: string;
  dateEntree: string;
  statut: string;
  telephone: string;
  ville: string;
  email: string;
  competences: CommercialProfileSettings['competences'];
  langue: CommercialProfileSettings['langue'];
  notifEmail: boolean;
  notifPush: boolean;
  notifRappels: boolean;
};

/** Fusionne l'identité fixe (`CURRENT_COMMERCIAL`) avec les champs modifiables persistés (§21-26). */
export function getCommercialProfile(settingsAll: CommercialProfileSettings[]): CommercialProfile {
  const settings = getProfileSettingsForCommercial(CURRENT_COMMERCIAL.id, settingsAll);
  return {
    id: CURRENT_COMMERCIAL.id,
    nom: CURRENT_COMMERCIAL.nom,
    initiales: CURRENT_COMMERCIAL.initiales,
    fonction: CURRENT_COMMERCIAL.fonction,
    dateEntree: CURRENT_COMMERCIAL.dateEntree,
    statut: CURRENT_COMMERCIAL.statut,
    telephone: settings?.telephone ?? CURRENT_COMMERCIAL.telephone,
    ville: settings?.ville ?? CURRENT_COMMERCIAL.ville,
    email: settings?.email ?? CURRENT_COMMERCIAL.email,
    competences: settings?.competences ?? [],
    langue: settings?.langue ?? 'Français',
    notifEmail: settings?.notifEmail ?? true,
    notifPush: settings?.notifPush ?? true,
    notifRappels: settings?.notifRappels ?? true,
  };
}

/** Objectifs attribués au commercial connecté — lecture seule, gérés par l'Admin (§24). */
export function getCommercialObjectives(objectivesAll: Objective[]): Objective | undefined {
  return getObjectiveForCommercial(CURRENT_COMMERCIAL.id, objectivesAll);
}
