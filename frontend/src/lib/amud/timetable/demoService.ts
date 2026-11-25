import { ApiError } from '@/lib/api';
import type { CENTER_DEMO } from '@/data/amud/centerDemoFactory';
import type { Availability, ResourceKind, SessionDraft, TimetableCenter, TimetableResources, TimetableSession, timetableService } from '../services/timetableService';
import { minutes, clockTime } from './calendar';

const KEY = 'amud_training_demo:timetable';
type DemoCenter = TimetableCenter & { resources: TimetableResources; sessions: TimetableSession[] };
type Store = { centers: DemoCenter[] };

function read(): Store {
  const raw = localStorage.getItem(KEY);
  if (!raw) throw new ApiError(422, 'Activez les données de démonstration pour préparer le planning.');
  return JSON.parse(raw) as Store;
}
function write(store: Store) { localStorage.setItem(KEY, JSON.stringify(store)); }
function find(store: Store, id: number) {
  const center = store.centers.find((item) => item.id === id);
  if (!center) throw new ApiError(404, 'Centre de démonstration introuvable.');
  return center;
}

export function seedDemoTimetable(data: typeof CENTER_DEMO) {
  if (localStorage.getItem(KEY)) return;
  const centers = data.centres.map((center, ci): DemoCenter => {
    const teachers = data.teachers.filter((item) => item.centerId === center.id);
    const modules = data.formations.filter((item) => item.centerId === center.id);
    const groups = data.groups.filter((item) => item.centerId === center.id);
    const rooms = [...new Set(groups.map((item) => item.salle))];
    return {
      id: ci + 1, name: center.nom, can_manage: true,
      resources: {
        teachers: teachers.map((item, i) => ({ id: i + 1, name: `${item.prenom} ${item.nom}` })),
        modules: modules.map((item, i) => ({ id: i + 1, name: item.nom })),
        groups: groups.map((item, i) => ({ id: i + 1, name: item.nom })),
        rooms: rooms.map((name, i) => ({ id: i + 1, name })),
      },
      sessions: data.schedules.filter((item) => item.centerId === center.id).map((item, i) => ({
        id: i + 1, center_id: ci + 1, version: 1, request_key: `demo-${ci}-${i}`,
        teacher_id: teachers.findIndex((row) => row.id === item.enseignantId) + 1,
        module_id: modules.findIndex((row) => row.id === item.formationId) + 1,
        group_id: groups.findIndex((row) => row.id === item.groupId) + 1,
        room_id: rooms.indexOf(item.salle) + 1,
        date: item.date, start_time: item.heureDebut, end_time: item.heureFin,
      })),
    };
  });
  write({ centers });
}

const fields: Record<ResourceKind, keyof Pick<SessionDraft, 'teacher_id' | 'module_id' | 'group_id' | 'room_id'>> = {
  teachers: 'teacher_id', modules: 'module_id', groups: 'group_id', rooms: 'room_id',
};
function validate(center: DemoCenter, draft: SessionDraft) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.start_time) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.end_time) || draft.start_time >= draft.end_time) {
    throw new ApiError(422, 'Vérifiez la date et les horaires du cours.');
  }
  for (const kind of Object.keys(fields) as ResourceKind[]) {
    if (!center.resources[kind].some((row) => row.id === draft[fields[kind]])) throw new ApiError(422, 'Sélectionnez toutes les ressources du cours.');
  }
}
function conflicts(center: DemoCenter, draft: SessionDraft, excludeId?: number): Availability['conflicts'] {
  return center.sessions.filter((item) => item.id !== excludeId && item.date === draft.date && item.start_time < draft.end_time && item.end_time > draft.start_time)
    .flatMap((item) => (['teachers', 'groups', 'rooms'] as ResourceKind[])
      .filter((kind) => item[fields[kind]] === draft[fields[kind]])
      .map((kind) => ({ type: kind, session_id: item.id, message: `${center.resources[kind].find((row) => row.id === item[fields[kind]])?.name} est déjà occupé(e) de ${item.start_time} à ${item.end_time}.` })));
}
function availability(center: DemoCenter, draft: SessionDraft, excludeId?: number): Availability {
  validate(center, draft);
  const blocked = conflicts(center, draft, excludeId);
  const alternatives: Availability['alternatives'] = [];
  if (blocked.length) {
    const duration = minutes(draft.end_time) - minutes(draft.start_time);
    for (let start = 8 * 60; start + duration <= 22 * 60 && alternatives.length < 3; start += 30) {
      const range = { date: draft.date, start_time: clockTime(start), end_time: clockTime(start + duration) };
      if (!conflicts(center, { ...draft, ...range }, excludeId).length) alternatives.push(range);
    }
  }
  return { available: blocked.length === 0, conflicts: blocked, alternatives };
}
function currentSession(center: DemoCenter, session: TimetableSession) {
  const existing = center.sessions.find((item) => item.id === session.id);
  if (!existing || existing.version !== session.version) throw new ApiError(409, 'Ce cours a changé. Actualisez le planning.');
  return existing;
}

/** Same UI contract as the API, with no network calls or authentication changes. */
export const demoTimetableService: typeof timetableService = {
  centers: async () => ({ centers: read().centers.map(({ id, name, can_manage }) => ({ id, name, can_manage })), timezone: 'Africa/Casablanca' }),
  resources: async (_token, id) => find(read(), id).resources,
  sessions: async (_token, id, from, to) => ({ sessions: find(read(), id).sessions.filter((item) => item.date >= from && item.date <= to) }),
  availability: async (_token, id, draft, excludeId) => availability(find(read(), id), draft, excludeId),
  save: async (_token, id, draft, requestKey, session) => {
    const store = read(); const center = find(store, id);
    if (session) currentSession(center, session);
    else {
      const existing = center.sessions.find((item) => item.request_key === requestKey);
      if (existing) return existing;
    }
    const result = availability(center, draft, session?.id);
    if (!result.available) throw new ApiError(422, 'Ce créneau est déjà occupé.', result);
    const saved: TimetableSession = { ...draft, id: session?.id ?? Math.max(0, ...center.sessions.map((item) => item.id)) + 1, center_id: id, version: (session?.version ?? 0) + 1, request_key: requestKey };
    center.sessions = [...center.sessions.filter((item) => item.id !== saved.id), saved];
    write(store); return saved;
  },
  remove: async (_token, id, session) => {
    const store = read(); const center = find(store, id); currentSession(center, session);
    center.sessions = center.sessions.filter((item) => item.id !== session.id); write(store);
  },
  saveResource: async (_token, id, kind, name, resourceId) => {
    const store = read(); const center = find(store, id); const rows = center.resources[kind];
    const normalized = name.trim();
    if (!normalized || rows.some((row) => row.id !== resourceId && row.name.toLocaleLowerCase('fr') === normalized.toLocaleLowerCase('fr'))) throw new ApiError(422, 'Choisissez un nom unique et non vide.');
    if (resourceId && !rows.some((row) => row.id === resourceId)) throw new ApiError(404, 'Ressource introuvable.');
    const resource = { id: resourceId ?? Math.max(0, ...rows.map((row) => row.id)) + 1, name: normalized };
    center.resources[kind] = [...rows.filter((row) => row.id !== resource.id), resource]; write(store); return resource;
  },
  removeResource: async (_token, id, kind, resourceId) => {
    const store = read(); const center = find(store, id);
    if (center.sessions.some((item) => item[fields[kind]] === resourceId)) throw new ApiError(422, 'Cette ressource est utilisée par un cours.');
    center.resources[kind] = center.resources[kind].filter((row) => row.id !== resourceId); write(store);
  },
};
