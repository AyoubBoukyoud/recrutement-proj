'use client';

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/opsApi'
import { Badge, Button, Card, Field, SelectField, SectionHeader } from '@/components/ui'
import { Pagination } from '@/components/Pagination'
import type { Task, TaskCategory } from '@/types/admin'
import type { PaginatedResponse } from '@/types/candidate'

const CATEGORIES: TaskCategory[] = ['language', 'documents', 'culture', 'admin', 'other']

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  language: 'langue',
  documents: 'documents',
  culture: 'culture',
  admin: 'administratif',
  other: 'autre',
}

/**
 * Le catalogue des activités de préparation derrière le stage quotidien.
 * Les activités sont retirées plutôt que supprimées — les assignations déjà
 * faites sont le seul registre de ce qui a été demandé à un candidat.
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
        title="Stage quotidien"
        subtitle={
          isLoading ? 'Chargement…' : 'Activités assignées aux candidats, environ une heure par jour'
        }
      />

      <div className="mb-4 grid items-end gap-2 [grid-template-columns:minmax(180px,2fr)_minmax(120px,1fr)_minmax(90px,1fr)_auto]">
        <Field
          label="Nouvelle activité"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lire à voix haute un article de presse allemand"
        />
        <SelectField label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
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
          Ajouter
        </Button>
      </div>

      <div className="grid gap-2">
        {(data?.data ?? []).map((task) => (
          <div key={task.id} className="flex flex-wrap items-center gap-2 border-t border-outline-variant pt-2">
            <span className="min-w-[160px] flex-1 text-sm text-on-surface">{task.title}</span>
            <Badge tone="neutral">{CATEGORY_LABELS[task.category]}</Badge>
            <span className="helper-text">{task.estimated_minutes} min</span>
            {task.assignments_count != null && (
              <span className="helper-text">{`assignée ${task.assignments_count}×`}</span>
            )}
            {task.is_active ? (
              <Button variant="ghost" size="compact" onClick={() => retire.mutate(task.id)}>
                Retirer
              </Button>
            ) : (
              <>
                <Badge tone="neutral">retirée</Badge>
                <Button variant="ghost" size="compact" onClick={() => restore.mutate(task.id)}>
                  Rétablir
                </Button>
              </>
            )}
          </div>
        ))}

        {!isLoading && (data?.data.length ?? 0) === 0 && (
          <p className="helper-text">
            Aucune activité pour l&apos;instant. Ajoutez-en une ci-dessus pour commencer à assigner du travail.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-2">
        <Pagination page={page} data={data} onPage={setPage} noun="activité" />
        <Button
          variant="ghost"
          size="compact"
          className="justify-self-start"
          onClick={() => {
            setIncludeInactive((v) => !v)
            setPage(1)
          }}
        >
          {includeInactive ? 'Masquer les retirées' : 'Afficher les retirées'}
        </Button>
      </div>
    </Card>
  )
}
