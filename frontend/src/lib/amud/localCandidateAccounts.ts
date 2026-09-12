'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CandidateAccount } from '@/data/amud/candidateAccount';

export const candidateAccountsCollection = createCollection<CandidateAccount>(AMUD_KEYS.candidateAccounts);

export function loadLocalCandidateAccounts(): CandidateAccount[] {
  return candidateAccountsCollection.getAll();
}
