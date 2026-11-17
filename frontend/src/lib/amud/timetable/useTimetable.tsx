'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { timetableService, type TimetableSession } from '@/lib/amud/services/timetableService';
import { academicToday, addDays, mondayOf } from './calendar';

import { isTimetablePath } from './paths';
export { isTimetablePath } from './paths';

function useScope() {
  const { token, user } = useAuth();
  const pathname = usePathname();
  const enabled = isTimetablePath(pathname);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const centersQuery = useQuery({
    queryKey: ['timetable', user?.id, 'centers'],
    queryFn: () => timetableService.centers(token!),
    enabled: !!token && enabled,
    staleTime: 30_000,
    retry: false,
  });
  const client = useQueryClient();
  useEffect(() => {
    let stored: number | null = null;
    try { stored = Number(localStorage.getItem(`amud_timetable_center_${user?.id}`)) || null; } catch { /* Storage is optional. */ }
    setSelectedId(stored);
    // Returning users: load the remembered centre's resources and current week
    // alongside the centre list instead of after it (same keys as the hooks below).
    if (!stored || !token || !enabled || user?.id === undefined) return;
    const week = mondayOf(academicToday());
    const to = addDays(week, 6);
    void client.prefetchQuery({ queryKey: ['timetable', user.id, stored, 'resources'], queryFn: () => timetableService.resources(token, stored), staleTime: 30_000, retry: false });
    void client.prefetchQuery({ queryKey: ['timetable', user.id, stored, 'sessions', week, to], queryFn: () => timetableService.sessions(token, stored, week, to), staleTime: 10_000, retry: false });
  }, [user?.id, token, enabled, client]);
  const centers = centersQuery.data?.centers ?? [];
  const center = centers.find((item) => item.id === selectedId) ?? centers[0];
  function selectCenter(id: number) {
    setSelectedId(id);
    try { localStorage.setItem(`amud_timetable_center_${user?.id}`, String(id)); } catch { /* Storage is optional. */ }
  }
  return { token, user, enabled, centersQuery, centers, center, selectCenter };
}
const ScopeContext = createContext<ReturnType<typeof useScope> | null>(null);
export function TimetableScopeProvider({ children }: { children: ReactNode }) {
  const scope = useScope();
  return <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>;
}
export function useTimetableScope() {
  const value = useContext(ScopeContext);
  if (!value) throw new Error('TimetableScopeProvider is required.');
  return value;
}
export function useTimetableResources() {
  const { user, token, center } = useTimetableScope();
  return useQuery({ queryKey: ['timetable', user?.id, center?.id, 'resources'], queryFn: () => timetableService.resources(token!, center!.id), enabled: !!token && !!center, staleTime: 30_000, refetchInterval: 30_000, retry: false });
}
export function useTimetableSessions(from: string, to: string) {
  const { user, token, center } = useTimetableScope();
  return useQuery({ queryKey: ['timetable', user?.id, center?.id, 'sessions', from, to], queryFn: () => timetableService.sessions(token!, center!.id, from, to), enabled: !!token && !!center, staleTime: 10_000, refetchInterval: 30_000, retry: false });
}
export function useRefreshTimetable() {
  const client = useQueryClient();
  const { user, center } = useTimetableScope();
  return (session?: TimetableSession, removedId?: number) => {
    const prefix = ['timetable', user?.id, center?.id];
    for (const [key, data] of client.getQueriesData<{ sessions: TimetableSession[] }>({ queryKey: [...prefix, 'sessions'] })) {
      if (!data) continue;
      const from = key[4] as string;
      const to = key[5] as string;
      if (session || removedId) client.setQueryData(key, {
        ...data,
        sessions: [...data.sessions.filter((item) => item.id !== (session?.id ?? removedId)), ...(session && session.date >= from && session.date <= to ? [session] : [])],
      });
    }
    return client.invalidateQueries({ queryKey: session || removedId ? [...prefix, 'sessions'] : prefix });
  };
}
