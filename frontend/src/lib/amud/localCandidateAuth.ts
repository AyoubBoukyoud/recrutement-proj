'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';

/**
 * Identifiants de connexion mock du module candidat. Mot de passe stocké en
 * clair dans localStorage — acceptable uniquement parce qu'il s'agit d'un
 * prototype frontend sans backend ni donnée réelle (§ "frontend only" du
 * cahier des charges). Ne jamais reproduire ce pattern côté application réelle.
 */
export type CandidateAuthAccount = {
  id: string;
  candidateAccountId: string;
  email: string;
  password: string;
  createdAt: string;
};

export const candidateAuthCollection = createCollection<CandidateAuthAccount>(AMUD_KEYS.candidateAuth);

export function loadLocalCandidateAuth(): CandidateAuthAccount[] {
  return candidateAuthCollection.getAll();
}

export function findCandidateAuthByEmail(email: string): CandidateAuthAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return candidateAuthCollection.getAll().find((a) => a.email.trim().toLowerCase() === normalized);
}
