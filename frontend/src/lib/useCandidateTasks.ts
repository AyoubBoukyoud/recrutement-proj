'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { candidateTasksRepository } from '@/data/candidateTasks';
import type { UpdateAssignmentInput } from '@/lib/candidateTasks';

export const CANDIDATE_TASKS_QUERY_KEY = ['candidate-tasks'] as const;

export function useCandidateTasks() {
  const { token } = useAuth();
  return useQuery({ queryKey: CANDIDATE_TASKS_QUERY_KEY, queryFn: () => candidateTasksRepository.list(token as string), enabled: Boolean(token) });
}

export function useUpdateCandidateTask() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateAssignmentInput }) => candidateTasksRepository.update(id, input, token as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CANDIDATE_TASKS_QUERY_KEY }),
  });
}
