'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge, Button, EmptyState, Modal, SearchInput } from '@/components/amud/ui';
import { timetableError } from '@/lib/amud/services/timetableService';
import { formatDay, studentName, trainingService, type Student } from '@/lib/amud/services/trainingService';
import { academicToday } from '@/lib/amud/timetable/calendar';
import { inputClass } from './shared';
import { useTimetableScope } from '@/lib/amud/timetable/useTimetable';
import type { StudentModalProps } from './StudentsWorkspace';

/** "Affecter à un groupe": pick one or more groups; current memberships are pre-checked. */
export function AssignGroupsModal({ center, resources, student, onClose, onSaved }: StudentModalProps & { student: Student; onSaved: (student: Student) => void }) {
  const { token } = useTimetableScope();
  const [selected, setSelected] = useState<number[]>(student.group_ids);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [effectiveOn, setEffectiveOn] = useState(() => academicToday());
  const name = (kind: 'modules' | 'teachers' | 'rooms', id?: number | null) => (id ? resources[kind].find((item) => item.id === id)?.name : undefined);
  const needle = search.trim().toLocaleLowerCase('fr');
  const groups = resources.groups.filter((group) => !needle || [group.name, name('modules', group.module_id)].some((value) => value?.toLocaleLowerCase('fr').includes(needle)));
  const added = selected.filter((id) => !student.group_ids.includes(id));
  const removed = student.group_ids.filter((id) => !selected.includes(id));
  const changed = added.length + removed.length > 0;
  const past = student.memberships.filter((membership) => membership.ended_on).reverse();
  const groupName = (id: number) => resources.groups.find((group) => group.id === id)?.name ?? 'Groupe supprimé';

  function toggle(id: number) { setError(''); setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  async function save() {
    if (saving || !changed) return;
    setSaving(true); setError('');
    try { onSaved(await trainingService.setGroups(token!, center.id, student.id, selected, effectiveOn)); }
    catch (failure) { setError(timetableError(failure)); }
    finally { setSaving(false); }
  }

  return <Modal open onClose={() => { if (!saving) onClose(); }} title="Affecter à un groupe" subtitle={studentName(student)} widthClassName="max-w-xl"
    footer={<div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-label-sm text-amud-on-surface-variant">{changed ? [added.length && `${added.length} ajout${added.length > 1 ? 's' : ''}`, removed.length && `${removed.length} retrait${removed.length > 1 ? 's' : ''}`].filter(Boolean).join(' · ') : 'Aucune modification'}</p>
      <div className="flex gap-2"><Button variant="secondary" disabled={saving} onClick={onClose}>Annuler</Button><Button loading={saving} loadingLabel="Enregistrement…" disabled={!changed} onClick={() => void save()}>Enregistrer</Button></div>
    </div>}>
    {!resources.groups.length ? <EmptyState compact icon="diversity_3" title="Aucun groupe" description="Créez d’abord un groupe pour y affecter des étudiants." /> : <>
      {resources.groups.length > 6 && <div className="mb-3"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher un groupe ou une formation…" /></div>}
      <ul className="max-h-[50vh] space-y-2 overflow-auto" aria-label="Groupes disponibles">
        {groups.map((group) => {
          const checked = selected.includes(group.id);
          const current = student.group_ids.includes(group.id);
          const count = (group.student_count ?? 0) - (current ? 1 : 0) + (checked ? 1 : 0);
          const full = group.capacity != null && !current && (group.student_count ?? 0) >= group.capacity;
          const details = [name('modules', group.module_id), name('teachers', group.teacher_id), name('rooms', group.room_id)].filter(Boolean).join(' · ');
          return <li key={group.id}>
            <label className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${checked ? 'border-amud-primary bg-amud-primary/5' : 'border-amud-outline-variant hover:bg-amud-surface-container-low'} ${full ? 'cursor-not-allowed opacity-60' : ''}`}>
              <input type="checkbox" className="h-5 w-5 accent-[var(--amud-primary)]" checked={checked} disabled={full || saving} onChange={() => toggle(group.id)} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold text-amud-on-surface">{group.name}{current && <Badge tone="success">Actuel</Badge>}{full && <Badge tone="danger">Complet</Badge>}</span>
                <span className="block truncate text-label-sm text-amud-on-surface-variant">{details || 'Formation non renseignée'}</span>
              </span>
              <span className="shrink-0 text-label-sm text-amud-on-surface-variant">{count}{group.capacity != null ? `/${group.capacity}` : ''} étudiant{count > 1 ? 's' : ''}</span>
            </label>
          </li>;
        })}
        {!groups.length && <li className="p-3 text-body-md text-amud-on-surface-variant">Aucun groupe ne correspond.</li>}
      </ul>
      {student.group_ids.length > 0 && <p className="mt-3 text-label-sm text-amud-on-surface-variant">Décochez un groupe actuel pour retirer l’étudiant ; cochez-en un autre pour le changer de groupe.</p>}
      {changed && <label className="mt-4 block text-label-md text-amud-on-surface-variant">Changement effectif à partir du
        <input type="date" required max={academicToday()} value={effectiveOn} onChange={(event) => { setEffectiveOn(event.target.value); setError(''); }} className={`mt-1 ${inputClass}`} />
        <span className="mt-1 block text-label-sm">Les mois précédents conservent les groupes d’origine dans les rapports.</span>
      </label>}
      {past.length > 0 && <details className="mt-4 rounded-lg border border-amud-outline-variant p-3 text-body-md">
        <summary className="cursor-pointer text-label-md font-semibold">Historique des groupes ({past.length})</summary>
        <ul className="mt-2 space-y-1">{past.map((membership) => <li key={membership.id} className="flex flex-wrap justify-between gap-2 text-label-md">
          <span>{groupName(membership.group_id)}</span><span className="text-amud-on-surface-variant">{formatDay(membership.joined_on)} → {formatDay(membership.ended_on!)}</span>
        </li>)}</ul>
      </details>}
    </>}
    <p className="mt-3 text-label-sm"><Link href="/amud/centre/groupes" className="font-semibold text-amud-primary underline">Gérer les groupes</Link></p>
    {error && <p role="alert" className="mt-3 rounded-lg bg-amud-error-container p-3 text-body-md text-amud-on-error-container">{error}</p>}
  </Modal>;
}
