'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, FilterBar, LoadingState, Modal, ResponsiveTable, SegmentedControl, SelectFilter, type BadgeTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { ApiError } from '@/lib/api';
import { timetableError, type TimetableCenter, type TimetableResources } from '@/lib/amud/services/timetableService';
import { BILLING_ISSUE_LABELS, PAYMENT_METHOD_LABELS, REPORT_STATUS_LABELS, academicMonth, feeAt, formatMoney, formatMonth, formationsInMonth, studentName, trainingService, type PaymentDraft, type PaymentMethod, type ReportRow, type ReportStatus, type Student } from '@/lib/amud/services/trainingService';
import { academicToday } from '@/lib/amud/timetable/calendar';
import { useTimetableResources, useTimetableScope } from '@/lib/amud/timetable/useTimetable';
import { useMonthlyReport, usePayments, useStudentCache, useStudents } from '@/lib/amud/training/useTraining';
import { CentreHeader, ConnectedCentre, Field, inputClass, readQueryParam } from './shared';

const STATUS_TONE: Record<ReportStatus, BadgeTone> = { paid: 'success', partial: 'warning', unpaid: 'danger', no_fee: 'neutral', needs_rule: 'info' };

export function PaymentsWorkspace() {
  return <ConnectedCentre need="finance">{(center) => <Payments key={center.id} center={center} />}</ConnectedCentre>;
}

function shiftMonth(month: string, delta: number) {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, value - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function Payments({ center }: { center: TimetableCenter }) {
  const notify = useToast();
  const { token } = useTimetableScope();
  const cache = useStudentCache();
  const [month, setMonth] = useState(() => academicMonth());
  const [view, setView] = useState<'report' | 'payments'>('report');
  const [group, setGroup] = useState('');
  const [formation, setFormation] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [recording, setRecording] = useState<{ studentId?: number; amount?: number } | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const reportQuery = useMonthlyReport(month);
  const paymentsQuery = usePayments(month);
  const studentsQuery = useStudents();
  const resourcesQuery = useTimetableResources();
  useEffect(() => { if (readQueryParam('new') === '1') setRecording({}); }, []);

  const resources = resourcesQuery.data;
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const report = reportQuery.data;
  const rows = useMemo(() => (report?.rows ?? []).filter((row) => (!group || row.group_ids.includes(Number(group)))
    && (!formation || row.module_ids.includes(Number(formation)))
    && (!status || row.status === status)
    && (!search.trim() || row.name.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr')))), [report, group, formation, status, search]);

  if (reportQuery.isLoading || resourcesQuery.isLoading) return <LoadingState label="Chargement des paiements…" rows={6} />;
  if (reportQuery.isError || resourcesQuery.isError || !report || !resources) return <ErrorState title="Rapport indisponible" description={timetableError(reportQuery.error ?? resourcesQuery.error)} onRetry={() => { void reportQuery.refetch(); void resourcesQuery.refetch(); }} />;

  // Totals follow the active filters so a group or formation can be reviewed on its own.
  const totals = {
    expected: rows.reduce((sum, row) => sum + (row.expected ?? 0), 0),
    paid: rows.reduce((sum, row) => sum + row.paid, 0),
    outstanding: rows.reduce((sum, row) => sum + (row.balance ?? 0), 0),
    unpaid: rows.filter((row) => row.status === 'unpaid' || row.status === 'partial').length,
  };
  const groupNames = (ids: number[]) => ids.map((id) => resources.groups.find((item) => item.id === id)?.name).filter(Boolean).join(', ') || '—';
  const formationName = (id: number) => resources.modules.find((item) => item.id === id)?.name ?? 'Formation';
  const needsRule = rows.filter((row) => row.status === 'needs_rule').length;
  // Expected amount: computed from the fee in force that month, or left open when the month needs a billing rule.
  const expectedCell = (row: ReportRow) => row.status === 'needs_rule'
    ? <span key="e" className="block text-label-sm"><span className="font-semibold text-amud-on-surface">À définir</span>{row.formations.map((item) => <span key={item.module_id} className="block text-amud-on-surface-variant">{formationName(item.module_id)} : {formatMoney(item.fee)}</span>)}</span>
    : formatMoney(row.expected);
  const nameCell = (row: ReportRow) => <span key="n" className="block min-w-0">
    <span className="block truncate">{row.name}{row.student_status === 'inactive' && <span className="ml-2 text-label-sm font-normal text-amud-on-surface-variant">(inactif)</span>}</span>
    {row.billing_issue && <span className="block text-label-sm font-normal text-amud-on-surface-variant">{BILLING_ISSUE_LABELS[row.billing_issue]}</span>}
    {!row.billing_issue && row.partial_month && <span className="block text-label-sm font-normal text-amud-on-surface-variant">Mois partiel (arrivée, départ ou changement de statut)</span>}
    {!row.module_ids.length && row.status === 'no_fee' && <span className="block text-label-sm font-normal text-amud-on-surface-variant">Aucune formation ce mois-ci</span>}
  </span>;
  const studentLabel = (id: number) => { const student = students.find((item) => item.id === id); return student ? studentName(student) : report.rows.find((row) => row.student_id === id)?.name ?? `Étudiant n° ${id}`; };
  const noFees = resources.modules.length > 0 && resources.modules.every((item) => item.monthly_fee == null);

  async function cancel() {
    if (cancelling === null || busy) return;
    setBusy(true);
    try { await trainingService.cancelPayment(token!, center.id, cancelling); await cache.refreshFinance(); notify('Paiement annulé.', 'info'); setCancelling(null); }
    catch (failure) { notify(timetableError(failure), 'error'); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <CentreHeader section="Finances" title="Paiements étudiants" subtitle="Suivi mensuel des règlements, basé uniquement sur les paiements enregistrés."
      actions={<Button icon="payments" onClick={() => setRecording({})}>Enregistrer un paiement</Button>} />
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amud-outline-variant bg-amud-surface p-3">
      <Button variant="ghost" aria-label="Mois précédent" onClick={() => setMonth(shiftMonth(month, -1))}>←</Button>
      <label className="text-label-md"><span className="sr-only">Mois</span><input type="month" value={month} onChange={(event) => { if (event.target.value) setMonth(event.target.value); }} className="min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-3" /></label>
      <Button variant="ghost" aria-label="Mois suivant" onClick={() => setMonth(shiftMonth(month, 1))}>→</Button>
      <h2 className="px-2 text-title-lg font-semibold capitalize">{formatMonth(month)}</h2>
      {month !== academicMonth() && <Button variant="secondary" size="sm" onClick={() => setMonth(academicMonth())}>Mois en cours</Button>}
    </div>
    {needsRule > 0 && <p role="status" className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-3 text-body-md"><span className="font-semibold">{needsRule} étudiant{needsRule > 1 ? 's' : ''} : règle de facturation à définir.</span> Changement de formation en cours de mois ou plusieurs formations en même temps : aucun montant attendu n’est calculé tant que le centre n’a pas fixé sa règle. Les paiements enregistrés restent comptés.</p>}
    {noFees && <p className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-3 text-body-md">Aucun tarif mensuel n’est défini : les montants attendus et impayés ne peuvent pas être calculés. <Link href="/amud/centre/formations" className="font-semibold text-amud-primary underline">Définir les tarifs des formations</Link></p>}
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[['Attendu', formatMoney(totals.expected)], ['Encaissé', formatMoney(totals.paid)], ['Reste à percevoir', formatMoney(totals.outstanding)], ['Impayés / partiels', String(totals.unpaid)]].map(([label, value]) =>
        <div key={label} className="rounded-xl border border-amud-outline-variant bg-amud-surface p-4"><dt className="text-label-sm uppercase tracking-wide text-amud-on-surface-variant">{label}</dt><dd className="mt-1 text-title-lg font-bold text-amud-on-surface">{value}</dd></div>)}
    </dl>
    <SegmentedControl label="Vue" value={view} onChange={setView} options={[{ value: 'report', label: `Rapport mensuel (${report.rows.length})` }, { value: 'payments', label: `Paiements du mois (${paymentsQuery.data?.length ?? 0})` }]} />
    {view === 'report' ? <>
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Rechercher un étudiant…" activeFilterCount={[group, formation, status].filter(Boolean).length} onReset={() => { setGroup(''); setFormation(''); setStatus(''); setSearch(''); }}
        filters={<>
          <SelectFilter label="Tous les groupes" value={group} onChange={setGroup} options={resources.groups.map((item) => ({ value: String(item.id), label: item.name }))} />
          <SelectFilter label="Toutes les formations" value={formation} onChange={setFormation} options={resources.modules.map((item) => ({ value: String(item.id), label: item.name }))} />
          <SelectFilter label="Tous les statuts" value={status} onChange={setStatus} options={(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map((value) => ({ value, label: REPORT_STATUS_LABELS[value] }))} />
        </>} />
      <ResponsiveTable caption={`Rapport de ${formatMonth(month)}`} columns={['Étudiant', 'Groupes', 'Attendu', 'Payé', 'Reste', 'Statut']} pageSize={30}
        rows={rows.map((row) => ({
          id: String(row.student_id),
          badge: { label: REPORT_STATUS_LABELS[row.status], tone: STATUS_TONE[row.status] },
          cells: [nameCell(row), groupNames(row.group_ids), expectedCell(row), formatMoney(row.paid), row.balance == null ? '—' : formatMoney(row.balance),
            <span key="s" className="hidden md:inline"><Badge tone={STATUS_TONE[row.status]}>{REPORT_STATUS_LABELS[row.status]}</Badge></span>],
          action: row.status !== 'paid' ? <Button size="sm" variant="secondary" onClick={() => setRecording({ studentId: row.student_id, amount: row.status === 'needs_rule' ? undefined : row.balance || undefined })}>Encaisser</Button> : undefined,
        }))}
        empty={report.rows.length ? <EmptyState compact icon="search_off" title="Aucun résultat pour ces filtres" />
          : <EmptyState icon="receipt_long" title="Aucun étudiant concerné ce mois-ci" description="Le rapport liste les étudiants inscrits durant le mois et ceux qui ont réglé ce mois." />} />
    </> : paymentsQuery.isLoading ? <LoadingState rows={3} /> : <ResponsiveTable caption="Paiements enregistrés" columns={['Étudiant', 'Montant', 'Date', 'Mode', 'Référence']}
      rows={(paymentsQuery.data ?? []).map((payment) => ({
        id: String(payment.id),
        cells: [studentLabel(payment.student_id), formatMoney(payment.amount), new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', dateStyle: 'medium' }).format(new Date(`${payment.paid_on}T12:00:00Z`)), PAYMENT_METHOD_LABELS[payment.method], payment.reference || '—'],
        action: <Button size="sm" variant="ghost" onClick={() => setCancelling(payment.id)}>Annuler</Button>,
      }))}
      empty={<EmptyState compact icon="payments" title="Aucun paiement enregistré pour ce mois" actionLabel="Enregistrer un paiement" onAction={() => setRecording({})} />} />}

    {recording && <PaymentFormModal center={center} resources={resources} students={students} month={month} initial={recording} onClose={() => setRecording(null)}
      onSaved={(saved) => { setRecording(null); if (saved.period !== month) setMonth(saved.period); void cache.refreshFinance(); notify(`Paiement de ${formatMoney(saved.amount)} enregistré pour ${studentLabel(saved.student_id)}.`); }} />}
    {cancelling !== null && <ConfirmDialog open onClose={() => { if (!busy) setCancelling(null); }} onConfirm={() => void cancel()} title="Annuler ce paiement ?" description="Le paiement ne sera plus compté dans les rapports. L’annulation est conservée dans l’historique." confirmLabel="Annuler le paiement" />}
  </div>;
}

function PaymentFormModal({ center, resources, students, month, initial, onClose, onSaved }: {
  center: TimetableCenter; resources: TimetableResources; students: Student[]; month: string; initial: { studentId?: number; amount?: number }; onClose: () => void; onSaved: (payment: { student_id: number; amount: number; period: string }) => void;
}) {
  const { token } = useTimetableScope();
  const [draft, setDraft] = useState<PaymentDraft>({ student_id: initial.studentId ?? 0, period: month, amount: initial.amount ?? 0, paid_on: academicToday(), method: 'cash', reference: '', note: '' });
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<PaymentDraft>) => { setDraft((current) => ({ ...current, ...patch })); setErrors({}); };
  const candidates = students.filter((student) => student.status === 'active' || student.id === draft.student_id)
    .filter((student) => !search.trim() || studentName(student).toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr')) || student.phone?.includes(search.trim()));
  const selected = students.find((student) => student.id === draft.student_id);
  // Suggest the formation fee when the student's groups define one.
  // Suggest the fee in force for the chosen month, only when exactly one formation applies (no invented rule).
  const formationIds = selected && /^\d{4}-\d{2}$/.test(draft.period) ? formationsInMonth(selected, draft.period) : [];
  const suggested = formationIds.length === 1 ? feeAt(resources.modules.find((item) => item.id === formationIds[0])?.fees, draft.period) ?? 0 : 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const found: Record<string, string> = {};
    if (!draft.student_id) found.student_id = 'Choisissez un étudiant.';
    if (!(draft.amount > 0)) found.amount = 'Le montant doit être supérieur à 0.';
    if (!draft.paid_on) found.paid_on = 'La date est obligatoire.';
    if (Object.keys(found).length) { setErrors(found); return; }
    setSaving(true);
    try { onSaved(await trainingService.recordPayment(token!, center.id, draft)); }
    catch (failure) {
      const fields = failure instanceof ApiError ? failure.payload.errors as Record<string, string[]> | undefined : undefined;
      setErrors(fields ? Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages[0]])) : { form: timetableError(failure) });
    } finally { setSaving(false); }
  }

  return <Modal open onClose={() => { if (!saving) onClose(); }} title="Enregistrer un paiement" subtitle={center.name} widthClassName="max-w-xl"
    footer={<div className="flex justify-end gap-2"><Button variant="secondary" disabled={saving} onClick={onClose}>Annuler</Button><Button type="submit" form="payment-form" loading={saving} loadingLabel="Enregistrement…">Enregistrer</Button></div>}>
    <form id="payment-form" noValidate onSubmit={submit} className="space-y-4">
      <fieldset disabled={saving} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Étudiant" required error={errors.student_id}>
            {students.length > 8 && <input type="search" placeholder="Filtrer par nom ou téléphone…" value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} mb-2`} aria-label="Filtrer les étudiants" />}
            <select value={draft.student_id || ''} onChange={(event) => set({ student_id: Number(event.target.value) })} className={inputClass}>
              <option value="">Choisir un étudiant</option>
              {candidates.map((student) => <option key={student.id} value={student.id}>{studentName(student)}{student.phone ? ` · ${student.phone}` : ''}</option>)}
            </select>
          </Field>
          {!students.length && <p className="mt-1 text-label-sm text-amud-on-surface-variant">Aucun étudiant inscrit. <Link href="/amud/centre/etudiants?new=1" className="text-amud-primary underline">Inscrire un étudiant</Link></p>}
        </div>
        <Field label="Mois concerné" required error={errors.period}><input type="month" value={draft.period} onChange={(event) => set({ period: event.target.value })} className={inputClass} /></Field>
        <Field label="Montant (MAD)" required error={errors.amount} hint={suggested > 0 ? `Tarif du mois : ${formatMoney(suggested)}` : formationIds.length > 1 ? 'Plusieurs formations ce mois-ci : montant selon la règle du centre.' : undefined}>
          <input type="number" min="0" step="0.01" inputMode="decimal" value={draft.amount || ''} onChange={(event) => set({ amount: Number(event.target.value) })} className={inputClass} />
        </Field>
        {suggested > 0 && draft.amount !== suggested && <div className="sm:col-span-2 -mt-2"><Button size="sm" variant="ghost" onClick={() => set({ amount: suggested })}>Utiliser le tarif ({formatMoney(suggested)})</Button></div>}
        <Field label="Date d’encaissement" required error={errors.paid_on}><input type="date" max={academicToday()} value={draft.paid_on} onChange={(event) => set({ paid_on: event.target.value })} className={inputClass} /></Field>
        <Field label="Mode de paiement" required error={errors.method}><select value={draft.method} onChange={(event) => set({ method: event.target.value as PaymentMethod })} className={inputClass}>{(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => <option key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</option>)}</select></Field>
        <Field label="Référence" hint="N° de reçu, de chèque ou de virement." error={errors.reference}><input maxLength={100} value={draft.reference ?? ''} onChange={(event) => set({ reference: event.target.value })} className={inputClass} /></Field>
        <Field label="Note" className="sm:col-span-2" error={errors.note}><input maxLength={255} value={draft.note ?? ''} onChange={(event) => set({ note: event.target.value })} className={inputClass} /></Field>
      </fieldset>
      {errors.form && <p role="alert" className="rounded-lg bg-amud-error-container p-3 text-body-md text-amud-on-error-container">{errors.form}</p>}
    </form>
  </Modal>;
}
