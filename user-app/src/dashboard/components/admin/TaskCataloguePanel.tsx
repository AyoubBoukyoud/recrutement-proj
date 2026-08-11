import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card, Field, SelectField, SectionHeader } from '../ui'
import { Pagination } from '../Pagination'
import type { Task, TaskCategory } from '../../types/admin'
import type { PaginatedResponse } from '../../types/candidate'

const CATEGORIES: TaskCategory[] = ['language', 'documents', 'culture', 'admin', 'other']

/**
 * The catalogue of preparation activities behind the daily internship.
 * Activities are retired rather than deleted — assignments already made are
 * the only record of what a candidate was asked to do.
 */
export function TaskCataloguePanel() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TaskCategory>('language')
  const [minutes, setMinutes] = useState('30')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tasks', page, includeInactive],
    queryFn: () =>
      api
        .get('/admin/tasks', { params: { page, include_inactive: includeInactive || undefined } })
        .then((r) => r.data as PaginatedResponse<Task>),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })

  const create = useMutation({
    mutationFn: () =>
      api.post('/admin/tasks', {
        title: title.trim(),
        category,
        estimated_minutes: Number(minutes) || 30,
      }),
    onSuccess: () => {
      setTitle('')
      invalidate()
    },
  })

  const retire = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/tasks/${id}`),
    onSuccess: invalidate,
  })

  const restore = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/tasks/${id}`, { is_active: true }),
    onSuccess: invalidate,
  })

  return (
    <Card>
      <SectionHeader
        eyebrow="Stage à distance"
        title="Daily internship"
        subtitle={isLoading ? 'Loading…' : 'Activities assigned to candidates, roughly an hour a day'}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 2fr) minmax(120px, 1fr) minmax(90px, 1fr) auto',
          gap: 'var(--sp-sm)',
          alignItems: 'end',
          marginBottom: 'var(--sp-md)',
        }}
      >
        <Field
          label="New activity"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Read one German news article aloud"
        />
        <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
        <Field
          label="Minutes"
          type="number"
          min={5}
          max={480}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <Button disabled={!title.trim() || create.isPending} onClick={() => create.mutate()}>
          Add
        </Button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
        {(data?.data ?? []).map((task) => (
          <div
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-sm)',
              flexWrap: 'wrap',
              borderTop: '1px solid var(--line)',
              paddingTop: 'var(--sp-sm)',
            }}
          >
            <span style={{ fontSize: 14, flex: 1, minWidth: 160 }}>{task.title}</span>
            <Badge>{task.category}</Badge>
            <span className="helper-text">{task.estimated_minutes} min</span>
            {task.assignments_count != null && (
              <span className="helper-text">{`assigned ${task.assignments_count}×`}</span>
            )}
            {task.is_active ? (
              <Button variant="ghost" size="compact" onClick={() => retire.mutate(task.id)}>
                Retire
              </Button>
            ) : (
              <>
                <Badge>retired</Badge>
                <Button variant="ghost" size="compact" onClick={() => restore.mutate(task.id)}>
                  Restore
                </Button>
              </>
            )}
          </div>
        ))}

        {!isLoading && (data?.data.length ?? 0) === 0 && (
          <p className="helper-text">No activities yet. Add one above to start assigning work.</p>
        )}
      </div>

      <div style={{ marginTop: 'var(--sp-md)', display: 'grid', gap: 'var(--sp-sm)' }}>
        <Pagination page={page} data={data} onPage={setPage} />
        <Button
          variant="ghost"
          size="compact"
          onClick={() => {
            setIncludeInactive((v) => !v)
            setPage(1)
          }}
          style={{ justifySelf: 'start' }}
        >
          {includeInactive ? 'Hide retired' : 'Show retired'}
        </Button>
      </div>
    </Card>
  )
}
