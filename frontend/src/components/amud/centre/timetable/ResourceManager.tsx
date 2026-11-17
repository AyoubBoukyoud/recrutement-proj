'use client';

import { useState } from 'react';
import { Button, Modal, SegmentedControl } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { apiPut } from '@/lib/api';
import { RESOURCE_LABELS, timetableError, timetablePath, timetableService, type ResourceKind, type TimetableResource, type TimetableResources } from '@/lib/amud/services/timetableService';
import { useRefreshTimetable, useTimetableScope } from '@/lib/amud/timetable/useTimetable';

export function ResourceManager({ resources, onClose }: { resources: TimetableResources; onClose: () => void }) {
  const { center, user, token } = useTimetableScope();
  const refresh = useRefreshTimetable();
  const notify = useToast();
  const [kind, setKind] = useState<ResourceKind>('rooms');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<TimetableResource | null>(null);
  const [deleting, setDeleting] = useState<TimetableResource | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [memberId, setMemberId] = useState('');
  const [memberRole, setMemberRole] = useState('COORDINATOR');
  async function run(action: () => Promise<unknown>, done: () => void) {
    if (busy || !center?.can_manage) return;
    setBusy(true); setError('');
    try { await action(); await refresh(); done(); notify('Modifications enregistrées.'); }
    catch (failure) { setError(timetableError(failure)); }
    finally { setBusy(false); }
  }
  function reset() { setName(''); setEditing(null); setDeleting(null); setError(''); }
  return <Modal open onClose={() => { if (!busy) onClose(); }} title="Ressources pédagogiques" subtitle={center?.name} widthClassName="max-w-2xl" footer={<Button variant="secondary" disabled={busy} onClick={onClose}>Fermer</Button>}>
    <SegmentedControl label="Type de ressource" value={kind} options={(Object.keys(RESOURCE_LABELS) as ResourceKind[]).map((value) => ({ value, label: RESOURCE_LABELS[value] }))} onChange={(next) => { if (!busy) { setKind(next); reset(); } }} />
    <form className="mt-4 flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); void run(() => timetableService.saveResource(token!, center!.id, kind, name.trim(), editing?.id), reset); }}>
      <label className="flex-1 text-label-md">{editing ? 'Modifier le nom' : 'Ajouter une ressource'}<input required maxLength={150} disabled={busy} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 outline-none focus:ring-2 focus:ring-amud-primary" /></label>
      <Button type="submit" loading={busy} disabled={!name.trim()}>{editing ? 'Enregistrer' : 'Ajouter'}</Button>
      {editing && <Button variant="ghost" disabled={busy} onClick={reset}>Annuler</Button>}
    </form>
    <ul className="mt-4 max-h-60 divide-y divide-amud-outline-variant overflow-auto rounded-lg border border-amud-outline-variant">
      {resources[kind].map((resource) => <li key={resource.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-body-md">
        <span>{resource.name}</span><div className="flex gap-1"><Button variant="ghost" size="sm" disabled={busy} onClick={() => { setEditing(resource); setName(resource.name); setDeleting(null); }}>Modifier</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => setDeleting(resource)}>Supprimer</Button></div>
      </li>)}
      {!resources[kind].length && <li className="p-4 text-body-md text-amud-on-surface-variant">Aucune ressource enregistrée.</li>}
    </ul>
    {deleting && <div role="alert" className="mt-3 rounded-lg border border-amud-error/30 p-3 text-body-md"><p>Supprimer « {deleting.name} » ? Les ressources utilisées par un cours sont protégées.</p><div className="mt-2 flex gap-2"><Button variant="secondary" disabled={busy} onClick={() => setDeleting(null)}>Annuler</Button><Button variant="danger" loading={busy} onClick={() => void run(() => timetableService.removeResource(token!, center!.id, kind, deleting.id), reset)}>Confirmer</Button></div></div>}
    {user?.roles?.includes('Administrator') && <details className="mt-5 rounded-lg border border-amud-outline-variant p-3 text-body-md">
      <summary className="cursor-pointer font-semibold">Accès des membres du centre</summary>
      <p className="mt-2 text-amud-on-surface-variant">Saisissez l’identifiant d’un compte existant avec le rôle Training Center.</p>
      <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void run(() => apiPut(`${timetablePath(center!.id)}/members`, { user_id: Number(memberId), role: memberRole || null }, token), () => setMemberId('')); }}>
        <input aria-label="Identifiant du compte" required type="number" min="1" value={memberId} onChange={(event) => setMemberId(event.target.value)} className="min-h-[44px] w-36 rounded-lg border border-amud-outline-variant bg-amud-surface px-3" />
        <select aria-label="Rôle du membre" value={memberRole} onChange={(event) => setMemberRole(event.target.value)} className="min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-3">
          <option value="CENTER_OWNER">Propriétaire</option><option value="CENTER_ADMIN">Administrateur</option><option value="COORDINATOR">Coordinateur</option><option value="TEACHER">Enseignant · lecture</option><option value="ACCOUNTANT">Comptable · lecture</option><option value="STUDENT">Étudiant · lecture</option><option value="">Retirer l’accès</option>
        </select>
        <Button type="submit" loading={busy}>Appliquer</Button>
      </form>
    </details>}
    {error && <p role="alert" className="mt-3 text-body-md text-amud-error">{error}</p>}
  </Modal>;
}
