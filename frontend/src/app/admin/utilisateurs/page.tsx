'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import { Avatar, Badge, Button, Card, DropdownMenu, Field, Modal, Notice, SelectField } from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import { useAuth } from '@/context/AuthContext';
import { destinationForRole } from '@/lib/roleDestination';
import { useRouter } from 'next/navigation';
import { toInternationalPhone } from '@/lib/phoneNumber';
import type { PaginatedResponse } from '@/types/candidate';
import type { UserRole } from '@/lib/types';

/*
 * Utilisateurs et rôles.
 *
 * C'est le seul écran depuis lequel un recruteur ou un agent obtient son
 * accès. Le parcours attendu est qu'ils se connectent d'abord avec leur
 * téléphone — toute connexion inconnue crée un candidat — puis qu'un
 * administrateur les retrouve ici et change leur rôle.
 *
 * Le rôle est un menu déroulant et non plus quatre cases à cocher. Les deux
 * décrivaient la même donnée, mais la grille de cases laissait composer des
 * états que le produit ne sait pas représenter : `roleFrom()` côté client
 * réduit de toute façon les rôles cumulés à un seul espace, par priorité, et
 * zéro case cochée donnait un compte qui ne peut plus se connecter nulle part
 * sans que rien ne le dise. Un menu ne peut produire ni l'un ni l'autre.
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

/** Même ordre de priorité que `roleFrom()` dans AuthContext. */
const ROLE_PRIORITY = ['Administrator', 'Company', 'Commercial Agent', 'User'] as const;

const ROLE_LABELS: Record<string, string> = {
  Administrator: 'Administrateur',
  Company: 'Recruteur',
  'Commercial Agent': 'Agent commercial',
  User: 'Candidat',
};

/** Où la connexion emmène ce rôle — la question que l'écran répond vraiment. */
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

const APP_ROLE_BY_BACKEND_NAME: Record<string, UserRole> = {
  Administrator: 'admin',
  Company: 'employer',
  'Commercial Agent': 'agent',
  User: 'candidate',
};

/** Le vocabulaire de l'application, dans le même ordre de priorité qu'AuthContext. */
function roleForApp(roles: string[]): UserRole {
  const role = effectiveRole(roles);
  return role ? APP_ROLE_BY_BACKEND_NAME[role] : 'candidate';
}

/** Le rôle effectif : celui qui décide de la redirection après connexion. */
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

export default function AdminUsers() {
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
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      api.patch(`/admin/users/${id}/roles`, { roles: [role] }),
    onSuccess: refresh,
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.patch(`/admin/users/${id}`, { name }),
    onSuccess: () => {
      setRenaming(null);
      refresh();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) =>
      api.patch(`/admin/users/${id}/status`, { status, status_reason: reason || null }),
    onSuccess: () => {
      setBlocking(null);
      refresh();
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      setDeleting(null);
      refresh();
    },
  });

  /*
   * « Voir son compte » : l'API rend un jeton court au nom de cet utilisateur,
   * AuthContext met celui de l'administrateur de côté, et on atterrit sur
   * l'espace de son rôle. Le retour se fait par la bande jaune, qui reste
   * affichée tant que la session est empruntée.
   */
  const openAs = useMutation({
    mutationFn: (user: AdminUser) =>
      api.post(`/admin/users/${user.id}/impersonate`).then((r) => r.data as {
        token: string;
        user: { id: number; name: string | null; phone: string; roles: string[] };
      }),
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
  });

  const createUser = useMutation({
    mutationFn: (body: { name: string; phone: string; roles: string[] }) => api.post('/admin/users', body),
    onSuccess: () => {
      setCreating(false);
      refresh();
    },
  });

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const rows = users.data?.data ?? [];
  const writeError =
    updateRole.error || setStatus.error || remove.error || openAs.error
      ? errorMessage(
          updateRole.error ?? setStatus.error ?? remove.error ?? openAs.error,
          'Action impossible.'
        )
      : null;

  return (
    <main className="mx-auto grid max-w-5xl gap-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs et rôles</h1>
          <p className="helper-text mt-1 max-w-xl">
            Le rôle décide de l’espace vers lequel la connexion redirige. Bloquer un compte l’empêche
            de recevoir un code — c’est cela qui arrête un accès, pas le retrait d’un rôle.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>Créer un compte</Button>
      </header>

      <form onSubmit={submitSearch} className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <Field
          label="Rechercher"
          placeholder="Nom, téléphone ou e-mail"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <SelectField
          label="Rôle"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les rôles</option>
          {(roles.data ?? []).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role] ?? role}
            </option>
          ))}
        </SelectField>
        <Button type="submit" variant="ghost">
          Filtrer
        </Button>
      </form>

      {writeError && <Notice>{writeError}</Notice>}

      {users.isLoading && <p className="helper-text">Chargement…</p>}

      {!users.isLoading && rows.length === 0 && (
        <Notice tone="pending">
          Aucun compte ne correspond. Un recruteur qui ne s’est jamais connecté n’existe pas encore —
          demandez-lui de se connecter avec son numéro, ou créez le compte.
        </Notice>
      )}

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-card border border-outline-variant bg-surface-lowest">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-lowest">
                  <th scope="col" className="px-4 py-2.5 text-[12px] font-bold text-on-surface-variant">
                    Compte
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-[12px] font-bold text-on-surface-variant">
                    Rôle
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-[12px] font-bold text-on-surface-variant">
                    Statut
                  </th>
                  <th scope="col" className="w-12 px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => {
                  const role = effectiveRole(user.roles);
                  const isSelf = currentUser?.id === String(user.id);

                  return (
                    <tr key={user.id} className="border-b border-outline-variant/60 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={displayName(user)} size={34} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-bold">
                              <span className={user.name ? '' : 'text-on-surface-variant'}>
                                {displayName(user)}
                              </span>
                              {isSelf && <Badge tone="neutral">vous</Badge>}
                            </p>
                            <p className="helper-text truncate">
                              {user.name ? user.phone : 'Sans nom'}
                              {user.email ? ` · ${user.email}` : ''}
                              {user.has_candidate_profile ? ' · dossier candidat' : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <label className="sr-only" htmlFor={`role-${user.id}`}>
                          Rôle de {displayName(user)}
                        </label>
                        <select
                          id={`role-${user.id}`}
                          value={role ?? ''}
                          disabled={updateRole.isPending}
                          onChange={(e) => updateRole.mutate({ id: user.id, role: e.target.value })}
                          className="h-9 w-full max-w-[190px] rounded-element border border-outline bg-surface-lowest px-2.5 text-[13px] text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        >
                          {role === null && <option value="">— Aucun rôle —</option>}
                          {(roles.data ?? []).map((name) => (
                            <option key={name} value={name}>
                              {ROLE_LABELS[name] ?? name}
                            </option>
                          ))}
                        </select>
                        <p className="helper-text mt-1 font-mono text-[11px]">
                          {role ? ROLE_DESTINATION[role] : 'ne peut pas se connecter'}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={user.status === 'active' ? 'done' : user.status === 'blocked' ? 'error' : 'pending'}>
                          {STATUS_LABEL[user.status]}
                        </Badge>
                        {user.status_reason && (
                          <p className="helper-text mt-1 max-w-[160px] truncate" title={user.status_reason}>
                            {user.status_reason}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="compact"
                            // Le back refuse les trois ; les griser explique
                            // pourquoi avant le clic plutôt qu'après.
                            disabled={
                              isSelf ||
                              user.status !== 'active' ||
                              user.roles.includes('Administrator') ||
                              openAs.isPending
                            }
                            title={
                              user.roles.includes('Administrator')
                                ? 'Un administrateur ne peut pas être emprunté'
                                : user.status !== 'active'
                                  ? 'Compte inactif ou bloqué'
                                  : undefined
                            }
                            onClick={() => openAs.mutate(user)}
                          >
                            Voir son compte
                          </Button>
                          <DropdownMenu
                          label={`Actions pour ${displayName(user)}`}
                          items={[
                            { label: 'Renommer…', onClick: () => setRenaming(user) },
                            user.status === 'active'
                              ? {
                                  label: 'Bloquer…',
                                  tone: 'danger' as const,
                                  disabled: isSelf,
                                  onClick: () => setBlocking(user),
                                }
                              : {
                                  label: 'Réactiver',
                                  onClick: () => setStatus.mutate({ id: user.id, status: 'active' }),
                                },
                            {
                              label: 'Supprimer…',
                              tone: 'danger' as const,
                              // Le back refuse les deux ; les griser explique pourquoi
                              // avant le clic plutôt qu'après.
                              disabled: isSelf || user.has_candidate_profile,
                              onClick: () => setDeleting(user),
                            },
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
        </div>
      )}

      <Pagination page={page} data={users.data} onPage={setPage} noun="compte" />

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau compte">
        <CreateUserForm
          roles={roles.data ?? []}
          pending={createUser.isPending}
          error={createUser.error ? errorMessage(createUser.error, 'Création impossible.') : null}
          onSubmit={(body) => createUser.mutate(body)}
        />
      </Modal>

      <Modal open={renaming !== null} onClose={() => setRenaming(null)} title="Renommer le compte">
        {renaming && (
          <RenameForm
            user={renaming}
            pending={rename.isPending}
            error={rename.error ? errorMessage(rename.error, 'Modification impossible.') : null}
            onSubmit={(name) => rename.mutate({ id: renaming.id, name })}
          />
        )}
      </Modal>

      <Modal open={blocking !== null} onClose={() => setBlocking(null)} title="Bloquer le compte">
        {blocking && (
          <BlockForm
            user={blocking}
            pending={setStatus.isPending}
            error={setStatus.error ? errorMessage(setStatus.error, 'Blocage impossible.') : null}
            onSubmit={(reason) => setStatus.mutate({ id: blocking.id, status: 'blocked', reason })}
          />
        )}
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer le compte">
        {deleting && (
          <div className="grid gap-4">
            <p className="text-[15px]">
              Supprimer définitivement <strong>{displayName(deleting)}</strong> ({deleting.phone}) ?
            </p>
            <Notice tone="pending">
              Bloquer est presque toujours préférable : c’est réversible et le journal d’audit reste
              rattaché à un compte réel. La suppression est faite pour les vraies erreurs — un numéro
              mal saisi, un doublon.
            </Notice>
            {remove.error && <Notice>{errorMessage(remove.error, 'Suppression impossible.')}</Notice>}
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id)}>
                {remove.isPending ? 'Suppression…' : 'Supprimer définitivement'}
              </Button>
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}

function RenameForm({
  user,
  pending,
  error,
  onSubmit,
}: {
  user: AdminUser;
  pending: boolean;
  error: string | null;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(user.name ?? '');

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(name);
      }}
    >
      <p className="helper-text">{user.phone}</p>
      <Field label="Nom" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      {error && <Notice>{error}</Notice>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}

function BlockForm({
  user,
  pending,
  error,
  onSubmit,
}: {
  user: AdminUser;
  pending: boolean;
  error: string | null;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(reason);
      }}
    >
      <p className="text-[15px]">
        <strong>{displayName(user)}</strong> ne recevra plus de code de connexion. C’est réversible.
      </p>
      <Field
        label="Motif"
        hint="visible dans le journal"
        placeholder="Numéro frauduleux, doublon…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        autoFocus
      />
      {error && <Notice>{error}</Notice>}
      <div>
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? 'Blocage…' : 'Bloquer le compte'}
        </Button>
      </div>
    </form>
  );
}

/*
 * Le numéro est saisi comme il s'écrit au Maroc (`0632594914`) et converti en
 * E.164 avant l'envoi : c'est sous cette forme que l'API le stocke, et donc la
 * seule qui retrouvera ce compte quand la personne se connectera.
 */
function CreateUserForm({
  roles,
  pending,
  error,
  onSubmit,
}: {
  roles: string[];
  pending: boolean;
  error: string | null;
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
      <p className="helper-text">
        Aucun mot de passe : la personne se connectera avec ce numéro et un code à six chiffres.
      </p>
      <Field label="Nom" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      <Field
        label="Téléphone"
        hint="+212 par défaut"
        placeholder="0632594914"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <SelectField label="Rôle" value={role} onChange={(e) => setRole(e.target.value)}>
        {roles.map((name) => (
          <option key={name} value={name}>
            {ROLE_LABELS[name] ?? name} — {ROLE_DESTINATION[name] ?? ''}
          </option>
        ))}
      </SelectField>
      {error && <Notice>{error}</Notice>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Création…' : 'Créer le compte'}
        </Button>
      </div>
    </form>
  );
}
