'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import { ConfirmDialog, Modal, useDropdown } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';

/*
 * Équipe — porte le style de la maquette `/amud/entreprise/equipe` sur
 * `GET/POST/PATCH/DELETE /recruiter/team`, nouvel endpoint. C'est un annuaire
 * de contacts internes ("qui prévenir côté recrutement"), pas un second
 * moyen de se connecter : `company_profiles.user_id` reste unique en base
 * (un seul compte porte la connexion de l'entreprise), donc ajouter un
 * membre ici ne crée aucun compte ni aucun accès à la plateforme.
 */
type Role = 'admin' | 'recruiter' | 'assistant';
type Member = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  role: Role;
  status: 'active' | 'inactive';
};

const ROLE_LABEL: Record<Role, string> = { admin: 'Admin entreprise', recruiter: 'Recruteur', assistant: 'Assistant recrutement' };
const ROLE_CLASS: Record<Role, string> = {
  admin: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  recruiter: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  assistant: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
};
const STATUS_CLASS: Record<Member['status'], string> = {
  active: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  inactive: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
};

type FormState = { name: string; email: string; phone: string; position: string; role: Role };
const EMPTY_FORM: FormState = { name: '', email: '', phone: '', position: '', role: 'recruiter' };

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    return (data?.errors ? Object.values(data.errors)[0]?.[0] : undefined) ?? data?.message ?? fallback;
  }
  return fallback;
}

function RowMenu({ member, onEdit, onToggle, onDelete }: { member: Member; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const menu = useDropdown<HTMLDivElement>();
  return (
    <div ref={menu.ref} className="relative">
      <button onClick={() => menu.setOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full text-amud-on-surface-variant hover:bg-amud-surface-container-high hover:text-amud-primary" aria-label="Actions">
        <span className="material-symbols-outlined">more_vert</span>
      </button>
      {menu.open ? (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface py-1 shadow-lg animate-amud-fade-in">
          <button onClick={() => { onEdit(); menu.setOpen(false); }} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Modifier
          </button>
          <button onClick={() => { onToggle(); menu.setOpen(false); }} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            {member.status === 'active' ? 'Désactiver' : 'Activer'}
          </button>
          <button onClick={() => { onDelete(); menu.setOpen(false); }} className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low">
            Retirer
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function RecruiterEquipePage() {
  const notify = useToast();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const team = useQuery({
    queryKey: ['recruiter-team'],
    queryFn: () => api.get('/recruiter/team').then((r) => r.data as Member[]),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['recruiter-team'] });

  const create = useMutation({
    mutationFn: (body: { name: string; email: string; phone?: string; position?: string; role: Role }) => api.post('/recruiter/team', body),
    onSuccess: () => {
      notify('Membre ajouté à l’équipe.');
      setModalOpen(false);
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<FormState> & { status?: Member['status'] } }) => api.patch(`/recruiter/team/${id}`, body),
    onSuccess: () => {
      notify('Membre mis à jour.');
      setModalOpen(false);
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/recruiter/team/${id}`),
    onSuccess: () => {
      notify('Membre retiré de l’équipe.', 'info');
      setConfirmDeleteId(null);
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Suppression impossible.'), 'error'),
  });

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(member: Member) {
    setEditing(member);
    setForm({ name: member.name, email: member.email, phone: member.phone ?? '', position: member.position ?? '', role: member.role });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, position: form.position.trim() || undefined, role: form.role };
    if (editing) update.mutate({ id: editing.id, body });
    else create.mutate(body);
  }

  const members = team.data ?? [];
  const pending = create.isPending || update.isPending;

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Équipe</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez l’annuaire de votre équipe recrutement.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-amud-primary px-lg py-3 text-label-md font-medium text-white shadow-sm hover:brightness-110">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Ajouter un membre
        </button>
      </div>

      {team.isLoading ? (
        <p className="text-body-md text-amud-on-surface-variant">Chargement…</p>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
          <p className="text-body-md font-medium text-amud-on-surface">Aucun membre dans l’équipe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
              <div className="flex items-start justify-between gap-sm">
                <div className="flex items-center gap-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amud-primary-fixed text-[13px] font-bold text-amud-on-primary-fixed">{initials(member.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-amud-on-surface">{member.name}</p>
                    <p className="truncate text-label-sm text-amud-on-surface-variant">{member.position || ROLE_LABEL[member.role]}</p>
                  </div>
                </div>
                <RowMenu
                  member={member}
                  onEdit={() => openEdit(member)}
                  onToggle={() => update.mutate({ id: member.id, body: { status: member.status === 'active' ? 'inactive' : 'active' } })}
                  onDelete={() => setConfirmDeleteId(member.id)}
                />
              </div>
              <div className="flex flex-wrap gap-1">
                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${ROLE_CLASS[member.role]}`}>{ROLE_LABEL[member.role]}</span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${STATUS_CLASS[member.status]}`}>{member.status === 'active' ? 'Actif' : 'Inactif'}</span>
              </div>
              <div className="mt-1 flex flex-col gap-0.5 border-t border-amud-outline-variant pt-sm text-label-sm text-amud-on-surface-variant">
                <span className="flex items-center gap-1 truncate">
                  <span className="material-symbols-outlined text-[16px]">mail</span> {member.email}
                </span>
                {member.phone ? (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">call</span> {member.phone}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le membre' : 'Ajouter un membre'}>
        <form id="equipe-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom complet *</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email *</label>
            <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="email" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="tel" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Poste</label>
            <input value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="Recruteur Tech" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Rôle</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {(['admin', 'recruiter', 'assistant'] as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        </form>
        <div className="mt-lg flex justify-end gap-sm">
          <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="equipe-form" disabled={pending} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm hover:brightness-110 disabled:opacity-50">
            {pending ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId !== null && remove.mutate(confirmDeleteId)}
        title="Retirer ce membre de l’équipe ?"
        description="Cette action est irréversible."
        confirmLabel="Retirer"
      />
    </div>
  );
}
