import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card, Field, Notice, SectionHeader, SelectField } from '../ui'
import { Pagination } from '../Pagination'
import type { AdminUser } from '../../types/admin'
import type { PaginatedResponse } from '../../types/candidate'

/**
 * One user's roles, as a set of toggles.
 *
 * Roles are replaced wholesale rather than diffed: the UI is checkboxes, so a
 * diff API would only be reconstructed on the client from the same facts. The
 * server refuses the two changes that lock everybody out — dropping your own
 * Administrator role, and demoting the last one.
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
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--sp-sm)', display: 'grid', gap: 'var(--sp-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minWidth: 140 }}>{user.phone}</span>
        <span style={{ fontSize: 14, flex: 1, minWidth: 120 }}>{user.name ?? '—'}</span>
        {user.roles.length === 0 && <Badge>no role</Badge>}
        {user.roles.map((role) => (
          <Badge key={role} tone={role === 'Administrator' ? 'done' : 'pending'}>
            {role}
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
          {editing ? 'Cancel' : 'Roles'}
        </Button>
      </div>

      {editing && (
        <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
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
                  {role}
                </Button>
              )
            })}
          </div>
          {message && <Notice>{message}</Notice>}
          <Button size="compact" disabled={save.isPending} onClick={() => save.mutate()} style={{ justifySelf: 'start' }}>
            Save roles
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
        title="Users & roles"
        subtitle={isLoading ? 'Loading…' : 'Four roles have existed since the first migration with no way to grant one'}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(160px, 2fr) minmax(140px, 1fr)',
          gap: 'var(--sp-sm)',
          marginBottom: 'var(--sp-md)',
        }}
      >
        <Field
          label="Search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Name, phone or email"
        />
        <SelectField
          label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Any role</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </SelectField>
      </div>

      <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
        {(data?.data ?? []).map((user) => (
          <UserRow key={user.id} user={user} roles={roles} />
        ))}
        {!isLoading && (data?.data.length ?? 0) === 0 && <p className="helper-text">No users match.</p>}
      </div>

      <div style={{ marginTop: 'var(--sp-md)' }}>
        <Pagination page={page} data={data} onPage={setPage} />
      </div>
    </Card>
  )
}
