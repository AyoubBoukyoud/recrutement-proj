'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Badge, Button, EmptyState, ErrorState, LoadingState, Modal, SearchInput, SegmentedControl } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { ApiError } from '@/lib/api';
import { timetableError, type Availability, type SessionDraft, type TimetableSession } from '@/lib/amud/services/timetableService';
import { useRefreshTimetable, useTimetableResources, useTimetableScope, useTimetableSessions } from '@/lib/amud/timetable/useTimetable';
import { academicToday, addDays, formatDate, mondayOf, minutes } from '@/lib/amud/timetable/calendar';
import { readQueryParam } from '@/components/amud/centre/training/shared';
import { WeeklyCalendar } from './WeeklyCalendar';
const SessionAssignmentForm = dynamic(() => import('./SessionAssignmentForm').then((module) => module.SessionAssignmentForm), { loading: () => <LoadingState label="Ouverture du cours…" /> });
const ResourceManager = dynamic(() => import('./ResourceManager').then((module) => module.ResourceManager), { loading: () => <LoadingState label="Chargement des ressources…" /> });

type Range = Pick<SessionDraft, 'date' | 'start_time' | 'end_time'>;

export function TimetableWorkspace({ rooms = false }: { rooms?: boolean }) {
  const { centersQuery, center, token, user, demo } = useTimetableScope();
  if ((!token && !demo) || centersQuery.isLoading) return <LoadingState label="Chargement des centres…" />;
  if (centersQuery.isError) return <ErrorState title="Planning indisponible" description={timetableError(centersQuery.error)} onRetry={() => void centersQuery.refetch()} />;
  if (!center) return <div className="rounded-xl border border-amud-outline-variant bg-amud-surface"><EmptyState icon="school" title="Aucun centre accessible" description="Un administrateur doit rattacher votre compte à un centre de formation avant de pouvoir consulter son planning." />{user?.roles?.includes('Administrator') && <p className="pb-6 text-center"><Link href="/admin/centres" className="text-amud-primary underline">Gérer les centres existants</Link></p>}</div>;
  return <ConnectedTimetable key={`${demo}-${center.id}-${rooms}`} rooms={rooms} />;
}

function ConnectedTimetable({ rooms }: { rooms: boolean }) {
  const { center, centers, selectCenter, token, demo, service } = useTimetableScope();
  const notify = useToast();
  const refresh = useRefreshTimetable();
  const resourcesQuery = useTimetableResources();
  const [today, setToday] = useState(() => academicToday());
  const [week, setWeek] = useState(() => mondayOf(academicToday()));
  const sessionsQuery = useTimetableSessions(week, addDays(week, 6));
  const [view, setView] = useState<'week' | 'day'>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'day' : 'week'));
  const [day, setDay] = useState(() => academicToday());
  const [selectedGroup, setSelectedGroup] = useState(0);
  // Read in an effect: during client navigation the URL changes after the first render.
  useEffect(() => { const group = Number(readQueryParam('group')); if (group) setSelectedGroup(group); }, []);
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [search, setSearch] = useState('');
  const [interval, setIntervalMinutes] = useState<30 | 60>(30);
  const [colorBy, setColorBy] = useState<'module' | 'group'>('module');
  const [editor, setEditor] = useState<{ initial: SessionDraft; session?: TimetableSession } | null>(null);
  const [manage, setManage] = useState(false);
  const [occupancyDate, setOccupancyDate] = useState(() => academicToday());
  const [occupancyTime, setOccupancyTime] = useState('09:00');
  const [failure, setFailure] = useState<{ message: string; availability?: Availability; session?: TimetableSession; range?: Range } | null>(null);
  const mutationLock = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(academicToday()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const resources = resourcesQuery.data;
  const allSessions = useMemo(() => sessionsQuery.data?.sessions ?? [], [sessionsQuery.data]);
  const visibleSessions = useMemo(() => allSessions.filter((session) => (view === 'week' || session.date === day) && (!selectedGroup || session.group_id === selectedGroup) && (!selectedRoom || session.room_id === selectedRoom)), [allSessions, selectedGroup, selectedRoom, view, day]);
  const selectedResources = rooms ? resources?.rooms : resources?.groups;
  const filtered = selectedResources?.filter((resource) => resource.name.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))) ?? [];
  const complete = resources && resources.teachers.length > 0 && resources.modules.length > 0 && resources.groups.length > 0 && resources.rooms.length > 0;
  const update = useMutation({
    mutationFn: async ({ session, range }: { session: TimetableSession; range: Range }) => {
      if (!center?.can_manage || (!token && !demo)) throw new Error('Accès refusé.');
      return service.save(token ?? '', center.id, { ...session, ...range }, session.request_key, session);
    },
    onSuccess: (saved) => { void refresh(saved); setFailure(null); notify('Cours déplacé ou redimensionné.'); },
    onError: (error, variables) => { void refresh(); setFailure({ message: timetableError(error), availability: error instanceof ApiError && error.payload.conflicts ? error.payload as Availability : undefined, ...variables }); },
  });
  const { mutate: mutateSession } = update;
  const change = useCallback((session: TimetableSession, range: Range) => {
    if (!center?.can_manage || mutationLock.current) return;
    mutationLock.current = true;
    mutateSession({ session, range }, { onSettled: () => { mutationLock.current = false; } });
  }, [center?.can_manage, mutateSession]);
  const add = useCallback((range?: Range) => {
    if (!center?.can_manage || !resources || !complete) return;
    setEditor({ initial: { date: view === 'day' ? day : today >= week && today <= addDays(week, 6) ? today : week, start_time: '08:30', end_time: '09:30', teacher_id: 0, module_id: 0, group_id: selectedGroup || 0, room_id: selectedRoom || 0, ...range } });
  }, [center?.can_manage, resources, complete, today, week, selectedGroup, selectedRoom, view, day]);
  const openSession = useCallback((session: TimetableSession) => setEditor({ initial: session, session }), []);
  function navigate(direction: -1 | 1) {
    setFailure(null);
    if (view === 'day') { const next = addDays(day, direction); setDay(next); setWeek(mondayOf(next)); setOccupancyDate(next); return; }
    const next = addDays(week, 7 * direction); setWeek(next); setDay(next); setOccupancyDate(next);
  }
  function goToday() { setWeek(mondayOf(today)); setDay(today); setOccupancyDate(today); setFailure(null); }
  function changeView(next: 'week' | 'day') {
    if (next === 'day' && (day < week || day > addDays(week, 6))) setDay(today >= week && today <= addDays(week, 6) ? today : week);
    setView(next);
  }
  const calendarDays = view === 'day' ? [day] : Array.from({ length: 7 }, (_, index) => addDays(week, index));
  if (resourcesQuery.isLoading || sessionsQuery.isLoading) return <LoadingState label="Chargement de l’emploi du temps…" rows={6} />;
  if (resourcesQuery.isError || sessionsQuery.isError) return <ErrorState title="Impossible de charger l’emploi du temps" description={timetableError(resourcesQuery.error ?? sessionsQuery.error)} onRetry={() => { void resourcesQuery.refetch(); void sessionsQuery.refetch(); }} />;
  if (!resources || !center) return null;
  const hours = visibleSessions.reduce((total, session) => total + (minutes(session.end_time) - minutes(session.start_time)) / 60, 0);
  const selectedName = rooms ? resources.rooms.find((item) => item.id === selectedRoom)?.name : resources.groups.find((item) => item.id === selectedGroup)?.name;
  const name = (kind: keyof typeof resources, id: number) => resources[kind].find((item) => item.id === id)?.name ?? '—';
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-label-sm font-semibold uppercase tracking-widest text-amud-primary">Pédagogie · {center.name}</p><h1 className="mt-1 text-headline-md font-bold text-amud-on-surface">{rooms ? 'Gestion des salles' : 'Emploi du temps'}</h1><p className="mt-1 text-body-md text-amud-on-surface-variant">{rooms ? 'Consultez les disponibilités et le planning de chaque salle.' : 'Organisez les cours, les groupes et les espaces de formation.'}</p></div>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Centre de formation" value={center.id} onChange={(event) => selectCenter(Number(event.target.value))} className="min-h-[44px] max-w-64 rounded-lg border border-amud-outline-variant bg-amud-surface px-3 text-body-md">{centers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        {center.can_manage && <Button variant="secondary" icon="settings" onClick={() => setManage(true)}>Ressources</Button>}
        <Button icon="add" onClick={() => add()} disabled={!center.can_manage || !complete || update.isPending}>Ajouter un cours</Button>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Vues du planning" className="inline-flex gap-1 rounded-lg bg-amud-surface-container-high p-1"><Link aria-current={!rooms ? 'page' : undefined} href="/amud/centre/planning" className={`rounded-md px-4 py-2 text-label-md ${!rooms ? 'bg-amud-surface font-semibold text-amud-primary shadow-sm' : ''}`}>Groupes</Link><Link aria-current={rooms ? 'page' : undefined} href="/amud/centre/salles" className={`rounded-md px-4 py-2 text-label-md ${rooms ? 'bg-amud-surface font-semibold text-amud-primary shadow-sm' : ''}`}>Salles</Link></nav>
      <p className="text-label-sm text-amud-on-surface-variant">Africa/Casablanca · {center.can_manage ? 'Modifications autorisées' : 'Lecture seule'} · {sessionsQuery.isFetching ? 'Actualisation…' : demo ? 'Données de démonstration · navigateur' : 'Synchronisation toutes les 30 s'}</p>
    </div>
    {!complete && <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-4 text-body-md">Ajoutez au moins un professeur, une formation, un groupe et une salle pour planifier les cours. {center.can_manage && <button type="button" className="font-semibold text-amud-primary underline" onClick={() => setManage(true)}>Gérer les ressources</button>}</div>}
    <div className="grid gap-4 xl:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="order-last self-start rounded-xl xl:order-first border border-amud-outline-variant bg-amud-surface p-3">
        <h2 className="mb-3 text-title-lg font-semibold">{rooms ? 'Salles de cours' : 'Groupes étudiants'}</h2>
        <SearchInput value={search} onChange={setSearch} placeholder={rooms ? 'Rechercher une salle…' : 'Rechercher un groupe…'} />
        <div className="mt-3 max-h-[420px] space-y-1 overflow-auto" aria-label={rooms ? 'Choisir une salle' : 'Choisir un groupe'}>
          {[{ id: 0, name: rooms ? 'Toutes les salles' : 'Tous les groupes' }, ...filtered].map((resource) => {
            const active = resource.id === (rooms ? selectedRoom : selectedGroup);
            const count = allSessions.filter((session) => resource.id === 0 || (rooms ? session.room_id : session.group_id) === resource.id).length;
            return <button type="button" key={resource.id} aria-pressed={active} onClick={() => rooms ? setSelectedRoom(resource.id) : setSelectedGroup(resource.id)} className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-label-md transition-colors ${active ? 'bg-amud-surface-container-high font-semibold text-amud-primary' : 'text-amud-on-surface-variant hover:bg-amud-surface-container-low'}`}><span className="truncate">{resource.name}</span><span className="rounded-full bg-amud-surface-container-high px-2 text-label-sm">{count}</span></button>;
          })}
          {!filtered.length && <p className="px-3 py-4 text-label-sm text-amud-on-surface-variant">Aucun résultat.</p>}
        </div>
        <div className="mt-4 border-t border-amud-outline-variant pt-3 text-label-sm text-amud-on-surface-variant"><p className="font-semibold text-amud-on-surface">{visibleSessions.length} cours · {hours.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h</p><p className="mt-2">Glissez sur un créneau libre pour créer un cours : la date et les horaires sont pré-remplis. Glissez un cours pour le déplacer, son bord inférieur pour changer sa durée.</p><p className="mt-2">Clavier : flèches pour naviguer, Entrée pour ajouter. Les horaires restent modifiables dans le formulaire.</p></div>
      </aside>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amud-outline-variant bg-amud-surface p-3">
          <div className="flex flex-wrap items-center gap-1"><Button variant="ghost" aria-label={view === 'day' ? 'Jour précédent' : 'Semaine précédente'} onClick={() => navigate(-1)}>←</Button><Button variant="secondary" onClick={goToday}>Aujourd’hui</Button><Button variant="ghost" aria-label={view === 'day' ? 'Jour suivant' : 'Semaine suivante'} onClick={() => navigate(1)}>→</Button><div className="px-2"><h2 className="text-title-lg font-semibold first-letter:uppercase">{view === 'day' ? new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${day}T12:00:00Z`)) : `${formatDate(week)} – ${formatDate(addDays(week, 6))} ${week.slice(0, 4)}`}</h2><p className="text-label-sm text-amud-on-surface-variant">{selectedName ?? (rooms ? 'Toutes les salles' : 'Tous les groupes')}</p></div></div>
          <div className="flex flex-wrap gap-2"><SegmentedControl label="Vue du calendrier" value={view} onChange={changeView} options={[{ value: 'week', label: 'Semaine' }, { value: 'day', label: 'Jour' }]} /><select aria-label="Couleurs des cours" value={colorBy} onChange={(event) => setColorBy(event.target.value as 'module' | 'group')} className="min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-2 text-label-sm"><option value="module">Couleur par formation</option><option value="group">Couleur par groupe</option></select><SegmentedControl label="Intervalle du calendrier" value={String(interval)} onChange={(value) => setIntervalMinutes(Number(value) as 30 | 60)} options={[{ value: '30', label: '30 min' }, { value: '60', label: '60 min' }]} /></div>
        </div>
        {rooms && <section className="space-y-3" aria-label="Disponibilité des salles">
          <div className="flex flex-wrap items-end gap-3"><label className="text-label-md">Date<input aria-label="Date de disponibilité" type="date" value={occupancyDate} onChange={(event) => { if (!event.target.value) return; setOccupancyDate(event.target.value); setWeek(mondayOf(event.target.value)); setDay(event.target.value); }} className="ml-2 min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-2" /></label><label className="text-label-md">À<input aria-label="Heure de disponibilité" type="time" value={occupancyTime} onChange={(event) => setOccupancyTime(event.target.value)} className="ml-2 min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-2" /></label><Button variant="ghost" onClick={() => { const now = new Date(); const date = academicToday(now); setOccupancyDate(date); setWeek(mondayOf(date)); setDay(date); setOccupancyTime(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)); }}>Maintenant</Button></div>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{resources.rooms.filter((room) => (!selectedRoom || room.id === selectedRoom) && room.name.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))).map((room) => {
            const daySessions = allSessions.filter((session) => session.room_id === room.id && session.date === occupancyDate);
            const current = daySessions.find((session) => session.start_time <= occupancyTime && session.end_time > occupancyTime);
            return <button type="button" key={room.id} onClick={() => setSelectedRoom(room.id)} className="rounded-xl border border-amud-outline-variant bg-amud-surface p-4 text-left transition-colors hover:border-amud-primary"><span className="flex items-center justify-between gap-2"><span className="font-semibold">{room.name}</span><Badge tone={current ? 'warning' : 'success'}>{current ? 'Occupée' : 'Libre'}</Badge></span><span className="mt-2 block text-label-sm text-amud-on-surface-variant">{current ? `${name('modules', current.module_id)} · ${name('groups', current.group_id)} · ${name('teachers', current.teacher_id)} · ${current.start_time}–${current.end_time}` : `Disponible à ${occupancyTime} · ${daySessions.length} cours ce jour`}</span></button>;
          })}</div>
          {!resources.rooms.length && <EmptyState compact icon="meeting_room" title="Aucune salle" description="Ajoutez les salles réelles de ce centre dans les ressources." />}
        </section>}
        {!visibleSessions.length && <p role="status" className="rounded-lg bg-amud-surface-container-low p-3 text-body-md text-amud-on-surface-variant">{view === 'day' ? 'Aucun cours ce jour.' : 'Aucun cours cette semaine.'} {center.can_manage && complete ? 'Sélectionnez un créneau dans le calendrier pour commencer.' : ''}</p>}
        <WeeklyCalendar days={calendarDays} sessions={visibleSessions} resources={resources} interval={interval} colorBy={colorBy} allowed={center.can_manage && !!complete} busy={update.isPending} today={today} onSelect={add} onOpen={openSession} onChange={change} />
      </div>
    </div>
    {editor && <SessionAssignmentForm {...editor} resources={resources} onClose={() => setEditor(null)} />}
    {manage && <ResourceManager resources={resources} onClose={() => setManage(false)} />}
    {failure && <Modal open onClose={() => setFailure(null)} title="Le cours n’a pas été déplacé" footer={<Button variant="secondary" onClick={() => setFailure(null)}>Fermer</Button>}>
      <p role="alert" className="text-body-md text-amud-error">{failure.message}</p>
      <ul className="mt-3 space-y-1 text-body-md">{failure.availability?.conflicts.map((conflict, index) => <li key={index}>{conflict.message}</li>)}</ul>
      {!!failure.availability?.alternatives.length && <div className="mt-4 space-y-2"><p className="text-body-md">Autres créneaux disponibles :</p>{failure.availability.alternatives.map((slot) => <Button key={slot.start_time} variant="secondary" disabled={update.isPending} onClick={() => { if (failure.session) change(failure.session, slot); }}>{slot.start_time}–{slot.end_time}</Button>)}</div>}
    </Modal>}
  </div>;
}
