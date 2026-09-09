'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/opsApi';
import { useAuth } from '@/context/AuthContext';
import { destinationForRole } from '@/lib/roleDestination';
import { toInternationalPhone } from '@/lib/phoneNumber';
import type { PaginatedResponse } from '@/types/candidate';
import type { UserRole } from '@/lib/types';
import { Avatar, Badge, Button, DropdownMenu, FilterBar, Modal, PageHeader, type BadgeTone } from '@/components/amud/ui';
import { SelectField, TextField } from '@/components/amud/form';
import { useToast } from '@/components/amud/Toast';
import { Pagination } from '@/components/Pagination';

/*
 * Utilisateurs et rôles — porte le style de la maquette `/amud/admin/utilisateurs`
 * (recherche/filtres, tableau avec avatar, menu d'action) sur la page déjà
 * pleinement fonctionnelle (`/admin/users*`) : même logique métier (création,
 * changement de rôle, blocage, suppression, « voir son compte »), seule la
 * présentation change.
 */
type AdminUser = {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  roles: string[];
  status: 'active' | 'inactive' | 'blocked';
  status_reason: string | null;
  has_candidate_profile: boolean;
  created_at: string;
};

const ROLE_PRIORITY = ['Administrator', 'Company', 'Commercial Agent', 'User'] as const;

const ROLE_LABELS: Record<string, string> = {
  Administrator: 'Administrateur',
  Company: 'Recruteur',
  'Commercial Agent': 'Agent commercial',
  User: 'Candidat',
};

const ROLE_DESTINATION: Record<string, string> = {
  Administrator: '/admin',
  Company: '/recruiter',
  'Commercial Agent': '/agent',
  User: '/dashboard',
};

const STATUS_LABEL: Record<AdminUser['status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  blocked: 'Bloqué',
};

const STATUS_TONE: Record<AdminUser['status'], BadgeTone> = {
  active: 'success',
  inactive: 'neutral',
  blocked: 'danger',
};

const APP_ROLE_BY_BACKEND_NAME: Record<string, UserRole> = {
  Administrator: 'admin',
  Company: 'employer',
  'Commercial Agent': 'agent',
  User: 'candidate',
};

function roleForApp(roles: string[]): UserRole {
  const role = effectiveRole(roles);
  return role ? APP_ROLE_BY_BACKEND_NAME[role] : 'candidate';
}

function effectiveRole(roles: string[]): string | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

function displayName(user: AdminUser) {
  return user.name?.trim() || user.phone;
}

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
    return firstFieldError ?? data?.message ?? fallback;
  }
  return fallback;
}

export default function AdminUtilisateursPage() {
  const notify = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const { user: currentUser, impersonate } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<AdminUser | null>(null);
  const [blocking, setBlocking] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const roles = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/admin/roles').then((r) => r.data as string[]),
  });

  const users = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: () =>
      api
        .get('/admin/users', { params: { q: search || undefined, role: roleFilter || undefined, page } })
        .then((r) => r.data as PaginatedResponse<AdminUser>),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => api.patch(`/admin/users/${id}/roles`, { roles: [role] }),
    onSuccess: () => {
      notify('Rôle mis à jour.');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.patch(`/admin/users/${id}`, { name }),
    onSuccess: () => {
      setRenaming(null);
      notify('Compte renommé.');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Modification impossible.'), 'error'),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) =>
      api.patch(`/admin/users/${id}/status`, { status, status_reason: reason || null }),
    onSuccess: (_data, variables) => {
      setBlocking(null);
      notify(`Statut mis à jour : ${STATUS_LABEL[variables.status as AdminUser['status']]}.`);
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      setDeleting(null);
      notify('Compte supprimé.', 'info');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Suppression impossible.'), 'error'),
  });

  const openAs = useMutation({
    mutationFn: (user: AdminUser) =>
      api.post(`/admin/users/${user.id}/impersonate`).then(
        (r) => r.data as { token: string; user: { id: number; name: string | null; phone: string; roles: string[] } },
      ),
    onSuccess: (data) => {
      const role = roleForApp(data.user.roles);
      impersonate(data.token, {
        id: String(data.user.id),
        role,
        name: data.user.name || data.user.phone,
        phone: data.user.phone,
        roles: data.user.roles,
      });
      router.push(destinationForRole(role, null));
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const createUser = useMutation({
    mutationFn: (body: { name: string; phone: string; roles: string[] }) => api.post('/admin/users', body),
    onSuccess: () => {
      setCreating(false);
      notify('Compte créé.');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Création impossible.'), 'error'),
  });

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const rows = users.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Utilisateurs et rôles"
        subtitle="Le rôle décide de l’espace vers lequel la connexion redirige. Bloquer un compte l’empêche de recevoir un code — c’est cela qui arrête un accès, pas le retrait d’un rôle."
        actionLabel="Créer un compte"
        onAction={() => setCreating(true)}
      />

      <form onSubmit={submitSearch}>
        <FilterBar
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Nom, téléphone ou e-mail…"
          filters={
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="min-h-[44px] w-full shrink-0 rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary md:w-auto"
            >
              <option value="">Tous les rôles</option>
              {(roles.data ?? []).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] ?? role}
                </option>
              ))}
            </select>
          }
          trailing={
            <button type="submit" className="min-h-[44px] rounded-lg border border-amud-outline-variant px-lg text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
              Filtrer
            </button>
          }
        />
      </form>

      <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50">
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Compte</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Rôle</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Statut</th>
              <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {users.isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Chargement…
                </td>
              </tr>
            ) : null}
            {!users.isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Aucun compte ne correspond. Un recruteur qui ne s’est jamais connecté n’existe pas encore — demandez-lui de se connecter avec son numéro, ou créez le compte.
                </td>
              </tr>
            ) : null}
            {rows.map((u) => {
              const role = effectiveRole(u.roles);
              const isSelf = currentUser?.id === String(u.id);
              return (
                <tr key={u.id} className="transition-colors hover:bg-amud-surface-container-lowest/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={displayName(u)} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold text-amud-on-surface">
                          <span className={u.name ? '' : 'text-amud-on-surface-variant'}>{displayName(u)}</span>
                          {isSelf ? <Badge tone="info">vous</Badge> : null}
                        </p>
                        <p className="truncate text-label-sm text-amud-on-surface-variant">
                          {u.name ? u.phone : 'Sans nom'}
                          {u.email ? ` · ${u.email}` : ''}
                          {u.has_candidate_profile ? ' · dossier candidat' : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <label className="sr-only" htmlFor={`role-${u.id}`}>
                      Rôle de {displayName(u)}
                    </label>
                    <select
                      id={`role-${u.id}`}
                      value={role ?? ''}
                      disabled={updateRole.isPending}
                      onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                      className="h-10 w-full max-w-[190px] rounded-lg border border-amud-outline-variant bg-amud-surface px-2.5 text-label-md text-amud-on-surface transition-colors focus:border-amud-primary focus:outline-none focus:ring-2 focus:ring-amud-primary/20 disabled:opacity-50"
                    >
                      {role === null ? <option value="">— Aucun rôle —</option> : null}
                      {(roles.data ?? []).map((name) => (
                        <option key={name} value={name}>
                          {ROLE_LABELS[name] ?? name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 font-mono text-label-sm text-amud-on-surface-variant">
                      {role ? ROLE_DESTINATION[role] : 'ne peut pas se connecter'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge tone={STATUS_TONE[u.status]}>{STATUS_LABEL[u.status]}</Badge>
                    {u.status_reason ? (
                      <p className="mt-1 max-w-[160px] truncate text-label-sm text-amud-on-surface-variant" title={u.status_reason}>
                        {u.status_reason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        disabled={isSelf || u.status !== 'active' || u.roles.includes('Administrator') || openAs.isPending}
                        title={
                          u.roles.includes('Administrator')
                            ? 'Un administrateur ne peut pas être emprunté'
                            : u.status !== 'active'
                              ? 'Compte inactif ou bloqué'
                              : undefined
                        }
                        onClick={() => openAs.mutate(u)}
                        className="whitespace-nowrap rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm font-medium text-amud-on-surface transition-colors hover:bg-amud-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Voir son compte
                      </button>
                      <DropdownMenu
                        trigger={({ toggle }) => (
                          <button
                            onClick={toggle}
                            aria-label={`Actions pour ${displayName(u)}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
                          >
                            <span className="material-symbols-outlined">more_vert</span>
                          </button>
                        )}
                        items={[
                          { label: 'Renommer…', icon: 'edit', onClick: () => setRenaming(u) },
                          u.status === 'active'
                            ? { label: 'Bloquer…', icon: 'block', danger: true, onClick: () => setBlocking(u) }
                            : { label: 'Réactiver', icon: 'lock_open', onClick: () => setStatus.mutate({ id: u.id, status: 'active' }) },
                          { label: 'Supprimer…', icon: 'delete', danger: true, onClick: () => setDeleting(u) },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-md">
        <Pagination page={page} data={users.data} onPage={setPage} noun="compte" />
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau compte">
        <CreateUserForm
          roles={roles.data ?? []}
          pending={createUser.isPending}
          onSubmit={(body) => createUser.mutate(body)}
        />
      </Modal>

      <Modal open={renaming !== null} onClose={() => setRenaming(null)} title="Renommer le compte">
        {renaming ? (
          <RenameForm user={renaming} pending={rename.isPending} onSubmit={(name) => rename.mutate({ id: renaming.id, name })} />
        ) : null}
      </Modal>

      <Modal open={blocking !== null} onClose={() => setBlocking(null)} title="Bloquer le compte">
        {blocking ? (
          <BlockForm user={blocking} pending={setStatus.isPending} onSubmit={(reason) => setStatus.mutate({ id: blocking.id, status: 'blocked', reason })} />
        ) : null}
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer le compte">
        {deleting ? (
          <div className="grid gap-4">
            <p className="text-body-md text-amud-on-surface">
              Supprimer définitivement <strong>{displayName(deleting)}</strong> ({deleting.phone}) ?
            </p>
            <p className="rounded-lg bg-amud-tertiary-fixed p-3 text-label-md text-amud-on-tertiary-fixed">
              Bloquer est presque toujours préférable : c’est réversible et le journal d’audit reste rattaché à un compte réel. La suppression est faite pour les vraies erreurs — un numéro mal saisi, un doublon.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" loading={remove.isPending} loadingLabel="Suppression…" onClick={() => remove.mutate(deleting.id)}>
                Supprimer définitivement
              </Button>
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function RenameForm({ user, pending, onSubmit }: { user: AdminUser; pending: boolean; onSubmit: (name: string) => void }) {
  const [name, setName] = useState(user.name ?? '');

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(name);
      }}
    >
      <p className="text-label-md text-amud-on-surface-variant">{user.phone}</p>
      <TextField label="Nom" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      <div>
        <Button type="submit" loading={pending} loadingLabel="Enregistrement…">
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

function BlockForm({ user, pending, onSubmit }: { user: AdminUser; pending: boolean; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState('');

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(reason);
      }}
    >
      <p className="text-body-md text-amud-on-surface">
        <strong>{displayName(user)}</strong> ne recevra plus de code de connexion. C’est réversible.
      </p>
      <TextField label="Motif" hint="visible dans le journal" placeholder="Numéro frauduleux, doublon…" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      <div>
        <Button type="submit" variant="danger" loading={pending} loadingLabel="Blocage…">
          Bloquer le compte
        </Button>
      </div>
    </form>
  );
}

function CreateUserForm({
  roles,
  pending,
  onSubmit,
}: {
  roles: string[];
  pending: boolean;
  onSubmit: (body: { name: string; phone: string; roles: string[] }) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Company');

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, phone: toInternationalPhone(phone, '+212'), roles: [role] });
      }}
    >
      <p className="text-label-md text-amud-on-surface-variant">Aucun mot de passe : la personne se connectera avec ce numéro et un code à six chiffres.</p>
      <TextField label="Nom" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      <TextField label="Téléphone" hint="+212 par défaut" placeholder="0632594914" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <SelectField
        label="Rôle"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        options={roles.map((name) => ({ value: name, label: `${ROLE_LABELS[name] ?? name} — ${ROLE_DESTINATION[name] ?? ''}` }))}
      />
      <div>
        <Button type="submit" loading={pending} loadingLabel="Création…">
          Créer le compte
        </Button>
      </div>
    </form>
  );
}
