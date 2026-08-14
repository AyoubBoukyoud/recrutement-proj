'use client';

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { api } from '@/lib/opsApi'
import { Avatar, Badge, Button, Card, Field, Notice, SectionHeader, SelectField } from '@/components/ui'
import { Pagination } from '@/components/Pagination'
import type { AdminUser } from '@/types/admin'
import type { PaginatedResponse } from '@/types/candidate'

/** Les rôles Spatie, dans le vocabulaire des écrans. */
const ROLE_LABELS: Record<string, string> = {
  Administrator: 'Administrateur',
  Company: 'Entreprise',
  'Commercial Agent': 'Agent commercial',
  User: 'Candidat',
}

const roleLabel = (role: string) => ROLE_LABELS[role] ?? role

const ICON_BUTTON =
  'inline-flex h-8 w-8 items-center justify-center rounded-element border border-outline-variant bg-surface-lowest text-on-surface-variant transition-colors hover:border-primary hover:text-primary'

/**
 * Les rôles d'un utilisateur, sous forme de bascules.
 *
 * Les rôles sont remplacés en bloc plutôt que comparés : l'interface est faite
 * de cases à cocher, donc une API de différence ne serait de toute façon
 * reconstruite côté client à partir des mêmes faits. Le serveur refuse les deux
 * changements qui enfermeraient tout le monde dehors — retirer son propre rôle
 * d'administrateur, et rétrograder le dernier.
 */
function UserRow({ user, roles }: { user: AdminUser; roles: string[] }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<string[]>(user.roles)

  const save = useMutation({
    mutationFn: () => api.patch(`/admin/users/${user.id}/roles`, { roles: selected }),
    onSuccess: () => {
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const error = save.error as { response?: { data?: { errors?: Record<string, string[]> } } } | null
  const message = error?.response?.data?.errors?.roles?.[0]
  const name = user.name ?? user.phone

  return (
    <>
      <tr className="hover:bg-surface-container/40">
        <td className="py-3 pr-3">
          <div className="flex items-center gap-3">
            <Avatar name={name} />
            <span className="grid">
              <span className="text-[14px] font-semibold text-on-surface">{user.name ?? '—'}</span>
              <span className="font-mono text-[12px] text-on-surface-variant">{user.phone}</span>
            </span>
          </div>
        </td>
        <td className="py-3 pr-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {user.roles.length === 0 && <Badge tone="pending">aucun rôle</Badge>}
            {user.roles.map((role) => (
              <Badge key={role} tone={role === 'Administrator' ? 'done' : 'neutral'}>
                {roleLabel(role)}
              </Badge>
            ))}
          </div>
        </td>
        <td className="py-3">
          <div className="flex justify-end">
            <button
              className={ICON_BUTTON}
              onClick={() => {
                setSelected(user.roles)
                setEditing((v) => !v)
              }}
              aria-label="Modifier les rôles"
              title="Modifier les rôles"
            >
              <Pencil size={16} />
            </button>
          </div>
        </td>
      </tr>

      {editing && (
        <tr>
          <td colSpan={3} className="pb-3">
            <div className="grid gap-2 rounded-element border border-outline-variant bg-surface-container/40 p-3">
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => {
                  const active = selected.includes(role)
                  return (
                    <Button
                      key={role}
                      size="compact"
                      variant={active ? 'primary' : 'ghost'}
                      onClick={() =>
                        setSelected((current) =>
                          active ? current.filter((r) => r !== role) : [...current, role],
                        )
                      }
                    >
                      {roleLabel(role)}
                    </Button>
                  )
                })}
              </div>
              {message && <Notice>{message}</Notice>}
              <div className="flex gap-2">
                <Button size="compact" disabled={save.isPending} onClick={() => save.mutate()}>
                  Enregistrer les rôles
                </Button>
                <Button size="compact" variant="ghost" disabled={save.isPending} onClick={() => setEditing(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function UsersPanel() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')

  const { data: roles = [] } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/admin/roles').then((r) => r.data as string[]),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, q, role],
    queryFn: () =>
      api
        .get('/admin/users', { params: { page, q: q || undefined, role: role || undefined } })
        .then((r) => r.data as PaginatedResponse<AdminUser>),
  })

  return (
    <Card>
      <SectionHeader
        eyebrow="Accès"
        title="Utilisateurs et rôles"
        subtitle={
          isLoading
            ? 'Chargement…'
            : "Quatre rôles existent depuis la première migration sans qu'aucun moyen ne permette d'en accorder un"
        }
      />

      <div className="mb-4 grid gap-2 [grid-template-columns:minmax(160px,2fr)_minmax(140px,1fr)]">
        <Field
          label="Recherche"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Nom, téléphone ou e-mail"
        />
        <SelectField
          label="Rôle"
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Tous les rôles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <th className="pb-2 pr-3 font-bold">Utilisateur</th>
              <th className="pb-2 pr-3 font-bold">Rôles</th>
              <th className="pb-2 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {(data?.data ?? []).map((user) => (
              <UserRow key={user.id} user={user} roles={roles} />
            ))}
          </tbody>
        </table>

        {!isLoading && (data?.data.length ?? 0) === 0 && (
          <p className="helper-text py-4">Aucun utilisateur ne correspond.</p>
        )}
      </div>

      <div className="mt-4">
        <Pagination page={page} data={data} onPage={setPage} noun="utilisateur" />
      </div>
    </Card>
  )
}
