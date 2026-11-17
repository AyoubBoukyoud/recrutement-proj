import { apiDelete, apiGet, apiPost, apiPut, ApiError } from '@/lib/api';

export type TimetableCenter = { id: number; name: string; can_manage: boolean };
export type TimetableResource = { id: number; name: string };
export type ResourceKind = 'teachers' | 'modules' | 'groups' | 'rooms';
export type TimetableResources = Record<ResourceKind, TimetableResource[]>;
export type SessionDraft = {
  teacher_id: number;
  module_id: number;
  group_id: number;
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
};
export type TimetableSession = SessionDraft & { id: number; center_id: number; version: number; request_key: string };
export type Availability = {
  available: boolean;
  conflicts: { type: string; session_id: number; message: string }[];
  alternatives: Pick<SessionDraft, 'date' | 'start_time' | 'end_time'>[];
};
export const RESOURCE_LABELS: Record<ResourceKind, string> = { teachers: 'Professeurs', modules: 'Modules', groups: 'Groupes', rooms: 'Salles' };
export const timetablePath = (centerId: number) => `/timetable/centers/${centerId}`;

export const timetableService = {
  centers: (token: string) => apiGet<{ centers: TimetableCenter[]; timezone: string }>('/timetable/centers', token),
  resources: (token: string, centerId: number) => apiGet<TimetableResources>(`${timetablePath(centerId)}/resources`, token),
  sessions: (token: string, centerId: number, from: string, to: string) => apiGet<{ sessions: TimetableSession[] }>(`${timetablePath(centerId)}/sessions?from=${from}&to=${to}`, token),
  availability: (token: string, centerId: number, draft: SessionDraft, excludeId?: number) => apiPost<Availability>(`${timetablePath(centerId)}/availability`, { ...draft, exclude_id: excludeId }, token),
  save: (token: string, centerId: number, draft: SessionDraft, requestKey: string, session?: TimetableSession) => session
    ? apiPut<TimetableSession>(`${timetablePath(centerId)}/sessions/${session.id}`, { ...draft, version: session.version }, token)
    : apiPost<TimetableSession>(`${timetablePath(centerId)}/sessions`, { ...draft, request_key: requestKey }, token),
  remove: (token: string, centerId: number, session: TimetableSession) => apiDelete<void>(`${timetablePath(centerId)}/sessions/${session.id}`, token, { version: session.version }),
  saveResource: (token: string, centerId: number, kind: ResourceKind, name: string, id?: number) => id
    ? apiPut<TimetableResource>(`${timetablePath(centerId)}/resources/${kind}/${id}`, { name }, token)
    : apiPost<TimetableResource>(`${timetablePath(centerId)}/resources/${kind}`, { name }, token),
  removeResource: (token: string, centerId: number, kind: ResourceKind, id: number) => apiDelete<void>(`${timetablePath(centerId)}/resources/${kind}/${id}`, token),
};

export function timetableError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Une erreur est survenue. Réessayez.';
  if (error.isNetworkFailure) return 'Connexion au serveur impossible. Vérifiez votre connexion puis réessayez.';
  const errors = error.payload.errors as Record<string, string[]> | undefined;
  return errors ? Object.values(errors).flat().join(' ') : error.message;
}
