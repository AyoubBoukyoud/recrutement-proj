'use client';

// Point d'accès unique au dossier candidat réel (Laravel), partagé entre le
// layout candidat (garde-fou de complétude), le tableau de bord et l'assistant
// de création de profil — les trois lisent la même requête react-query,
// invalidée après chaque écriture, plutôt que trois copies qui pourraient
// diverger.

import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { candidateProfileRepository } from '@/data/candidateProfile';
import type { CandidateProfileData } from '@/lib/candidateProfile';

export const CANDIDATE_PROFILE_QUERY_KEY = ['candidate-profile'] as const;

export function useCandidateProfile(): UseQueryResult<CandidateProfileData> {
  const { token } = useAuth();

  return useQuery({
    queryKey: CANDIDATE_PROFILE_QUERY_KEY,
    queryFn: () => candidateProfileRepository.get(token as string),
    enabled: Boolean(token),
  });
}

export function useInvalidateCandidateProfile(): () => Promise<void> {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CANDIDATE_PROFILE_QUERY_KEY });
}
