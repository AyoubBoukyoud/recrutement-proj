'use client';

import { useEffect, useState } from 'react';
import { candidateAccountsCollection } from './localCandidateAccounts';
import { useCollection } from './storage/useCollection';
import { getCandidateSession, subscribeCandidateSession } from './candidateSession';
import type { CandidateAccount } from '@/data/amud/candidateAccount';

/**
 * Identité "connectée" du module candidat — combine la session
 * (`candidateSession.ts`) et la collection `CandidateAccount` pour renvoyer
 * le profil à jour, y compris quand il est modifié depuis un autre écran
 * (édition de profil dans un onglet, etc.).
 */
export function useCurrentCandidate(): { candidate: CandidateAccount | null; loading: boolean } {
  const [candidateAccountId, setCandidateAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts] = useCollection(candidateAccountsCollection, []);

  useEffect(() => {
    const sync = () => setCandidateAccountId(getCandidateSession()?.candidateAccountId ?? null);
    sync();
    setLoading(false);
    return subscribeCandidateSession(sync);
  }, []);

  const candidate = candidateAccountId ? accounts.find((a) => a.id === candidateAccountId) ?? null : null;
  return { candidate, loading };
}
