'use client';

import { useState, type FormEvent } from 'react';
import { Button, Modal } from '@/components/amud/ui';
import { ApiError } from '@/lib/api';
import { timetableError } from '@/lib/amud/services/timetableService';
import { STUDENT_LEVELS, trainingService, type Student, type StudentDraft } from '@/lib/amud/services/trainingService';
import { academicToday } from '@/lib/amud/timetable/calendar';
import { useTimetableScope } from '@/lib/amud/timetable/useTimetable';
import { Field, inputClass } from './shared';
import type { StudentModalProps } from './StudentsWorkspace';

type Errors = Partial<Record<keyof StudentDraft | 'form', string>>;

export function StudentFormModal({ center, resources, student, onClose, onSaved }: StudentModalProps & { onSaved: (student: Student, created: boolean) => void }) {
  const { token } = useTimetableScope();
  const [draft, setDraft] = useState<StudentDraft>(() => student
    ? { first_name: student.first_name, last_name: student.last_name, phone: student.phone ?? '', email: student.email ?? '', city: student.city ?? '', level: student.level ?? '', notes: student.notes ?? '', registered_on: student.registered_on }
    : { first_name: '', last_name: '', phone: '', email: '', city: '', level: '', notes: '', registered_on: academicToday(), group_ids: [] });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<StudentDraft>) => { setDraft((current) => ({ ...current, ...patch })); setErrors({}); };

  function validate(): Errors {
    const next: Errors = {};
    if (!draft.first_name.trim()) next.first_name = 'Le prénom est obligatoire.';
    if (!draft.last_name.trim()) next.last_name = 'Le nom est obligatoire.';
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) next.email = 'Adresse e-mail invalide.';
    if (draft.phone && !/^\+?[0-9 ().-]{6,30}$/.test(draft.phone)) next.phone = 'Numéro invalide (chiffres, espaces, + autorisés).';
    return next;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const found = validate();
    if (Object.keys(found).length) { setErrors(found); return; }
    setSaving(true);
    try {
      const payload: StudentDraft = { ...draft, level: draft.level || null, group_ids: student ? undefined : draft.group_ids };
      onSaved(await trainingService.saveStudent(token!, center.id, payload, student?.id), !student);
    } catch (failure) {
      const fields = failure instanceof ApiError ? failure.payload.errors as Record<string, string[]> | undefined : undefined;
      setErrors(fields ? Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key.startsWith('group_ids') ? 'form' : key, messages[0]])) : { form: timetableError(failure) });
    } finally { setSaving(false); }
  }

  const groups = resources.groups;
  return <Modal open onClose={() => { if (!saving) onClose(); }} title={student ? 'Modifier le dossier' : 'Inscrire un étudiant'} subtitle={center.name} widthClassName="max-w-2xl"
    footer={<div className="flex justify-end gap-2"><Button variant="secondary" disabled={saving} onClick={onClose}>Annuler</Button><Button type="submit" form="student-form" loading={saving} loadingLabel="Enregistrement…">{student ? 'Enregistrer' : 'Inscrire'}</Button></div>}>
    <form id="student-form" noValidate onSubmit={submit} className="space-y-4">
      <fieldset disabled={saving} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prénom" required error={errors.first_name}><input autoFocus maxLength={100} value={draft.first_name} onChange={(event) => set({ first_name: event.target.value })} className={inputClass} aria-invalid={!!errors.first_name} /></Field>
        <Field label="Nom" required error={errors.last_name}><input maxLength={100} value={draft.last_name} onChange={(event) => set({ last_name: event.target.value })} className={inputClass} aria-invalid={!!errors.last_name} /></Field>
        <Field label="Téléphone" error={errors.phone}><input type="tel" inputMode="tel" maxLength={30} placeholder="+212 6 12 34 56 78" value={draft.phone ?? ''} onChange={(event) => set({ phone: event.target.value })} className={inputClass} /></Field>
        <Field label="E-mail" error={errors.email}><input type="email" maxLength={150} value={draft.email ?? ''} onChange={(event) => set({ email: event.target.value })} className={inputClass} /></Field>
        <Field label="Ville" error={errors.city}><input maxLength={100} value={draft.city ?? ''} onChange={(event) => set({ city: event.target.value })} className={inputClass} /></Field>
        <Field label="Niveau actuel" error={errors.level}><select value={draft.level ?? ''} onChange={(event) => set({ level: event.target.value })} className={inputClass}><option value="">Non évalué</option>{STUDENT_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}</select></Field>
        <Field label="Date d’inscription" error={errors.registered_on}><input type="date" required value={draft.registered_on ?? ''} onChange={(event) => set({ registered_on: event.target.value })} className={inputClass} /></Field>
        {!student && <Field label="Groupe" hint={groups.length ? 'Facultatif — vous pourrez l’affecter plus tard.' : 'Aucun groupe créé pour le moment.'}>
          <select disabled={!groups.length} value={draft.group_ids?.[0] ?? ''} onChange={(event) => set({ group_ids: event.target.value ? [Number(event.target.value)] : [] })} className={inputClass}>
            <option value="">Sans groupe</option>
            {groups.map((group) => { const full = group.capacity != null && (group.student_count ?? 0) >= group.capacity; return <option key={group.id} value={group.id} disabled={full}>{group.name}{full ? ' — complet' : ''}</option>; })}
          </select>
        </Field>}
        <Field label="Notes" className="sm:col-span-2" error={errors.notes}><textarea rows={3} maxLength={2000} value={draft.notes ?? ''} onChange={(event) => set({ notes: event.target.value })} className={inputClass} /></Field>
      </fieldset>
      {errors.form && <p role="alert" className="rounded-lg bg-amud-error-container p-3 text-body-md text-amud-on-error-container">{errors.form}</p>}
    </form>
  </Modal>;
}
