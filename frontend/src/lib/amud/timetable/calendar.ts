import type { TimetableSession } from '@/lib/amud/services/timetableService';

export const ACADEMIC_TIMEZONE = 'Africa/Casablanca';
export const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function academicToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: ACADEMIC_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// UTC arithmetic on date-only strings avoids browser-zone and DST shifts.
export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function mondayOf(iso: string): string {
  const weekday = new Date(`${iso}T12:00:00Z`).getUTCDay();
  return addDays(iso, -((weekday + 6) % 7));
}
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00Z`));
}
export function minutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}
export function clockTime(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

/** Partition overlapping events into columns, including overlaps across groups. */
export function layoutSessions(sessions: TimetableSession[]): { session: TimetableSession; column: number; columns: number }[] {
  const sorted = [...sessions].sort((a, b) => a.start_time.localeCompare(b.start_time) || b.end_time.localeCompare(a.end_time) || a.id - b.id);
  const result: ReturnType<typeof layoutSessions> = [];
  let cluster: typeof result = [];
  let ends: number[] = [];
  let clusterEnd = -1;
  function flush() {
    cluster.forEach((entry) => { entry.columns = ends.length; });
    result.push(...cluster);
    cluster = [];
    ends = [];
  }
  for (const session of sorted) {
    const start = minutes(session.start_time);
    const end = minutes(session.end_time);
    if (start >= clusterEnd) flush();
    let column = ends.findIndex((value) => value <= start);
    if (column === -1) column = ends.length;
    ends[column] = end;
    cluster.push({ session, column, columns: 1 });
    clusterEnd = Math.max(cluster.length === 1 ? end : clusterEnd, end);
  }
  flush();
  return result;
}
