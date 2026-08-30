'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CandidateDocument } from '@/data/amud/candidateDocuments';

export const candidateDocumentsCollection = createCollection<CandidateDocument>(AMUD_KEYS.candidateDocuments);

export function loadLocalCandidateDocuments(): CandidateDocument[] {
  return candidateDocumentsCollection.getAll();
}
