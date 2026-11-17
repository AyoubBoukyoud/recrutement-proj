'use client';

import { useEffect, useState } from 'react';
import { Button, Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { ApiError } from '@/lib/api';
import { timetableError, timetableService, type Availability, type SessionDraft, type TimetableResources, type TimetableSession } from '@/lib/amud/services/timetableService';
import { useRefreshTimetable, useTimetableScope } from '@/lib/amud/timetable/useTimetable';
import { SearchableSelect } from './SearchableSelect';

export type SessionAssignmentFormProps = {
  initial: SessionDraft;
  session?: TimetableSession;
  resources: TimetableResources;
  onClose: () => void;
};

export function SessionAssignmentForm({ initial, session, resources, onClose }: SessionAssignmentFormProps) {
  const { center, token } = useTimetableScope();
  const refresh = useRefreshTimetable();
  const notify = useToast();
  const [draft, setDraft] = useState(initial);
  const [requestKey] = useState(() => crypto.randomUUID());
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const allowed = !!center?.can_manage;
  const valid = Object.values({ teacher: draft.teacher_id, module: draft.module_id, group: draft.group_id, room: draft.room_id }).every(Boolean)
    && !!draft.date && !!draft.start_time && !!draft.end_time && draft.end_time > draft.start_time;

  useEffect(() => {
    let current = true;
    setAvailability(null);
    setError('');
    if (!valid || !token || !center || !allowed) { setChecking(false); return; }
    setChecking(true);
    const timer = setTimeout(() => {
      timetableService.availability(token, center.id, draft, session?.id).then((result) => {
        if (current) setAvailability(result);
      }).catch((failure: unknown) => {
        if (current) setError(timetableError(failure));
      }).finally(() => { if (current) setChecking(false); });
    }, 300);
    return () => { current = false; clearTimeout(timer); };
  }, [draft, session?.id, valid, token, center, allowed]);

  function patch(patch: Partial<SessionDraft>) { setDraft((current) => ({ ...current, ...patch })); setAvailability(null); }
  function close() { if (!saving) onClose(); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !allowed || !center || !token || saving || !availability?.available) return;
    setSaving(true); setError('');
    try {
      const saved = await timetableService.save(token, center.id, draft, requestKey, session);
      void refresh(saved);
      notify(session ? 'Cours mis à jour.' : 'Cours ajouté au planning.');
      onClose();
    } catch (failure) {
      setError(timetableError(failure));
      if (failure instanceof ApiError && failure.payload.conflicts) setAvailability(failure.payload as Availability);
      void refresh();
    } finally { setSaving(false); }
  }
  async function remove() {
    if (!session || !center || !token || saving || !allowed) return;
    setSaving(true); setError('');
    try {
      await timetableService.remove(token, center.id, session);
      void refresh(undefined, session.id); notify('Cours supprimé.', 'info'); onClose();
    } catch (failure) { setError(timetableError(failure)); void refresh(); }
    finally { setSaving(false); }
  }
  const inputClass = 'min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60';
  const day = draft.date ? new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'long' }).format(new Date(`${draft.date}T12:00:00Z`)) : '';
  return <Modal open onClose={close} title={session ? (allowed ? 'Détails et modification du cours' : 'Détails du cours') : 'Planifier un cours'} subtitle={`${day} · Africa/Casablanca`} widthClassName="max-w-2xl" footer={<div className="flex flex-wrap items-center justify-end gap-2">
    {session && allowed && <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={saving}>Supprimer</Button>}
    <Button variant="secondary" onClick={close} disabled={saving}>{allowed ? 'Annuler' : 'Fermer'}</Button>
    {allowed && <Button type="submit" form="timetable-session-form" loading={saving} loadingLabel="Enregistrement…" disabled={!valid || checking || !availability?.available}>Enregistrer</Button>}
  </div>}>
    <form id="timetable-session-form" onSubmit={submit} className="space-y-4">
      <fieldset disabled={!allowed || saving} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SearchableSelect label="Professeur" value={draft.teacher_id} options={resources.teachers} onChange={(teacher_id) => patch({ teacher_id })} disabled={!allowed || saving} />
        <SearchableSelect label="Module" value={draft.module_id} options={resources.modules} onChange={(module_id) => patch({ module_id })} disabled={!allowed || saving} />
        <SearchableSelect label="Groupe" value={draft.group_id} options={resources.groups} onChange={(group_id) => patch({ group_id })} disabled={!allowed || saving} />
        <SearchableSelect label="Salle" value={draft.room_id} options={resources.rooms} onChange={(room_id) => patch({ room_id })} disabled={!allowed || saving} />
        <label className="text-label-md text-amud-on-surface-variant">Date · {day}<input required type="date" value={draft.date} onChange={(event) => patch({ date: event.target.value })} className={`mt-1 ${inputClass}`} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-label-md text-amud-on-surface-variant">Début<input required type="time" value={draft.start_time} onChange={(event) => patch({ start_time: event.target.value })} className={`mt-1 ${inputClass}`} /></label>
          <label className="text-label-md text-amud-on-surface-variant">Fin<input required type="time" value={draft.end_time} onChange={(event) => patch({ end_time: event.target.value })} className={`mt-1 ${inputClass}`} /></label>
        </div>
      </fieldset>
      {draft.end_time <= draft.start_time && <p role="alert" className="text-body-md text-amud-error">L’heure de fin doit être postérieure à l’heure de début.</p>}
      <div aria-live="polite" className="text-body-md">
        {checking && <p className="text-amud-on-surface-variant">Vérification des disponibilités…</p>}
        {!checking && availability?.available && <p className="text-amud-primary">Professeur, groupe et salle disponibles.</p>}
        {!!availability?.conflicts.length && <div className="rounded-lg border border-amud-error/30 bg-amud-error-container/30 p-3 text-amud-error">
          <p className="font-semibold">Conflit de planning</p>
          <ul className="mt-1 list-inside list-disc">{availability.conflicts.map((conflict, index) => <li key={index}>{conflict.message}</li>)}</ul>
          {!!availability.alternatives.length && <div className="mt-3 flex flex-wrap gap-2"><span className="w-full">Créneaux disponibles le même jour :</span>{availability.alternatives.map((slot) => <Button key={slot.start_time} variant="secondary" size="sm" disabled={saving} onClick={() => patch(slot)}>{slot.start_time}–{slot.end_time}</Button>)}</div>}
        </div>}
      </div>
      {error && <p role="alert" className="rounded-lg bg-amud-error-container p-3 text-body-md text-amud-on-error-container">{error}</p>}
      {confirmDelete && <div role="alert" className="rounded-lg border border-amud-error/40 p-3 text-body-md">
        <p>Supprimer définitivement le cours du {session?.date}, {session?.start_time}–{session?.end_time} ?</p>
        <div className="mt-3 flex gap-2"><Button variant="secondary" disabled={saving} onClick={() => setConfirmDelete(false)}>Conserver</Button><Button variant="danger" loading={saving} onClick={() => void remove()}>Confirmer la suppression</Button></div>
      </div>}
    </form>
  </Modal>;
}
