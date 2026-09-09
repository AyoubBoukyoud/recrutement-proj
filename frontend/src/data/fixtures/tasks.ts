// Fixtures du stage quotidien (maquette uniquement).
//
// Référencées seulement depuis `mockCandidateTasks`, jamais au niveau du
// module : c'est ce qui permet à la condition constante `USE_MOCKS` de les
// éliminer du bundle de production (cf. `npm run verify:no-mocks`).

import type { CandidateTasksResponse, TaskAssignment } from '@/lib/candidateTasks';

function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function assignment(
  id: number,
  offsetDays: number,
  task: TaskAssignment['task'],
  overrides: Partial<TaskAssignment> = {},
): TaskAssignment {
  return {
    id,
    task_id: task!.id,
    assigned_for: isoDay(offsetDays),
    status: 'assigned',
    completed_at: null,
    minutes_spent: null,
    candidate_note: null,
    admin_feedback: null,
    is_overdue: offsetDays < 0,
    task,
    ...overrides,
  };
}

export function buildMockTasks(): CandidateTasksResponse {
  const today = [
    assignment(101, 0, { id: 1, title: 'Réviser 20 mots du vocabulaire hospitalier', description: 'Liste fournie dans l’espace documents. Relire à voix haute.', category: 'language', estimated_minutes: 25 }),
    assignment(102, 0, { id: 2, title: 'Vérifier la validité de votre passeport', description: 'Il doit couvrir au moins 6 mois après la date de départ prévue.', category: 'admin', estimated_minutes: 10 }),
    assignment(103, 0, { id: 3, title: 'Regarder la capsule « Le tutoiement au travail »', description: null, category: 'culture', estimated_minutes: 15 }),
  ];

  const overdue = [
    assignment(98, -2, { id: 4, title: 'Téléverser votre diplôme traduit', description: 'Traduction assermentée exigée par l’employeur allemand.', category: 'documents', estimated_minutes: 20 }),
  ];

  const upcoming = [
    assignment(110, 1, { id: 5, title: 'Écouter un dialogue de prise de poste', description: null, category: 'language', estimated_minutes: 20 }),
  ];

  const recentlyCompleted = [
    assignment(90, -1, { id: 6, title: 'Se présenter en allemand (2 minutes)', description: null, category: 'language', estimated_minutes: 30 }, {
      status: 'completed',
      completed_at: new Date(Date.now() - 86_400_000).toISOString(),
      minutes_spent: 35,
      is_overdue: false,
    }),
    assignment(89, -3, { id: 7, title: 'Compléter votre disponibilité', description: null, category: 'admin', estimated_minutes: 5 }, {
      status: 'completed',
      completed_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      minutes_spent: 4,
      is_overdue: false,
    }),
  ];

  return {
    today,
    overdue,
    upcoming,
    recently_completed: recentlyCompleted,
    engagement: {
      assigned: 12,
      completed: 8,
      completion_rate: 67,
      overdue: overdue.length,
      minutes_last_7_days: 145,
      daily_target_minutes: 60,
      streak_days: 4,
      active_today: false,
      last_activity_on: isoDay(-1),
    },
  };
}
