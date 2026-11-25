'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTimetableScope } from '@/lib/amud/timetable/useTimetable';
import { trainingService, type Student } from '@/lib/amud/services/trainingService';

/** Query keys share the timetable scope, so switching centre or account never mixes data. */
export function useTrainingKeys() {
  const { scopeId, center } = useTimetableScope();
  const base = ['timetable', scopeId, center?.id] as const;
  return {
    base,
    students: [...base, 'students'] as const,
    resources: [...base, 'resources'] as const,
    finance: [...base, 'finance'] as const,
    payments: (month: string) => [...base, 'finance', 'payments', month] as const,
    report: (month: string) => [...base, 'finance', 'report', month] as const,
  };
}

export function useStudents(enabled = true) {
  const { token, center } = useTimetableScope();
  const keys = useTrainingKeys();
  return useQuery({
    queryKey: keys.students,
    queryFn: () => trainingService.students(token!, center!.id),
    enabled: enabled && !!token && !!center?.can_view_students,
    staleTime: 15_000,
    retry: false,
    select: (data) => data.students,
  });
}

export function usePayments(month: string) {
  const { token, center } = useTimetableScope();
  const keys = useTrainingKeys();
  return useQuery({ queryKey: keys.payments(month), queryFn: () => trainingService.payments(token!, center!.id, month), enabled: !!token && !!center?.can_manage_finance && /^\d{4}-\d{2}$/.test(month), staleTime: 15_000, retry: false, select: (data) => data.payments });
}

export function useMonthlyReport(month: string) {
  const { token, center } = useTimetableScope();
  const keys = useTrainingKeys();
  return useQuery({ queryKey: keys.report(month), queryFn: () => trainingService.monthlyReport(token!, center!.id, month), enabled: !!token && !!center?.can_manage_finance && /^\d{4}-\d{2}$/.test(month), staleTime: 15_000, retry: false });
}

/** Applies a saved student to the cached list immediately, then refreshes counts that depend on it. */
export function useStudentCache() {
  const client = useQueryClient();
  const keys = useTrainingKeys();
  return {
    put(student: Student) {
      client.setQueryData<{ students: Student[] }>(keys.students, (data) => data && ({ students: [...data.students.filter((item) => item.id !== student.id), student].sort((a, b) => a.last_name.localeCompare(b.last_name, 'fr') || a.first_name.localeCompare(b.first_name, 'fr')) }));
      void client.invalidateQueries({ queryKey: keys.resources });
      void client.invalidateQueries({ queryKey: keys.finance });
    },
    remove(id: number) {
      client.setQueryData<{ students: Student[] }>(keys.students, (data) => data && ({ students: data.students.filter((item) => item.id !== id) }));
      void client.invalidateQueries({ queryKey: keys.resources });
    },
    refresh() { return client.invalidateQueries({ queryKey: keys.students }); },
    refreshFinance() { return client.invalidateQueries({ queryKey: keys.finance }); },
    refreshResources() { return client.invalidateQueries({ queryKey: keys.resources }); },
  };
}
