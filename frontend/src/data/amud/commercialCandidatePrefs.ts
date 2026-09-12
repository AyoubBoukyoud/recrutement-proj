/**
 * Favori/priorité qu'un Commercial attribue à un candidat (cahier des
 * charges §10). Scopée par `(commercialId, candidateId)`, sur le même
 * principe que `CandidateNote` (entreprise, candidateId) — plutôt que
 * d'ajouter `favori`/`priorite` directement sur l'entité `Candidate`
 * partagée avec `/amud/admin` et `/amud/entreprise`, qui n'ont pas cette
 * notion et n'ont pas à en hériter.
 */
export type PrioriteCandidat = 'Basse' | 'Normale' | 'Haute' | 'Urgente';

export type CommercialCandidatePref = {
  id: string;
  commercialId: string;
  candidateId: string;
  favori: boolean;
  priorite: PrioriteCandidat;
  updatedAt: string;
};

export const PRIORITE_CANDIDAT_CLASS: Record<PrioriteCandidat, string> = {
  Basse: 'bg-amud-surface-container-high text-amud-on-surface-variant',
  Normale: 'bg-amud-primary-container text-amud-on-primary-container',
  Haute: 'bg-amud-tertiary-fixed text-amud-tertiary-container',
  Urgente: 'bg-amud-error-container text-amud-on-error-container',
};

export const PRIORITES_CANDIDAT: PrioriteCandidat[] = ['Basse', 'Normale', 'Haute', 'Urgente'];

export const commercialCandidatePrefsSeed: CommercialCandidatePref[] = [
  { id: 'ccp_1', commercialId: 'ahmed-benali', candidateId: 'candidate_karimb', favori: true, priorite: 'Haute', updatedAt: '2026-08-19T09:00:00.000Z' },
  { id: 'ccp_2', commercialId: 'ahmed-benali', candidateId: 'candidate_sophiem', favori: false, priorite: 'Urgente', updatedAt: '2026-08-20T09:00:00.000Z' },
];

export function getPrefForCandidate(
  commercialId: string,
  candidateId: string,
  all: CommercialCandidatePref[] = commercialCandidatePrefsSeed,
): CommercialCandidatePref | undefined {
  return all.find((p) => p.commercialId === commercialId && p.candidateId === candidateId);
}

export const DEFAULT_CANDIDATE_PREF: Pick<CommercialCandidatePref, 'favori' | 'priorite'> = { favori: false, priorite: 'Normale' };
