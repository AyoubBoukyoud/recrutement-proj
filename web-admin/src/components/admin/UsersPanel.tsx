import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card, Field, Notice, SectionHeader, SelectField } from '../ui'
import { Pagination } from '../Pagination'
import type { AdminUser } from '../../types/admin'
import type { PaginatedResponse } from '../../types/candidate'

/** Les rôles Spatie, dans le vocabulaire des écrans. */
const ROLE_LABELS: Record<string, string> = {
  Administrator: 'Administrateur',
  Company: 'Entreprise',
  'Commercial Agent': 'Agent commercial',
  User: 'Candidat',
}

const roleLabel = (role: string) => ROLE_LABELS[role] ?? role

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

  return (
    <div className="grid gap-2 border-t border-outline-variant pt-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-[140px] font-mono text-[13px] text-on-surface">{user.phone}</span>
        <span className="min-w-[120px] flex-1 text-sm text-on-surface">{user.name ?? '—'}</span>
        {user.roles.length === 0 && <Badge>aucun rôle</Badge>}
        {user.roles.map((role) => (
          <Badge key={role} tone={role === 'Administrator' ? 'done' : 'pending'}>
            {roleLabel(role)}
          </Badge>
        ))}
        <Button
          variant="ghost"
          size="compact"
          onClick={() => {
            setSelected(user.roles)
            setEditing((v) => !v)
          }}
        >
          {editing ? 'Annuler' : 'Rôles'}
        </Button>
      </div>

      {editing && (
        <div className="grid gap-2">
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
          <Button
            size="compact"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="justify-self-start"
          >
            Enregistrer les rôles
          </Button>
        </div>
      )}
    </div>
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

      <div className="grid gap-2">
        {(data?.data ?? []).map((user) => (
          <UserRow key={user.id} user={user} roles={roles} />
        ))}
        {!isLoading && (data?.data.length ?? 0) === 0 && (
          <p className="helper-text">Aucun utilisateur ne correspond.</p>
        )}
      </div>

      <div className="mt-4">
        <Pagination page={page} data={data} onPage={setPage} />
      </div>
    </Card>
  )
}
