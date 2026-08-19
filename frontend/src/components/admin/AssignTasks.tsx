'use client';

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/opsApi'
import { Badge, Button, Notice } from '@/components/ui'
import type { AdminCandidateDetail, Task, TaskAssignment } from '@/types/admin'
import type { PaginatedResponse } from '@/types/candidate'

const STATUS_TONE = { completed: 'done', assigned: 'pending', skipped: 'pending' } as const

const STATUS_LABELS = { completed: 'terminée', assigned: 'assignée', skipped: 'passée' } as const

function AssignmentRow({ assignment, candidateId }: { assignment: TaskAssignment; candidateId: number }) {
  const queryClient = useQueryClient()

  const remove = useMutation({
    mutationFn: () => api.delete(`/admin/assignments/${assignment.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-candidate', candidateId] }),
  })

  return (
    <div className="grid gap-0.5 border-t border-outline-variant py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs tabular-nums text-on-surface-variant">
          {assignment.assigned_for.slice(0, 10)}
        </span>
        <span className="min-w-[140px] flex-1 text-sm text-on-surface">
          {assignment.task?.title ?? 'Activité'}
        </span>
        <Badge tone={STATUS_TONE[assignment.status]}>{STATUS_LABELS[assignment.status]}</Badge>
        {assignment.is_overdue && <Badge>en retard</Badge>}
        {assignment.status === 'assigned' && (
          <Button variant="ghost" size="compact" onClick={() => remove.mutate()} disabled={remove.isPending}>
            Retirer
          </Button>
        )}
      </div>

      {/* Ce que cela a réellement pris, face à notre estimation — le chiffre qui
          dit si le budget « ~1 heure par jour » est honnête. */}
      {assignment.minutes_spent != null && (
        <span className="helper-text">
          {`${assignment.minutes_spent} min passées${
            assignment.task ? ` · ${assignment.task.estimated_minutes} min estimées` : ''
          }`}
        </span>
      )}
      {assignment.candidate_note && <span className="helper-text">“{assignment.candidate_note}”</span>}
    </div>
  )
}

/** Distribuer le travail de préparation d'une journée, et relire ce qu'il en est advenu. */
export function AssignTasks({ candidate }: { candidate: AdminCandidateDetail }) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<number[]>([])
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10))

  const { data: catalogue } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: () => api.get('/admin/tasks').then((r) => r.data as PaginatedResponse<Task>),
  })

  const assign = useMutation({
    mutationFn: () =>
      api.post(`/admin/candidates/${candidate.id}/assignments`, {
        task_ids: selected,
        assigned_for: day,
      }),
    onSuccess: () => {
      setSelected([])
      queryClient.invalidateQueries({ queryKey: ['admin-candidate', candidate.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
    },
  })

  const tasks = catalogue?.data ?? []
  const { engagement } = candidate
  // La spécification prévoit environ une heure par jour : le total est donc
  // affiché face à ce budget, plutôt que laissé à l'addition mentale de
  // l'administrateur.
  const plannedMinutes = tasks
    .filter((task) => selected.includes(task.id))
    .reduce((total, task) => total + task.estimated_minutes, 0)

  const assignments = [...candidate.task_assignments].sort((a, b) =>
    b.assigned_for.localeCompare(a.assigned_for),
  )

  return (
    <div className="grid gap-4">
      <p className="helper-text">
        {engagement.completion_rate === null
          ? "Rien n'a encore été assigné à ce candidat."
          : `${engagement.completed}/${engagement.assigned} faits · ${engagement.minutes_last_7_days} min sur les 7 derniers jours · ${engagement.streak_days} jours d'affilée`}
      </p>

      {tasks.length === 0 ? (
        <Notice tone="pending">
          Le catalogue d&apos;activités est vide. Ajoutez-en sous « Stage quotidien » avant d&apos;en assigner.
        </Notice>
      ) : (
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            {tasks.map((task) => {
              const active = selected.includes(task.id)
              return (
                <Button
                  key={task.id}
                  size="compact"
                  variant={active ? 'primary' : 'ghost'}
                  onClick={() =>
                    setSelected((current) =>
                      active ? current.filter((id) => id !== task.id) : [...current, task.id],
                    )
                  }
                >
                  {`${task.title} · ${task.estimated_minutes}m`}
                </Button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              aria-label="Date d'assignation"
              className="h-13 w-auto rounded-element border border-outline bg-surface-lowest px-3.5 text-[15px] text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button size="compact" disabled={selected.length === 0 || assign.isPending} onClick={() => assign.mutate()}>
              {`Assigner ${selected.length || ''}`.trim()}
            </Button>
            {selected.length > 0 && (
              <span className={`helper-text ${plannedMinutes > 90 ? 'text-attention' : ''}`}>
                {`${plannedMinutes} min prévues${plannedMinutes > 90 ? " — bien au-delà de l'heure quotidienne" : ''}`}
              </span>
            )}
          </div>
        </div>
      )}

      {assignments.length > 0 && (
        <div>
          {assignments.slice(0, 15).map((assignment) => (
            <AssignmentRow key={assignment.id} assignment={assignment} candidateId={candidate.id} />
          ))}
        </div>
      )}
    </div>
  )
}
