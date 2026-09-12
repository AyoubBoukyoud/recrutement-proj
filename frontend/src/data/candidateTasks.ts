import { listCandidateTasks, updateTaskAssignment, type CandidateTasksResponse, type TaskAssignment, type UpdateAssignmentInput } from '@/lib/candidateTasks';
import { fakeLatency, USE_MOCKS } from './config';

export interface CandidateTasksRepository {
  list(token: string): Promise<CandidateTasksResponse>;
  update(id: number, input: UpdateAssignmentInput, token: string): Promise<TaskAssignment>;
}

const httpCandidateTasks: CandidateTasksRepository = { list: listCandidateTasks, update: updateTaskAssignment };
let mockState: CandidateTasksResponse | null = null;

async function mockData(): Promise<CandidateTasksResponse> {
  if (mockState === null) {
    const { buildMockTasks } = await import('./fixtures/tasks');
    mockState = buildMockTasks();
  }
  return mockState;
}

const mockCandidateTasks: CandidateTasksRepository = {
  async list() { return fakeLatency(structuredClone(await mockData())); },
  async update(id, input) {
    const state = await mockData();
    const assignment = [state.today, state.overdue, state.upcoming, state.recently_completed].flat().find((item) => item.id === id);
    if (!assignment) throw new Error('Task assignment not found');
    assignment.status = input.status;
    assignment.minutes_spent = input.minutes_spent ?? assignment.minutes_spent;
    assignment.candidate_note = input.candidate_note ?? assignment.candidate_note;
    assignment.completed_at = input.status === 'completed' ? new Date().toISOString() : null;
    if (input.status === 'completed') {
      state.today = state.today.filter((item) => item.id !== id);
      state.overdue = state.overdue.filter((item) => item.id !== id);
      state.upcoming = state.upcoming.filter((item) => item.id !== id);
      assignment.is_overdue = false;
      state.recently_completed = [assignment, ...state.recently_completed.filter((item) => item.id !== id)].slice(0, 5);
      state.engagement.completed += 1;
      state.engagement.overdue = state.overdue.length;
      state.engagement.active_today = true;
      state.engagement.completion_rate = state.engagement.assigned === 0 ? null : Math.round((state.engagement.completed / state.engagement.assigned) * 100);
    }
    return fakeLatency(structuredClone(assignment), 220);
  },
};

export const candidateTasksRepository = USE_MOCKS ? mockCandidateTasks : httpCandidateTasks;
