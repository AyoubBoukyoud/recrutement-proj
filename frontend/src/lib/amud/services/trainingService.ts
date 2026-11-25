import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { timetablePath } from './timetableService';

/** Students, memberships and finance of a training centre (Laravel, Sanctum). */
export type StudentStatus = 'active' | 'inactive';
export type Student = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  level: string | null;
  status: StudentStatus;
  notes: string | null;
  registered_on: string;
  deactivated_on: string | null;
  /** Groups the student is in today. */
  group_ids: number[];
  /** Every group period, oldest first; `ended_on` is the last day (inclusive). */
  memberships: Membership[];
  /** Activity periods, oldest first. */
  periods: { started_on: string; ended_on: string | null }[];
};
export type Membership = { id: number; group_id: number; module_id: number | null; joined_on: string; ended_on: string | null };
export type StudentDraft = Partial<Pick<Student, 'phone' | 'email' | 'city' | 'level' | 'notes'>> & Pick<Student, 'first_name' | 'last_name'> & { registered_on?: string; group_ids?: number[] };

export type PaymentMethod = 'cash' | 'transfer' | 'check' | 'card';
export type Payment = { id: number; student_id: number; period: string; amount: number; paid_on: string; method: PaymentMethod; reference: string | null; note: string | null; created_at: string };
export type PaymentDraft = Omit<Payment, 'id' | 'created_at'>;

export type ReportStatus = 'paid' | 'partial' | 'unpaid' | 'no_fee' | 'needs_rule';
export type BillingIssue = 'formation_change' | 'multiple_formations';
export type ReportRow = {
  student_id: number; name: string; phone: string | null;
  /** Current status (display only). */
  student_status: StudentStatus;
  /** Groups and formations during the month, from history. */
  group_ids: number[]; module_ids: number[];
  formations: { module_id: number; fee: number | null; fee_effective_from: string | null }[];
  expected: number | null; paid: number; balance: number | null; payments_count: number; status: ReportStatus;
  /** Set when the month needs a billing rule the centre has not defined: no amount is computed. */
  billing_issue: BillingIssue | null;
  /** Joined, left or was (de)activated during the month. */
  partial_month: boolean;
};
export type MonthlyReport = {
  month: string;
  rows: ReportRow[];
  totals: { students: number; expected: number; paid: number; outstanding: number; paid_count: number; partial_count: number; unpaid_count: number; no_fee_count: number; needs_rule_count: number };
};

export const STUDENT_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = { cash: 'Espèces', transfer: 'Virement', check: 'Chèque', card: 'Carte bancaire' };
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = { paid: 'Payé', partial: 'Partiel', unpaid: 'Impayé', no_fee: 'Tarif non défini', needs_rule: 'Règle à définir' };
export const BILLING_ISSUE_LABELS: Record<BillingIssue, string> = {
  formation_change: 'Changement de formation en cours de mois',
  multiple_formations: 'Plusieurs formations en même temps',
};

export const trainingService = {
  students: (token: string, centerId: number) => apiGet<{ students: Student[] }>(`${timetablePath(centerId)}/students`, token),
  saveStudent: (token: string, centerId: number, draft: StudentDraft & { status?: StudentStatus }, id?: number) => id
    ? apiPut<Student>(`${timetablePath(centerId)}/students/${id}`, draft, token)
    : apiPost<Student>(`${timetablePath(centerId)}/students`, draft, token),
  setStatus: (token: string, centerId: number, id: number, status: StudentStatus, effectiveOn?: string) => apiPut<Student>(`${timetablePath(centerId)}/students/${id}`, { status, status_effective_on: effectiveOn }, token),
  removeStudent: (token: string, centerId: number, id: number) => apiDelete<void>(`${timetablePath(centerId)}/students/${id}`, token),
  setGroups: (token: string, centerId: number, id: number, groupIds: number[], effectiveOn?: string) => apiPut<Student>(`${timetablePath(centerId)}/students/${id}/groups`, { group_ids: groupIds, effective_on: effectiveOn }, token),
  payments: (token: string, centerId: number, month: string) => apiGet<{ payments: Payment[] }>(`${timetablePath(centerId)}/payments?month=${month}`, token),
  recordPayment: (token: string, centerId: number, draft: PaymentDraft) => apiPost<Payment>(`${timetablePath(centerId)}/payments`, draft, token),
  cancelPayment: (token: string, centerId: number, id: number) => apiDelete<void>(`${timetablePath(centerId)}/payments/${id}`, token),
  monthlyReport: (token: string, centerId: number, month: string) => apiGet<MonthlyReport>(`${timetablePath(centerId)}/reports/monthly?month=${month}`, token),
};

export const studentName = (student: Pick<Student, 'first_name' | 'last_name'>) => `${student.first_name} ${student.last_name}`;

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MAD`;
}

/** Current month in the academic timezone, `YYYY-MM`. */
export function academicMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit' }).formatToParts(now);
  return `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}`;
}

export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00Z`));
}

/** The fee row in force for a month (YYYY-MM), mirroring the server's rule. */
export function feeAt(fees: { effective_from: string; amount: number | null }[] | undefined, month: string): number | null {
  let amount: number | null = null;
  for (const row of fees ?? []) if (row.effective_from <= month) amount = row.amount;
  return amount;
}

/** Formation ids from the student's group periods that overlap a month. */
export function formationsInMonth(student: Pick<Student, 'memberships'>, month: string): number[] {
  const start = `${month}-01`;
  const end = `${month}-31`;
  return [...new Set(student.memberships.filter((m) => m.joined_on <= end && (!m.ended_on || m.ended_on >= start)).map((m) => m.module_id).filter((id): id is number => !!id))];
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00Z`));
}
