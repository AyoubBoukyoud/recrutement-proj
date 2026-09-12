// Le « stage quotidien » du candidat : les activités que l'administration lui
// assigne depuis le catalogue `/admin/stage`, et le fait de les cocher.
//
// Contrat réel du back — `CandidateTaskController` (index + update). Les
// champs suivent la table `task_assignments` ; `is_overdue` est un attribut
// calculé côté modèle (`#[Appends]`), pas une colonne.

import { apiGet, apiPatch } from '@/lib/api';

export type TaskCategory = 'language' | 'documents' | 'culture' | 'admin' | 'other';
export type TaskAssignmentStatus = 'assigned' | 'completed' | 'skipped';

export interface CandidateTask {
  id: number;
  title: string;
  description: string | null;
  category: TaskCategory;
  estimated_minutes: number;
}

export interface TaskAssignment {
  id: number;
  task_id: number;
  /** Le jour où l'activité est due (date, pas horodatage — l'engagement se mesure par jour). */
  assigned_for: string;
  status: TaskAssignmentStatus;
  completed_at: string | null;
  minutes_spent: number | null;
  candidate_note: string | null;
  admin_feedback: string | null;
  /** Attribut calculé : encore ouverte alors que son jour est passé. */
  is_overdue: boolean;
  task?: CandidateTask;
}

/**
 * Bloc d'engagement renvoyé par l'API. C'est lui qui porte la série en cours
 * et le taux de complétion — les deux chiffres que `/lecon-jour` affichait
 * jusqu'ici en dur.
 */
export interface TaskEngagement {
  assigned: number;
  completed: number;
  completion_rate: number | null;
  overdue: number;
  minutes_last_7_days: number;
  daily_target_minutes: number;
  streak_days: number;
  active_today: boolean;
  last_activity_on: string | null;
}

export interface CandidateTasksResponse {
  today: TaskAssignment[];
  /** Borné à 14 jours côté back : une liste de soixante activités ratées fait abandonner. */
  overdue: TaskAssignment[];
  upcoming: TaskAssignment[];
  recently_completed: TaskAssignment[];
  engagement: TaskEngagement;
}

export interface UpdateAssignmentInput {
  status: TaskAssignmentStatus;
  minutes_spent?: number | null;
  candidate_note?: string | null;
}

export function listCandidateTasks(token: string): Promise<CandidateTasksResponse> {
  return apiGet<CandidateTasksResponse>('/candidate/tasks', token);
}

export function updateTaskAssignment(
  id: number,
  input: UpdateAssignmentInput,
  token: string,
): Promise<TaskAssignment> {
  return apiPatch<TaskAssignment>(`/candidate/tasks/${id}`, input, token);
}
