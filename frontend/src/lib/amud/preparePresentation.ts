'use client';

import { initAmudDemoData } from './storage/init';
import { candidateAccountsCollection } from './localCandidateAccounts';
import { candidateDocumentsCollection } from './localCandidateDocuments';
import { candidateOfferFavoritesCollection } from './localCandidateOfferFavorites';
import { presentationCandidate, presentationDocuments, presentationFavorites } from '@/data/amud/presentationCandidate';
import { setCandidateSession } from './candidateSession';
import { createCollection, type Collection, type Entity } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Notification } from '@/data/amud/notifications';

function addMissing<T extends Entity>(collection: Collection<T>, rows: T[]) {
  const current = collection.getAll();
  const ids = new Set(current.map((item) => item.id));
  const missing = rows.filter((row) => !ids.has(row.id));
  if (missing.length) collection.replace([...current, ...missing]);
}

/** Idempotent; retains presentation edits and never touches auth/API storage. */
export function preparePresentation() {
  initAmudDemoData();
  // Also upgrades browsers that already had empty candidate collections.
  addMissing(candidateAccountsCollection, [presentationCandidate]);
  addMissing(candidateDocumentsCollection, presentationDocuments);
  addMissing(candidateOfferFavoritesCollection, presentationFavorites);
  addMissing(createCollection<Notification>(AMUD_KEYS.notifications), [{
    id: 'demo_candidate_interview', scope: 'candidate', targetId: presentationCandidate.id,
    title: 'TechCorp souhaite vous rencontrer pour un entretien technique.',
    category: 'Entretiens', href: '/amud/candidat/entretiens', read: false,
    createdAt: new Date().toISOString(),
  }]);
}

export function selectPresentationCandidate() {
  setCandidateSession(presentationCandidate.id);
}
