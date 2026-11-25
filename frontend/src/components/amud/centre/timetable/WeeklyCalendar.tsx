'use client';

import { memo, useMemo, useRef, useState, type PointerEvent } from 'react';
import type { SessionDraft, TimetableResources, TimetableSession } from '@/lib/amud/services/timetableService';
import { CalendarSlots, CalendarSessions } from './CalendarDay';
import { DAY_NAMES, clockTime, formatDate, layoutSessions, minutes } from '@/lib/amud/timetable/calendar';

/** Monday-based weekday index of a date-only ISO string. */
const weekdayOf = (iso: string) => (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7;

type Range = Pick<SessionDraft, 'date' | 'start_time' | 'end_time'>;
type Gesture = { mode: 'select' | 'move' | 'resize'; date: string; anchor: number; start: number; end: number; session?: TimetableSession; offset: number; pointerId: number; originX: number; originY: number; moved: boolean };


export const WeeklyCalendar = memo(function WeeklyCalendar({ days, sessions, resources, interval, colorBy, allowed, busy, today, onSelect, onOpen, onChange }: {
  /** One column per date: seven for the week view, one for the day view. */
  days: string[]; sessions: TimetableSession[]; resources: TimetableResources; interval: 30 | 60; colorBy: 'module' | 'group'; allowed: boolean; busy: boolean; today: string;
  onSelect: (range: Range) => void; onOpen: (session: TimetableSession) => void; onChange: (session: TimetableSession, range: Range) => void;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [preview, setPreview] = useState<Gesture | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // The view expands to include every existing session, including early/late courses.
  const start = Math.min(8 * 60, ...sessions.map((session) => Math.floor(minutes(session.start_time) / 60) * 60));
  const end = Math.max(22 * 60, ...sessions.map((session) => Math.ceil(minutes(session.end_time) / 60) * 60));
  const rowHeight = interval === 30 ? 36 : 64;
  const slots = useMemo(() => Array.from({ length: Math.ceil((end - start) / interval) }, (_, index) => start + index * interval), [start, end, interval]);
  const height = slots.length * rowHeight;
  const byDay = useMemo(() => new Map(days.map((day) => [day, layoutSessions(sessions.filter((session) => session.date === day))])), [days, sessions]);
  const names = useMemo(() => ({ teachers: new Map(resources.teachers.map((item) => [item.id, item.name])), modules: new Map(resources.modules.map((item) => [item.id, item.name])), groups: new Map(resources.groups.map((item) => [item.id, item.name])), rooms: new Map(resources.rooms.map((item) => [item.id, item.name])) }), [resources]);
  const topOf = (value: number) => (value - start) / interval * rowHeight;

  function point(event: PointerEvent<HTMLDivElement>) {
    const columns = grid.current?.querySelectorAll<HTMLElement>('[data-calendar-day]');
    const column = Array.from(columns ?? []).find((element) => { const bounds = element.getBoundingClientRect(); return event.clientX >= bounds.left && event.clientX < bounds.right; });
    if (!column) return null;
    const bounds = column.getBoundingClientRect();
    return { date: column.dataset.calendarDay!, time: Math.max(start, Math.min(end - interval, start + Math.floor((event.clientY - bounds.top) / rowHeight) * interval)) };
  }
  function begin(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || busy || gesture.current) return;
    const target = event.target as HTMLElement;
    const sessionElement = target.closest<HTMLElement>('[data-session-id]');
    const session = sessions.find((item) => item.id === Number(sessionElement?.dataset.sessionId));
    if (!allowed) return;
    const location = point(event);
    if (!location) return;
    const mode = session ? (target.closest('[data-resize]') ? 'resize' : 'move') : 'select';
    const action: Gesture = { mode, date: location.date, anchor: location.time, start: session ? minutes(session.start_time) : location.time, end: session ? minutes(session.end_time) : Math.min(1439, location.time + interval), session, offset: session ? location.time - minutes(session.start_time) : 0, pointerId: event.pointerId, originX: event.clientX, originY: event.clientY, moved: false };
    gesture.current = action;
    setPreview(action);
    event.currentTarget.setPointerCapture(event.pointerId);
    // Keep native scrolling for touch selection; session handles opt into dragging.
    if (event.pointerType === 'mouse') event.preventDefault();
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const location = point(event);
    if (!location) return;
    const moved = current.moved || Math.hypot(event.clientX - current.originX, event.clientY - current.originY) > 5;
    let next = { ...current, moved };
    if (current.mode === 'select') {
      next = { ...next, start: Math.min(current.anchor, location.time), end: Math.max(current.anchor, location.time) + interval };
    } else if (current.mode === 'resize') {
      if (location.date !== current.session!.date) return;
      next.end = Math.max(current.start + 1, Math.min(1439, location.time + interval));
    } else {
      const duration = minutes(current.session!.end_time) - minutes(current.session!.start_time);
      const nextStart = Math.max(start, Math.min(1439 - duration, location.time - current.offset));
      next = { ...next, date: location.date, start: nextStart, end: nextStart + duration };
    }
    if (next.end === 1440) next.end = 1439;
    gesture.current = next;
    if (next.date !== current.date || next.start !== current.start || next.end !== current.end || moved !== current.moved) setPreview(next);
  }
  function finish(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    gesture.current = null; setPreview(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const range = { date: current.date, start_time: clockTime(current.start), end_time: clockTime(current.end) };
    if (current.mode === 'select') onSelect(range);
    else if (!current.moved) onOpen(current.session!);
    else if (range.date !== current.session!.date || range.start_time !== current.session!.start_time || range.end_time !== current.session!.end_time) {
      setAnnouncement(`Déplacement proposé : ${range.date}, ${range.start_time} à ${range.end_time}.`);
      onChange(current.session!, range);
    }
  }
  function cancel() { gesture.current = null; setPreview(null); }

  return <div className="max-h-[72vh] overflow-auto rounded-xl border border-amud-outline-variant bg-amud-surface" aria-busy={busy}>
    <p className="sr-only" aria-live="polite">{announcement}</p>
    <div className={days.length > 1 ? 'min-w-[1050px]' : ''}>
      <div className="sticky top-0 z-20 grid border-b border-amud-outline-variant bg-amud-surface shadow-sm" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div className="p-2 text-[10px] text-amud-on-surface-variant">Heure<br />Casablanca</div>
        {days.map((day) => <div key={day} className={`border-l border-amud-outline-variant px-2 py-3 text-center ${day === today ? 'bg-amud-primary/10 text-amud-primary' : ''}`}><p className="text-label-md font-semibold">{DAY_NAMES[weekdayOf(day)]}</p><p className="text-label-sm text-amud-on-surface-variant">{formatDate(day)}</p></div>)}
      </div>
      <div ref={grid} data-calendar-grid className="grid select-none" role="group" aria-label={days.length > 1 ? 'Emploi du temps hebdomadaire' : 'Emploi du temps du jour'} style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}
        onPointerDown={begin} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel}
        onKeyDown={(event) => { if (event.key === 'Escape') cancel(); }}
        onFocusCapture={(event) => {
          const target = event.target;
          if (!(target instanceof HTMLButtonElement) || !target.hasAttribute('data-slot')) return;
          const previous = grid.current?.querySelector<HTMLButtonElement>('[data-slot][tabindex="0"]');
          if (previous && previous !== target) previous.tabIndex = -1;
          target.tabIndex = 0;
        }}>

        <div className="relative bg-amud-surface-container-low" style={{ height }} aria-hidden="true">{slots.map((time) => <div key={time} className="absolute right-2 text-label-sm text-amud-on-surface-variant" style={{ top: topOf(time) + 3 }}>{clockTime(time)}</div>)}</div>
        {days.map((day, dayIndex) => <div key={day} data-calendar-day={day} className={`relative border-l border-amud-outline-variant ${day === today ? 'bg-amud-primary/[0.025]' : ''}`} style={{ height, touchAction: 'pan-y' }}>
          <CalendarSlots day={day} dayIndex={dayIndex} dayName={DAY_NAMES[weekdayOf(day)]} columns={days.length} slots={slots} start={start} interval={interval} rowHeight={rowHeight} allowed={allowed} busy={busy} onSelect={onSelect} />
          <CalendarSessions entries={byDay.get(day)!} names={names} start={start} interval={interval} rowHeight={rowHeight} colorBy={colorBy} allowed={allowed} busy={busy} onOpen={onOpen} />
          {preview && preview.date === day && <div className="pointer-events-none absolute inset-x-1 z-30 rounded-md border-2 border-amud-primary bg-amud-primary/20 px-2 py-1 text-[11px] font-semibold text-amud-primary" style={{ backgroundColor: 'color-mix(in srgb, var(--amud-primary) 20%, transparent)', top: topOf(preview.start), height: Math.max(22, (preview.end - preview.start) / interval * rowHeight) }}>{clockTime(preview.start)}–{clockTime(preview.end)}</div>}
        </div>)}
      </div>
    </div>
  </div>;
});
