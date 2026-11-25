'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Button, ConfirmDialog, DropdownMenu, EmptyState, ErrorState, LoadingState, Modal, ResponsiveTable, SearchInput } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { ApiError } from '@/lib/api';
import { timetableError, timetableService, type FormationResource, type GroupResource, type ResourceDetails, type ResourceKind, type TimetableCenter, type TimetableResource, type TimetableResources } from '@/lib/amud/services/timetableService';
import { STUDENT_LEVELS, academicMonth, formatMoney, formatMonth } from '@/lib/amud/services/trainingService';
import { academicToday, addDays, minutes, mondayOf } from '@/lib/amud/timetable/calendar';
import { useTimetableResources, useTimetableScope, useTimetableSessions } from '@/lib/amud/timetable/useTimetable';
import { useStudentCache } from '@/lib/amud/training/useTraining';
import { CentreHeader, ConnectedCentre, Field, ReadOnlyHint, inputClass, readQueryParam } from './shared';

type AnyResource = TimetableResource & FormationResource & GroupResource;
type Config = {
  kind: ResourceKind;
  title: string;
  subtitle: string;
  singular: string;
  addLabel: string;
  icon: string;
  emptyText: string;
  columns: string[];
  cells: (item: AnyResource, resources: TimetableResources) => ReactNode[];
  links?: (item: AnyResource) => ReactNode;
};

export function GroupsWorkspace() {
  const name = (list: TimetableResource[], id?: number | null) => (id ? list.find((item) => item.id === id)?.name : undefined) ?? '—';
  return <ResourceWorkspace config={{
    kind: 'groups', title: 'Groupes', subtitle: 'Classes d’étudiants, avec leur formation, enseignant et salle habituels.', singular: 'groupe', addLabel: 'Créer un groupe', icon: 'diversity_3',
    emptyText: 'Créez un groupe (par exemple « A1 Matin ») puis affectez-y des étudiants.',
    columns: ['Groupe', 'Formation', 'Enseignant', 'Salle', 'Étudiants'],
    cells: (item, resources) => [item.name, name(resources.modules, item.module_id), name(resources.teachers, item.teacher_id), name(resources.rooms, item.room_id),
      `${item.student_count ?? 0}${item.capacity != null ? ` / ${item.capacity}` : ''}`],
    links: (item) => <>
      <Link href={`/amud/centre/etudiants?group=${item.id}`} className="inline-flex min-h-[40px] items-center rounded-lg px-3 text-label-md font-medium text-amud-primary hover:bg-amud-surface-container-high">Étudiants</Link>
      <Link href={`/amud/centre/planning?group=${item.id}`} className="inline-flex min-h-[40px] items-center rounded-lg px-3 text-label-md font-medium text-amud-primary hover:bg-amud-surface-container-high">Planning</Link>
    </>,
  }} />;
}

export function FormationsWorkspace() {
  return <ResourceWorkspace config={{
    kind: 'modules', title: 'Formations', subtitle: 'Formations et niveaux proposés. Le tarif mensuel sert au suivi des paiements.', singular: 'formation', addLabel: 'Créer une formation', icon: 'menu_book',
    emptyText: 'Créez vos formations (par exemple « Allemand A1 ») avec leur tarif mensuel.',
    columns: ['Formation', 'Niveau', 'Tarif mensuel', 'Groupes'],
    cells: (item, resources) => [item.name, item.level || '—',
      item.monthly_fee != null ? <span key="fee">{formatMoney(item.monthly_fee)}{item.fee_effective_from && <span className="block text-label-sm text-amud-on-surface-variant">depuis {formatMonth(item.fee_effective_from)}</span>}</span> : <span key="fee" className="text-amud-on-surface-variant">Non défini</span>,
      String(resources.groups.filter((group) => group.module_id === item.id).length)],
  }} />;
}

export function TeachersWorkspace() {
  return <ResourceWorkspace config={{
    kind: 'teachers', title: 'Enseignants', subtitle: 'Professeurs disponibles pour les groupes et le planning.', singular: 'enseignant', addLabel: 'Ajouter un enseignant', icon: 'cast_for_education',
    emptyText: 'Ajoutez les professeurs de votre centre pour pouvoir planifier leurs cours.',
    columns: ['Enseignant', 'Groupes attitrés', 'Cours cette semaine'],
    cells: () => [],
  }} />;
}

function ResourceWorkspace({ config }: { config: Config }) {
  return <ConnectedCentre>{(center) => <Resources key={center.id} center={center} config={config} />}</ConnectedCentre>;
}

function Resources({ center, config }: { center: TimetableCenter; config: Config }) {
  const notify = useToast();
  const { token } = useTimetableScope();
  const cache = useStudentCache();
  const resourcesQuery = useTimetableResources();
  const week = mondayOf(academicToday());
  // Teachers show this week's load; the other kinds do not need sessions.
  const sessionsQuery = useTimetableSessions(week, addDays(week, 6), config.kind === 'teachers');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AnyResource | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AnyResource | null>(null);
  const [busy, setBusy] = useState(false);
  const canEdit = center.can_manage;
  useEffect(() => { if (readQueryParam('new') === '1' && canEdit) setEditing('new'); }, [canEdit]);
  const resources = resourcesQuery.data;
  const items = useMemo(() => ((resources?.[config.kind] ?? []) as AnyResource[]).filter((item) => item.name.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr'))), [resources, config.kind, search]);

  if (resourcesQuery.isLoading) return <LoadingState label="Chargement…" rows={5} />;
  if (resourcesQuery.isError || !resources) return <ErrorState title="Chargement impossible" description={timetableError(resourcesQuery.error)} onRetry={() => void resourcesQuery.refetch()} />;

  const sessions = sessionsQuery.data?.sessions ?? [];
  const cells = config.kind === 'teachers'
    ? (item: AnyResource) => {
      const own = sessions.filter((session) => session.teacher_id === item.id);
      const hours = own.reduce((sum, session) => sum + (minutes(session.end_time) - minutes(session.start_time)) / 60, 0);
      return [item.name, resources.groups.filter((group) => group.teacher_id === item.id).map((group) => group.name).join(', ') || '—', own.length ? `${own.length} cours · ${hours.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h` : '—'];
    }
    : (item: AnyResource) => config.cells(item, resources);

  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await timetableService.removeResource(token!, center.id, config.kind, deleting.id);
      await cache.refreshResources();
      notify(`« ${deleting.name} » supprimé.`, 'info');
      setDeleting(null);
    } catch (failure) { notify(timetableError(failure), 'error'); setDeleting(null); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <CentreHeader section="Pédagogie" title={config.title} subtitle={config.subtitle} actions={canEdit && <Button icon="add" onClick={() => setEditing('new')}>{config.addLabel}</Button>} />
    <ReadOnlyHint show={!canEdit} />
    {config.kind === 'modules' && resources.modules.length > 0 && resources.modules.every((item) => item.monthly_fee == null) && <p className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-3 text-body-md">Renseignez le tarif mensuel de vos formations : il permet de calculer les impayés dans le rapport mensuel.</p>}
    {config.kind === 'groups' && !resources.modules.length && canEdit && <p className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-3 text-body-md">Astuce : <Link href="/amud/centre/formations?new=1" className="font-semibold text-amud-primary underline">créez d’abord une formation</Link> pour la rattacher à vos groupes.</p>}
    {(resources[config.kind] as AnyResource[]).length > 8 && <div className="max-w-md"><SearchInput value={search} onChange={setSearch} placeholder={`Rechercher un ${config.singular}…`} /></div>}
    <ResponsiveTable caption={config.title} columns={config.columns} pageSize={25}
      rows={items.map((item) => ({ id: String(item.id), cells: cells(item), action: (config.links || canEdit) ? <div className="flex flex-wrap items-center justify-end gap-1">
        {config.links?.(item)}
        {canEdit && <DropdownMenu trigger={({ open, toggle }) => <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" aria-label={`Actions pour ${item.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-amud-on-surface-variant hover:bg-amud-surface-container-high"><span className="material-symbols-outlined">more_vert</span></button>}
          items={[{ label: 'Modifier', icon: 'edit', onClick: () => setEditing(item) }, { label: 'Supprimer', icon: 'delete', danger: true, onClick: () => setDeleting(item) }]} />}
      </div> : undefined }))}
      empty={(resources[config.kind] as AnyResource[]).length
        ? <EmptyState compact icon="search_off" title="Aucun résultat" />
        : <EmptyState icon={config.icon} title={`Aucun ${config.singular}`} description={config.emptyText} actionLabel={canEdit ? config.addLabel : undefined} onAction={canEdit ? () => setEditing('new') : undefined} />} />
    {editing && <ResourceFormModal center={center} kind={config.kind} singular={config.singular} resources={resources} item={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)}
      onSaved={(created, name) => { setEditing(null); void cache.refreshResources(); notify(created ? `« ${name} » ajouté.` : 'Modifications enregistrées.'); }} />}
    {deleting && <ConfirmDialog open onClose={() => { if (!busy) setDeleting(null); }} onConfirm={() => void remove()} title={`Supprimer « ${deleting.name} » ?`}
      description="Impossible si l’élément est utilisé par des cours, des étudiants ou des groupes : le serveur le protège." confirmLabel="Supprimer" />}
  </div>;
}

function ResourceFormModal({ center, kind, singular, resources, item, onClose, onSaved }: {
  center: TimetableCenter; kind: ResourceKind; singular: string; resources: TimetableResources; item?: AnyResource; onClose: () => void; onSaved: (created: boolean, name: string) => void;
}) {
  const { token } = useTimetableScope();
  const [name, setName] = useState(item?.name ?? '');
  const [details, setDetails] = useState<ResourceDetails>(() => kind === 'groups'
    ? { module_id: item?.module_id ?? null, teacher_id: item?.teacher_id ?? null, room_id: item?.room_id ?? null, capacity: item?.capacity ?? null }
    : kind === 'modules' ? { level: item?.level ?? null, monthly_fee: item?.monthly_fee ?? null } : {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feeFrom, setFeeFrom] = useState(() => academicMonth());
  const [formationFrom, setFormationFrom] = useState(() => academicToday());
  const set = (patch: ResourceDetails) => { setDetails((current) => ({ ...current, ...patch })); setErrors({}); };
  // History-sensitive changes: a fee change applies from a month, a group's new formation from a date.
  const feeChanged = kind === 'modules' && (!item ? details.monthly_fee != null : (details.monthly_fee ?? null) !== (item.monthly_fee ?? null));
  const formationChanged = kind === 'groups' && !!item && (details.module_id ?? null) !== (item.module_id ?? null) && (item.student_count ?? 0) > 0;
  const numberOrNull = (value: string) => (value === '' ? null : Number(value));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) { setErrors({ name: 'Le nom est obligatoire.' }); return; }
    setSaving(true);
    try {
      const payload: ResourceDetails = { ...details };
      if (kind === 'modules') {
        if (feeChanged) payload.fee_effective_from = feeFrom;
        else delete payload.monthly_fee;
      }
      if (formationChanged) payload.formation_effective_on = formationFrom;
      await timetableService.saveResource(token!, center.id, kind, name.trim(), item?.id, payload);
      onSaved(!item, name.trim());
    } catch (failure) {
      const fields = failure instanceof ApiError ? failure.payload.errors as Record<string, string[]> | undefined : undefined;
      setErrors(fields ? Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages[0]])) : { form: timetableError(failure) });
    } finally { setSaving(false); }
  }

  const select = (label: string, value: number | null | undefined, options: TimetableResource[], onChange: (id: number | null) => void, field: string) =>
    <Field label={label} error={errors[field]}><select value={value ?? ''} onChange={(event) => onChange(numberOrNull(event.target.value))} className={inputClass}><option value="">Non défini</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>;

  return <Modal open onClose={() => { if (!saving) onClose(); }} title={item ? `Modifier « ${item.name} »` : `Nouveau ${singular}`.replace('Nouveau formation', 'Nouvelle formation')} subtitle={center.name}
    footer={<div className="flex justify-end gap-2"><Button variant="secondary" disabled={saving} onClick={onClose}>Annuler</Button><Button type="submit" form="resource-form" loading={saving} loadingLabel="Enregistrement…">{item ? 'Enregistrer' : 'Créer'}</Button></div>}>
    <form id="resource-form" noValidate onSubmit={submit} className="space-y-4">
      <fieldset disabled={saving} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom" required className="sm:col-span-2" error={errors.name}><input autoFocus maxLength={150} value={name} onChange={(event) => { setName(event.target.value); setErrors({}); }} className={inputClass}
          placeholder={kind === 'groups' ? 'A1 Matin' : kind === 'modules' ? 'Allemand A1' : 'Prénom Nom'} /></Field>
        {kind === 'modules' && <>
          <Field label="Niveau" error={errors.level}><select value={details.level ?? ''} onChange={(event) => set({ level: event.target.value || null })} className={inputClass}><option value="">Non défini</option>{[...STUDENT_LEVELS, 'Autre'].map((level) => <option key={level} value={level}>{level}</option>)}</select></Field>
          <Field label="Tarif mensuel (MAD)" hint="Montant attendu par étudiant et par mois." error={errors.monthly_fee}><input type="number" min="0" step="1" inputMode="decimal" value={details.monthly_fee ?? ''} onChange={(event) => set({ monthly_fee: numberOrNull(event.target.value) })} className={inputClass} /></Field>
          {feeChanged && <Field label="Applicable à partir de" className="sm:col-span-2" error={errors.fee_effective_from}
            hint={item ? 'Les mois précédents conservent l’ancien tarif dans les rapports.' : 'Premier mois facturé à ce tarif.'}>
            <input type="month" required value={feeFrom} onChange={(event) => { setFeeFrom(event.target.value); setErrors({}); }} className={inputClass} />
          </Field>}
          {feeChanged && item && feeFrom < academicMonth() && <p role="alert" className="text-label-sm text-amud-error sm:col-span-2">Mois passé : les rapports de {formatMonth(feeFrom)} et des mois suivants seront recalculés avec ce tarif.</p>}
          {!!item?.fees?.length && <div className="sm:col-span-2">
            <p className="text-label-md text-amud-on-surface-variant">Historique des tarifs</p>
            <ul className="mt-1 divide-y divide-amud-outline-variant rounded-lg border border-amud-outline-variant text-body-md">
              {[...item.fees].reverse().map((fee) => <li key={fee.effective_from} className="flex justify-between gap-2 px-3 py-2"><span className="first-letter:uppercase">À partir de {formatMonth(fee.effective_from)}</span><span className="font-semibold">{fee.amount == null ? 'Aucun tarif' : formatMoney(fee.amount)}</span></li>)}
            </ul>
          </div>}
        </>}
        {kind === 'groups' && <>
          {select('Formation', details.module_id, resources.modules, (module_id) => set({ module_id }), 'module_id')}
          <Field label="Capacité" hint="Places maximum (facultatif)." error={errors.capacity}><input type="number" min="1" max="500" value={details.capacity ?? ''} onChange={(event) => set({ capacity: numberOrNull(event.target.value) })} className={inputClass} /></Field>
          {select('Enseignant habituel', details.teacher_id, resources.teachers, (teacher_id) => set({ teacher_id }), 'teacher_id')}
          {select('Salle habituelle', details.room_id, resources.rooms, (room_id) => set({ room_id }), 'room_id')}
          {formationChanged && <Field label="Nouvelle formation à partir du" className="sm:col-span-2" error={errors.formation_effective_on}
            hint={`S’applique aux ${item?.student_count} étudiant(s) actuels du groupe. Les périodes antérieures gardent leur formation.`}>
            <input type="date" required max={academicToday()} value={formationFrom} onChange={(event) => { setFormationFrom(event.target.value); setErrors({}); }} className={inputClass} />
          </Field>}
          <p className="text-label-sm text-amud-on-surface-variant sm:col-span-2">L’enseignant et la salle habituels pré-remplissent le formulaire de cours dans le planning.</p>
        </>}
      </fieldset>
      {errors.form && <p role="alert" className="rounded-lg bg-amud-error-container p-3 text-body-md text-amud-on-error-container">{errors.form}</p>}
    </form>
  </Modal>;
}
