import type { Offre } from '@/data/amud/offres';
import type { Application } from '@/data/amud/applications';
import type { Candidate } from '@/data/amud/candidates';
import { bucketTimeSeries, comparePeriods, inRange, previousPeriodRange, type PeriodRange, type TrendComparison } from './period';
import { applicationsFunnel, topN } from './aggregate';

export type RecruiterKpis = {
  offresActives: number;
  candidatures: number;
  preselectionnes: number;
  entretiens: number;
  finalistes: number;
  recrutements: number;
  delaiMoyenJours: number;
};

export type RecruiterStats = {
  kpis: RecruiterKpis;
  trends: { candidatures: TrendComparison; recrutements: TrendComparison };
  funnel: { label: string; value: number }[];
  candidaturesParOffre: { label: string; value: number }[];
  candidatsParVille: { label: string; value: number }[];
  topPostesRecherches: { label: string; value: number }[];
  evolutionCandidatures: { label: string; value: number }[];
};

function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

/**
 * Statistiques recruteur (`/amud/entreprise/dashboard` + `.../statistiques`).
 * `offres`/`applications` doivent déjà être filtrées pour l'entreprise
 * courante par l'appelant (mêmes `myOffres`/`myApplications` déjà calculés
 * dans les pages existantes) — cette fonction reste pure, sans logique de
 * scope.
 */
export function getRecruiterStats(offres: Offre[], applications: Application[], candidates: Candidate[], range: PeriodRange): RecruiterStats {
  const candidateById = new Map(candidates.map((c) => [c.id, c]));

  const inCurrent = applications.filter((a) => inRange(a.createdAt, range));
  const previousRange = previousPeriodRange(range);
  const inPrevious = applications.filter((a) => inRange(a.createdAt, previousRange));

  const hires = applications.filter((a) => a.status === 'ACCEPTED');
  const hiresPrevious = inPrevious.filter((a) => a.status === 'ACCEPTED');
  const hiresCurrent = inCurrent.filter((a) => a.status === 'ACCEPTED');

  const kpis: RecruiterKpis = {
    offresActives: offres.filter((o) => o.statut === 'Publiée').length,
    candidatures: applications.length,
    preselectionnes: applications.filter((a) => a.status === 'SCREENING').length,
    entretiens: applications.filter((a) => a.status === 'INTERVIEW').length,
    finalistes: applications.filter((a) => a.status === 'SHORTLIST').length,
    recrutements: hires.length,
    delaiMoyenJours: hires.length > 0 ? Math.round(hires.reduce((sum, a) => sum + daysBetween(a.createdAt, a.updatedAt), 0) / hires.length) : 0,
  };

  const trends = {
    candidatures: comparePeriods(inCurrent.length, inPrevious.length, { positiveIsGood: true }),
    recrutements: comparePeriods(hiresCurrent.length, hiresPrevious.length, { positiveIsGood: true }),
  };

  // Funnel cumulatif : combien de candidatures ont atteint au moins ce stade.
  const funnel = applicationsFunnel(applications);

  const candidaturesParOffre = topN(applications, (a) => a.offerTitre);
  const candidatsParVille = topN(
    applications.filter((a) => candidateById.has(a.candidateId)),
    (a) => candidateById.get(a.candidateId)!.ville,
  );
  const topPostesRecherches = topN(
    applications.filter((a) => candidateById.has(a.candidateId)),
    (a) => candidateById.get(a.candidateId)!.posteRecherche,
  );

  const evolutionCandidatures = bucketTimeSeries(inCurrent, (a) => a.createdAt, range);

  return { kpis, trends, funnel, candidaturesParOffre, candidatsParVille, topPostesRecherches, evolutionCandidatures };
}
