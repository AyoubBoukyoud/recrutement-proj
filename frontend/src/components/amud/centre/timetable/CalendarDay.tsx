'use client';

import { memo } from 'react';
import type { SessionDraft, TimetableResources, TimetableSession } from '@/lib/amud/services/timetableService';
import { DAY_NAMES, clockTime, minutes, type layoutSessions } from '@/lib/amud/timetable/calendar';

type Range = Pick<SessionDraft, 'date' | 'start_time' | 'end_time'>;
type Names = { [Key in keyof TimetableResources]: Map<number, string> };

const COLORS = ['border-l-rose-600 bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-100', 'border-l-teal-600 bg-teal-100 text-teal-950 dark:bg-teal-950 dark:text-teal-100', 'border-l-amber-600 bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100', 'border-l-sky-600 bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-100', 'border-l-violet-600 bg-violet-100 text-violet-950 dark:bg-violet-950 dark:text-violet-100'];

/** Slot buttons and event blocks do not rerender for a drag-preview update. */
export const CalendarSlots = memo(function CalendarSlots({ day, dayIndex, slots, start, interval, rowHeight, allowed, busy, onSelect }: {
  day: string; dayIndex: number; slots: number[]; start: number; interval: number; rowHeight: number; allowed: boolean; busy: boolean; onSelect: (range: Range) => void;
}) {
  const topOf = (value: number) => (value - start) / interval * rowHeight;
  return <>{slots.map((time, slotIndex) => <button key={time} type="button" data-slot={slotIndex} data-day-index={dayIndex} aria-label={`${DAY_NAMES[dayIndex]} ${day}, ${clockTime(time)}–${clockTime(Math.min(1439, time + interval))}, ajouter un cours`}
            tabIndex={dayIndex === 0 && slotIndex === 0 ? 0 : -1} disabled={!allowed || busy}
            onClick={(event) => { if (event.detail === 0) onSelect({ date: day, start_time: clockTime(time), end_time: clockTime(Math.min(1439, time + interval)) }); }}
            onKeyDown={(event) => {
              const directions: Record<string, [number, number]> = { ArrowDown: [0, 1], ArrowUp: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
              if (directions[event.key]) { event.preventDefault(); const [dx, dy] = directions[event.key]; event.currentTarget.closest('[data-calendar-grid]')?.querySelector<HTMLButtonElement>(`[data-day-index="${Math.max(0, Math.min(6, dayIndex + dx))}"][data-slot="${Math.max(0, Math.min(slots.length - 1, slotIndex + dy))}"]`)?.focus(); }
            }}
            className={`absolute left-0 w-full border-t text-left transition-colors hover:bg-amud-primary/10 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amud-primary ${time % 60 ? 'border-dashed border-amud-outline-variant/50' : 'border-amud-outline-variant/70'}`} style={{ top: topOf(time), height: rowHeight }} />)}</>;
});

export const CalendarSessions = memo(function CalendarSessions({ entries, names, start, interval, rowHeight, colorBy, allowed, busy, onOpen }: {
  entries: ReturnType<typeof layoutSessions>; names: Names; start: number; interval: number; rowHeight: number; colorBy: 'module' | 'group'; allowed: boolean; busy: boolean; onOpen: (session: TimetableSession) => void;
}) {
  const topOf = (value: number) => (value - start) / interval * rowHeight;
  return <>{entries.map(({ session, column, columns }) => {
            const description = `${names.modules.get(session.module_id)} · ${names.groups.get(session.group_id)} · ${names.teachers.get(session.teacher_id)} · ${names.rooms.get(session.room_id)} · ${session.start_time}–${session.end_time}`;
            return <div key={session.id} className={`absolute z-10 overflow-hidden rounded-md border-l-4 shadow-sm transition-shadow hover:shadow-md focus-within:z-20 focus-within:ring-2 focus-within:ring-amud-primary ${COLORS[(colorBy === 'group' ? session.group_id : session.module_id) % COLORS.length]} ${busy ? 'opacity-60' : ''}`} style={{ top: topOf(minutes(session.start_time)) + 1, height: Math.max(22, (minutes(session.end_time) - minutes(session.start_time)) / interval * rowHeight - 2), left: `calc(${column / columns * 100}% + 3px)`, width: `calc(${100 / columns}% - 6px)` }}>
              <button type="button" data-session-id={session.id} title={description} aria-label={description} disabled={busy} onClick={(event) => { if (!allowed || event.detail === 0) onOpen(session); }} className={`h-full w-full overflow-hidden px-2 pb-2 pt-1 text-left text-[11px] leading-tight ${allowed ? 'cursor-grab active:cursor-grabbing' : ''}`} style={{ touchAction: 'none' }}>
                <span className="block font-semibold">{names.modules.get(session.module_id)}</span><span className="block">{session.start_time}–{session.end_time}</span><span className="block truncate">{names.groups.get(session.group_id)}</span><span className="block truncate">{names.teachers.get(session.teacher_id)}</span><span className="block truncate">{names.rooms.get(session.room_id)}</span>
              </button>
              {allowed && <button type="button" data-session-id={session.id} data-resize aria-label={`Modifier la durée de ${names.modules.get(session.module_id)}`} title="Glisser pour modifier la durée, ou ouvrir pour modifier les horaires" disabled={busy} onClick={(event) => { if (event.detail === 0) onOpen(session); }} className="absolute bottom-0 left-0 h-2 w-full cursor-ns-resize bg-current/10 hover:bg-current/20" style={{ touchAction: 'none' }}><span className="mx-auto block h-0.5 w-5 rounded bg-current/40" /></button>}
            </div>;
          })}</>;
});
