import type { Candidate } from '@/data/amud/candidates';
import type { CallTicket } from '@/data/amud/callTickets';
import type { FollowUp } from '@/data/amud/followups';
import { parseAnyDate } from './period';

export type CommercialCandidateStats = {
  total: number;
  actifs: number;
  nouveaux: number;
  contactes: number;
  interesses: number;
  aRappeler: number;
  rdvProgrammes: number;
};

/**
 * KPI candidats du commercial (cahier des charges §3) — `candidates` doit
 * déjà être scopé "mes candidats" par l'appelant (`getCandidatesForCommercial`),
 * `callTickets`/`followups` déjà scopés par `commercialId`, même convention
 * que `getCommercialStats` (`commercialStats.ts`). Reste pure, sans logique
 * de scope elle-même.
 */
export function getCommercialCandidateStats(candidates: Candidate[], callTickets: CallTicket[], followups: FollowUp[]): CommercialCandidateStats {
  const candidateIds = new Set(candidates.map((c) => c.id));
  const candidateTickets = callTickets.filter((t) => t.contactType === 'Candidat' && candidateIds.has(t.contactId));
  const contactedIds = new Set(candidateTickets.map((t) => t.contactId));
  const interestedIds = new Set(candidateTickets.filter((t) => t.result === 'Intéressé' || t.result === 'Rendez-vous fixé').map((t) => t.contactId));
  const rappelIds = new Set(
    followups.filter((f) => f.status === 'Planifiée' && f.contactType === 'Candidat' && f.contactId && candidateIds.has(f.contactId)).map((f) => f.contactId as string),
  );

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const nouveaux = candidates.filter((c) => {
    const d = parseAnyDate(c.creeLe);
    return !!d && d >= sevenDaysAgo && d <= now;
  }).length;

  return {
    total: candidates.length,
    actifs: candidates.filter((c) => c.statut === 'Actif').length,
    nouveaux,
    contactes: contactedIds.size,
    interesses: interestedIds.size,
    aRappeler: rappelIds.size,
    rdvProgrammes: candidateTickets.filter((t) => t.result === 'Rendez-vous fixé').length,
  };
}
