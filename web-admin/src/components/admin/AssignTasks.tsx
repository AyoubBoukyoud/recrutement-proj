import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Notice } from '../ui'
import type { AdminCandidateDetail, Task, TaskAssignment } from '../../types/admin'
import type { PaginatedResponse } from '../../types/candidate'

const STATUS_TONE = { completed: 'done', assigned: 'pending', skipped: 'pending' } as const

function AssignmentRow({ assignment, candidateId }: { assignment: TaskAssignment; candidateId: number }) {
  const queryClient = useQueryClient()

  const remove = useMutation({
    mutationFn: () => api.delete(`/admin/assignments/${assignment.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-candidate', candidateId] }),
  })

  return (
    <div style={{ display: 'grid', gap: 2, padding: 'var(--sp-sm) 0', borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {assignment.assigned_for.slice(0, 10)}
        </span>
        <span style={{ fontSize: 14, flex: 1, minWidth: 140 }}>{assignment.task?.title ?? 'Activity'}</span>
        <Badge tone={STATUS_TONE[assignment.status]}>{assignment.status}</Badge>
        {assignment.is_overdue && <Badge>overdue</Badge>}
        {assignment.status === 'assigned' && (
          <Button variant="ghost" size="compact" onClick={() => remove.mutate()} disabled={remove.isPending}>
            Remove
          </Button>
        )}
      </div>

      {/* What it really took, against what we estimated — the number that says
          whether the "~1 hour a day" budget is honest. */}
      {assignment.minutes_spent != null && (
        <span className="helper-text">
          {`${assignment.minutes_spent} min spent${
            assignment.task ? ` · ${assignment.task.estimated_minutes} min estimated` : ''
          }`}
        </span>
      )}
      {assignment.candidate_note && <span className="helper-text">“{assignment.candidate_note}”</span>}
    </div>
  )
}

/** Hand out a day's preparation work, and read back what came of it. */
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
  // The spec budgets roughly an hour a day, so the total is shown against it
  // rather than left for the administrator to add up in their head.
  const plannedMinutes = tasks
    .filter((task) => selected.includes(task.id))
    .reduce((total, task) => total + task.estimated_minutes, 0)

  const assignments = [...candidate.task_assignments].sort((a, b) =>
    b.assigned_for.localeCompare(a.assigned_for),
  )

  return (
    <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
      <p className="helper-text">
        {engagement.completion_rate === null
          ? 'Nothing has been assigned to this candidate yet.'
          : `${engagement.completed}/${engagement.assigned} done · ${engagement.minutes_last_7_days} min in the last 7 days · ${engagement.streak_days}-day streak`}
      </p>

      {tasks.length === 0 ? (
        <Notice tone="pending">
          The activity catalogue is empty. Add activities under Daily internship before assigning any.
        </Notice>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
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

          <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="date"
              className="field-input"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              style={{ width: 'auto' }}
            />
            <Button size="compact" disabled={selected.length === 0 || assign.isPending} onClick={() => assign.mutate()}>
              {`Assign ${selected.length || ''}`.trim()}
            </Button>
            {selected.length > 0 && (
              <span
                className="helper-text"
                style={{ color: plannedMinutes > 90 ? 'var(--attention)' : undefined }}
              >
                {`${plannedMinutes} min planned${plannedMinutes > 90 ? ' — well over the daily hour' : ''}`}
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
