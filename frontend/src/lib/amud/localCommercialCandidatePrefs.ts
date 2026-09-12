'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import { generateId } from './storage/ids';
import type { CommercialCandidatePref, PrioriteCandidat } from '@/data/amud/commercialCandidatePrefs';
import { DEFAULT_CANDIDATE_PREF } from '@/data/amud/commercialCandidatePrefs';

const collection = createCollection<CommercialCandidatePref>(AMUD_KEYS.commercialCandidatePrefs);

/** Crée ou met à jour la ligne `(commercialId, candidateId)` — upsert, jamais de doublon. */
export function upsertCommercialCandidatePref(
  commercialId: string,
  candidateId: string,
  patch: Partial<Pick<CommercialCandidatePref, 'favori' | 'priorite'>>,
  all: CommercialCandidatePref[],
): CommercialCandidatePref {
  const existing = all.find((p) => p.commercialId === commercialId && p.candidateId === candidateId);
  const now = new Date().toISOString();
  if (existing) {
    const updated = collection.update(existing.id, { ...patch, updatedAt: now });
    return updated ?? existing;
  }
  return collection.add({
    id: generateId('ccp'),
    commercialId,
    candidateId,
    favori: patch.favori ?? DEFAULT_CANDIDATE_PREF.favori,
    priorite: patch.priorite ?? DEFAULT_CANDIDATE_PREF.priorite,
    updatedAt: now,
  });
}

export function toggleCommercialCandidateFavorite(commercialId: string, candidateId: string, all: CommercialCandidatePref[]): { favori: boolean } {
  const existing = all.find((p) => p.commercialId === commercialId && p.candidateId === candidateId);
  const nextFavori = !(existing?.favori ?? DEFAULT_CANDIDATE_PREF.favori);
  upsertCommercialCandidatePref(commercialId, candidateId, { favori: nextFavori }, all);
  return { favori: nextFavori };
}

export function setCommercialCandidatePriority(commercialId: string, candidateId: string, priorite: PrioriteCandidat, all: CommercialCandidatePref[]) {
  upsertCommercialCandidatePref(commercialId, candidateId, { priorite }, all);
}

export { collection as commercialCandidatePrefsCollection };
