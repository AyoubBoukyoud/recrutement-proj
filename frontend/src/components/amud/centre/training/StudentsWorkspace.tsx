'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, ConfirmDialog, DropdownMenu, EmptyState, ErrorState, FilterBar, LoadingState, Modal, ResponsiveTable, SelectFilter } from '@/components/amud/ui';
import { academicToday } from '@/lib/amud/timetable/calendar';
import { useToast } from '@/components/amud/Toast';
import { timetableError, type TimetableCenter, type TimetableResources } from '@/lib/amud/services/timetableService';
import { studentName, trainingService, type Student } from '@/lib/amud/services/trainingService';
import { useTimetableResources, useTimetableScope } from '@/lib/amud/timetable/useTimetable';
import { useStudentCache, useStudents } from '@/lib/amud/training/useTraining';
import { CentreHeader, ConnectedCentre, Field, ReadOnlyHint, inputClass, readQueryParam } from './shared';
import { StudentFormModal } from './StudentFormModal';
import { AssignGroupsModal } from './AssignGroupsModal';

export function StudentsWorkspace() {
  return <ConnectedCentre need="students">{(center) => <Students key={center.id} center={center} />}</ConnectedCentre>;
}

function Students({ center }: { center: TimetableCenter }) {
  const notify = useToast();
  const { token } = useTimetableScope();
  const cache = useStudentCache();
  const studentsQuery = useStudents();
  const resourcesQuery = useTimetableResources();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [group, setGroup] = useState('');
  const [formation, setFormation] = useState('');
  const [editing, setEditing] = useState<Student | 'new' | null>(null);
  const [assigning, setAssigning] = useState<Student | null>(null);
  const [confirm, setConfirm] = useState<{ student: Student; action: 'deactivate' | 'delete' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusDate, setStatusDate] = useState(() => academicToday());
  const canEdit = center.can_manage;

  useEffect(() => {
    const groupParam = readQueryParam('group');
    if (groupParam) { setGroup(groupParam); setStatus(''); }
    if (readQueryParam('new') === '1' && canEdit) setEditing('new');
  }, [canEdit]);

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const resources = resourcesQuery.data;
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('fr');
    const groupsOfFormation = new Set(resources?.groups.filter((item) => String(item.module_id ?? '') === formation).map((item) => item.id));
    return students.filter((student) => (!status || student.status === status)
      && (!group || (group === 'none' ? !student.group_ids.length : student.group_ids.includes(Number(group))))
      && (!formation || student.group_ids.some((id) => groupsOfFormation.has(id)))
      && (!needle || [student.first_name, student.last_name, studentName(student), student.phone, student.email, student.city].some((value) => value?.toLocaleLowerCase('fr').includes(needle))));
  }, [students, status, group, formation, search, resources]);

  if (studentsQuery.isLoading || resourcesQuery.isLoading) return <LoadingState label="Chargement des étudiants…" rows={6} />;
  if (studentsQuery.isError || resourcesQuery.isError || !resources) return <ErrorState title="Impossible de charger les étudiants" description={timetableError(studentsQuery.error ?? resourcesQuery.error)} onRetry={() => { void studentsQuery.refetch(); void resourcesQuery.refetch(); }} />;

  const active = students.filter((student) => student.status === 'active');
  const withoutGroup = active.filter((student) => !student.group_ids.length).length;
  const activeFilters = [status !== 'active' ? status : '', group, formation].filter(Boolean).length;

  async function confirmAction() {
    if (!confirm || busy) return;
    setBusy(true);
    try {
      if (confirm.action === 'delete') {
        await trainingService.removeStudent(token!, center.id, confirm.student.id);
        cache.remove(confirm.student.id);
        notify(`Dossier de ${studentName(confirm.student)} supprimé.`, 'info');
      } else {
        const next = confirm.student.status === 'active' ? 'inactive' : 'active';
        cache.put(await trainingService.setStatus(token!, center.id, confirm.student.id, next, statusDate));
        notify(next === 'inactive' ? `Dossier de ${studentName(confirm.student)} désactivé.` : `Dossier de ${studentName(confirm.student)} réactivé.`);
      }
      setConfirm(null);
    } catch (failure) {
      notify(timetableError(failure), 'error');
    } finally { setBusy(false); }
  }

  const rows = filtered.map((student) => {
    const groups = student.group_ids.map((id) => resources.groups.find((item) => item.id === id)).filter((item) => !!item);
    return {
      id: String(student.id),
      badge: { label: student.status === 'active' ? 'Actif' : 'Inactif', tone: student.status === 'active' ? 'success' as const : 'neutral' as const },
      cells: [
        <span key="name" className="block min-w-0"><span className="block truncate">{studentName(student)}</span><span className="block truncate text-label-sm font-normal text-amud-on-surface-variant">{[student.phone, student.email].filter(Boolean).join(' · ') || 'Aucun contact'}</span></span>,
        student.level ?? '—',
        groups.length ? <span key="groups" className="flex flex-wrap gap-1">{groups.map((item) => <Badge key={item.id} tone="info">{item.name}</Badge>)}</span> : <span key="none" className="text-amud-on-surface-variant">Aucun groupe</span>,
        new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', dateStyle: 'medium' }).format(new Date(`${student.registered_on}T12:00:00Z`)),
        <span key="status" className="hidden md:inline"><Badge tone={student.status === 'active' ? 'success' : 'neutral'}>{student.status === 'active' ? 'Actif' : 'Inactif'}</Badge></span>,
      ],
      action: canEdit ? <div className="flex flex-wrap items-center justify-end gap-1">
        {student.status === 'active' && <Button size="sm" variant="secondary" icon="group_add" onClick={() => setAssigning(student)}>Affecter à un groupe</Button>}
        <DropdownMenu widthClassName="w-56" trigger={({ open, toggle }) => <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" aria-label={`Autres actions pour ${studentName(student)}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-amud-on-surface-variant hover:bg-amud-surface-container-high"><span className="material-symbols-outlined">more_vert</span></button>}
          items={[
            { label: 'Modifier le dossier', icon: 'edit', onClick: () => setEditing(student) },
            student.status === 'active'
              ? { label: 'Désactiver', icon: 'person_off', onClick: () => { setStatusDate(academicToday()); setConfirm({ student, action: 'deactivate' }); } }
              : { label: 'Réactiver', icon: 'person_check', onClick: () => { setStatusDate(academicToday()); setConfirm({ student, action: 'deactivate' }); } },
            { label: 'Supprimer (saisie erronée)', icon: 'delete', danger: true, onClick: () => setConfirm({ student, action: 'delete' }) },
          ]} />
      </div> : undefined,
    };
  });

  return <div className="space-y-5">
    <CentreHeader section="Pédagogie" title="Étudiants" subtitle={`${active.length} actif${active.length > 1 ? 's' : ''}${withoutGroup ? ` · ${withoutGroup} sans groupe` : ''}`}
      actions={canEdit && <Button icon="person_add" onClick={() => setEditing('new')}>Inscrire un étudiant</Button>} />
    <ReadOnlyHint show={!canEdit} />
    {canEdit && withoutGroup > 0 && status === 'active' && !group && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-3 text-body-md">
      <span>{withoutGroup} étudiant{withoutGroup > 1 ? 's actifs ne sont' : ' actif n’est'} rattaché{withoutGroup > 1 ? 's' : ''} à aucun groupe.</span>
      <Button size="sm" variant="ghost" onClick={() => setGroup('none')}>Afficher</Button>
    </div>}
    <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Nom, téléphone, e-mail…" activeFilterCount={activeFilters}
      onReset={() => { setStatus('active'); setGroup(''); setFormation(''); setSearch(''); }}
      filters={<>
        <SelectFilter label="Tous les statuts" value={status} onChange={setStatus} options={[{ value: 'active', label: 'Actifs' }, { value: 'inactive', label: 'Inactifs' }]} />
        <SelectFilter label="Tous les groupes" value={group} onChange={setGroup} options={[{ value: 'none', label: 'Sans groupe' }, ...resources.groups.map((item) => ({ value: String(item.id), label: item.name }))]} />
        <SelectFilter label="Toutes les formations" value={formation} onChange={setFormation} options={resources.modules.map((item) => ({ value: String(item.id), label: item.name }))} />
      </>} />
    <ResponsiveTable caption="Liste des étudiants" columns={['Étudiant', 'Niveau', 'Groupes', 'Inscription', 'Statut']} rows={rows} pageSize={25}
      empty={students.length
        ? <EmptyState compact icon="search_off" title="Aucun étudiant ne correspond" description="Modifiez la recherche ou les filtres." />
        : <EmptyState icon="group" title="Aucun étudiant inscrit" description="Inscrivez votre premier étudiant, puis affectez-le à un groupe." actionLabel={canEdit ? 'Inscrire un étudiant' : undefined} onAction={canEdit ? () => setEditing('new') : undefined} />} />
    {!resources.groups.length && canEdit && <p className="text-body-md text-amud-on-surface-variant">Aucun groupe n’existe encore. <Link href="/amud/centre/groupes" className="font-semibold text-amud-primary underline">Créer un groupe</Link> pour pouvoir y affecter des étudiants.</p>}

    {editing && <StudentFormModal center={center} resources={resources} student={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)}
      onSaved={(saved, created) => { cache.put(saved); setEditing(null); notify(created ? `Inscription de ${studentName(saved)} enregistrée${saved.group_ids.length ? ', groupe affecté' : ''}.` : 'Dossier mis à jour.'); if (created && !saved.group_ids.length && resources.groups.length) setAssigning(saved); }} />}
    {assigning && <AssignGroupsModal center={center} resources={resources} student={assigning} onClose={() => setAssigning(null)}
      onSaved={(saved) => { cache.put(saved); setAssigning(null); notify(saved.group_ids.length ? `Groupes de ${studentName(saved)} mis à jour.` : `${studentName(saved)} n’est plus dans aucun groupe.`); }} />}
    {confirm?.action === 'delete' && <ConfirmDialog open onClose={() => { if (!busy) setConfirm(null); }} onConfirm={() => void confirmAction()} title="Supprimer ce dossier ?"
      description={`Réservé aux saisies erronées : ${studentName(confirm.student)} sera supprimé définitivement avec ses affectations. Un étudiant ayant des paiements ne peut qu’être désactivé.`} confirmLabel="Supprimer" />}
    {confirm?.action === 'deactivate' && (() => {
      const deactivating = confirm.student.status === 'active';
      return <Modal open onClose={() => { if (!busy) setConfirm(null); }} title={deactivating ? 'Désactiver cet étudiant ?' : 'Réactiver cet étudiant ?'} subtitle={studentName(confirm.student)}
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setConfirm(null)}>Annuler</Button><Button variant={deactivating ? 'danger' : 'primary'} loading={busy} disabled={!statusDate} onClick={() => void confirmAction()}>{deactivating ? 'Désactiver' : 'Réactiver'}</Button></div>}>
        <p className="text-body-md text-amud-on-surface-variant">{deactivating
          ? 'L’étudiant quitte ses groupes à cette date et n’apparaît plus dans les rapports des mois suivants. Son historique et ses paiements sont conservés.'
          : 'L’étudiant redevient actif à cette date. Affectez-le ensuite à un groupe ; la période d’inactivité reste dans l’historique.'}</p>
        <Field label={deactivating ? 'Inactif à partir du' : 'Actif à partir du'} className="mt-4"><input type="date" required max={academicToday()} value={statusDate} onChange={(event) => setStatusDate(event.target.value)} className={inputClass} /></Field>
      </Modal>;
    })()}
  </div>;
}

export type StudentModalProps = { center: TimetableCenter; resources: TimetableResources; student?: Student; onClose: () => void };
