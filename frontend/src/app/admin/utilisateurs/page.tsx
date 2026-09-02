'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import { Button, Card, Checkbox, Field, Notice, SelectField } from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import { useAuth } from '@/context/AuthContext';
import { toInternationalPhone } from '@/lib/phoneNumber';
import type { PaginatedResponse } from '@/types/candidate';

/*
 * Attribution des rôles.
 *
 * C'est le seul écran depuis lequel un recruteur ou un agent obtient son
 * accès : sans lui, la seule méthode était `php artisan tinker` sur le
 * serveur. Le parcours attendu est qu'ils se connectent d'abord avec leur
 * téléphone — toute connexion inconnue crée un candidat — puis qu'un
 * administrateur les retrouve ici et coche leur rôle. « Créer un compte »
 * couvre le cas inverse, quand on veut réserver le numéro avant.
 *
 * Aucun mot de passe nulle part : la connexion se fait par code à six
 * chiffres, donc un compte créé ici n'a pas d'identifiant à transmettre.
 */
type AdminUser = {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  roles: string[];
  has_candidate_profile: boolean;
  created_at: string;
};

/** Ce que le rôle donne concrètement — la liste des rôles seule ne le dit pas. */
const ROLE_LABELS: Record<string, string> = {
  Administrator: 'Administrateur — cette console',
  Company: 'Recruteur — /recruiter',
  'Commercial Agent': 'Agent commercial — /agent',
  User: 'Candidat — /dashboard',
};

function describeRole(role: string) {
  return ROLE_LABELS[role] ?? role;
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
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

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

  const updateRoles = useMutation({
    mutationFn: ({ id, roles: next }: { id: number; roles: string[] }) =>
      api.patch(`/admin/users/${id}/roles`, { roles: next }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const createUser = useMutation({
    mutationFn: (body: { name: string; phone: string; roles: string[] }) => api.post('/admin/users', body),
    onSuccess: () => {
      setCreating(false);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    users.refetch();
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs et rôles</h1>
          <p className="helper-text mt-1">
            Le rôle décide de l’espace vers lequel la connexion redirige. Un compte sans rôle coché
            ne peut plus se connecter nulle part.
          </p>
        </div>
        <Button onClick={() => setCreating((open) => !open)} aria-expanded={creating}>
          {creating ? 'Annuler' : 'Créer un compte'}
        </Button>
      </header>

      {creating && (
        <CreateUserForm
          roles={roles.data ?? []}
          pending={createUser.isPending}
          error={createUser.error ? errorMessage(createUser.error, 'Création impossible.') : null}
          onSubmit={(body) => createUser.mutate(body)}
        />
      )}

      <form onSubmit={submitSearch} className="grid gap-4 sm:grid-cols-[1fr_240px_auto] sm:items-end">
        <Field
          label="Rechercher"
          placeholder="Nom, téléphone ou e-mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
              {role}
            </option>
          ))}
        </SelectField>
        <Button type="submit">Filtrer</Button>
      </form>

      {updateRoles.error && (
        <Notice>{errorMessage(updateRoles.error, 'Modification des rôles impossible.')}</Notice>
      )}

      {users.data?.data.length === 0 && (
        <Notice tone="pending">
          Aucun compte ne correspond. Un recruteur qui ne s’est jamais connecté n’existe pas encore —
          demandez-lui de se connecter avec son numéro, ou créez le compte ci-dessus.
        </Notice>
      )}

      <div className="grid gap-4">
        {users.data?.data.map((user) => (
          <Card key={user.id}>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <h2 className="font-bold">{user.name || 'Sans nom'}</h2>
                <p className="helper-text">
                  {user.phone}
                  {user.email ? ` · ${user.email}` : ''}
                  {user.has_candidate_profile ? ' · dossier candidat' : ''}
                  {currentUser?.id === String(user.id) ? ' · vous' : ''}
                </p>
              </div>
              <fieldset
                className="grid gap-2"
                disabled={updateRoles.isPending}
                aria-label={`Rôles de ${user.name || user.phone}`}
              >
                {(roles.data ?? []).map((role) => {
                  const checked = user.roles.includes(role);
                  return (
                    <label key={role} className="flex items-center gap-2 text-[13px]">
                      <Checkbox
                        checked={checked}
                        label={describeRole(role)}
                        onChange={(next) =>
                          updateRoles.mutate({
                            id: user.id,
                            roles: next
                              ? [...user.roles, role]
                              : user.roles.filter((held) => held !== role),
                          })
                        }
                      />
                      <span>{describeRole(role)}</span>
                    </label>
                  );
                })}
              </fieldset>
            </div>
          </Card>
        ))}
      </div>

      <Pagination page={page} data={users.data} onPage={setPage} noun="compte" />
    </main>
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
  const [selected, setSelected] = useState<string[]>([]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ name, phone: toInternationalPhone(phone, '+212'), roles: selected });
  };

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-4">
        <h2 className="font-bold">Nouveau compte</h2>
        <p className="helper-text">
          Aucun mot de passe : la personne se connectera avec ce numéro et un code à six chiffres.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
          <Field
            label="Téléphone"
            hint="+212 par défaut"
            placeholder="0632594914"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <fieldset className="grid gap-2" aria-label="Rôles du nouveau compte">
          {roles.map((role) => (
            <label key={role} className="flex items-center gap-2 text-[13px]">
              <Checkbox
                checked={selected.includes(role)}
                label={describeRole(role)}
                onChange={(next) =>
                  setSelected((current) =>
                    next ? [...current, role] : current.filter((held) => held !== role)
                  )
                }
              />
              <span>{describeRole(role)}</span>
            </label>
          ))}
        </fieldset>
        {error && <Notice>{error}</Notice>}
        <div>
          <Button type="submit" disabled={pending || selected.length === 0}>
            {pending ? 'Création…' : 'Créer le compte'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
