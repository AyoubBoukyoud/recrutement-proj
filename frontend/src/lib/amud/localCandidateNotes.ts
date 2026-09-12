'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CandidateNote } from '@/data/amud/candidateNotes';

const collection = createCollection<CandidateNote>(AMUD_KEYS.candidateNotes);

export function loadLocalCandidateNotes(): CandidateNote[] {
  return collection.getAll();
}

export function addLocalCandidateNote(n: CandidateNote) {
  collection.add(n);
}

export { collection as candidateNotesCollection };
