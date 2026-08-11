import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card, CheckMark, Field, SectionHeader, SelectField } from '../ui'
import { Pagination } from '../Pagination'
import { EngagementBadge } from './EngagementBadge'
import type { AdminCandidateRow, AdminChecklist } from '../../types/admin'
import type { PaginatedResponse } from '../../types/candidate'

const CHECKLIST_LABELS: [keyof AdminChecklist, string][] = [
  ['profile_completed', 'Personal profile completed'],
  ['cv_uploaded', 'CV uploaded & parsed'],
  ['certificates_uploaded', 'Certificates uploaded'],
  ['video_recorded', 'Presentation video recorded'],
]

function ChecklistMark({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: done ? 'var(--ink)' : 'var(--ink-muted)',
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: done ? 'var(--accent)' : 'transparent',
          border: done ? 'none' : '1px solid var(--line)',
          color: 'var(--card)',
        }}
      >
        {done && <CheckMark size={9} />}
      </span>
      {label}
    </span>
  )
}

export function CandidatesPanel({ onOpen }: { onOpen: (id: number) => void }) {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-candidates', page, q, status],
    queryFn: () =>
      api
        .get('/admin/candidates', { params: { page, q: q || undefined, status: status || undefined } })
        .then((r) => r.data as PaginatedResponse<AdminCandidateRow>),
  })

  return (
    <Card>
      <SectionHeader
        eyebrow="Dossiers"
        title="Candidate progress"
        // The old header said `{data.data.length} candidates`, which would have
        // read "20 candidates" forever once the platform passed twenty.
        subtitle={isLoading ? 'Loading…' : undefined}
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
          placeholder="Name, phone or profession"
        />
        <SelectField
          label="Stage"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Everyone</option>
          <option value="draft">Still a draft</option>
          <option value="submitted">Submitted, unverified</option>
          <option value="verified">Verified</option>
        </SelectField>
      </div>

      <div style={{ display: 'grid', gap: 'var(--sp-lg)' }}>
        {(data?.data ?? []).map((candidate) => {
          const done = CHECKLIST_LABELS.filter(([key]) => candidate.checklist[key]).length
          return (
            <div key={candidate.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--sp-md)' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}
              >
                <button
                  onClick={() => onOpen(candidate.id)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    letterSpacing: '0.5px',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--accent)',
                    textAlign: 'left',
                  }}
                >
                  {candidate.name ?? candidate.phone}
                </button>
                <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                  {candidate.referred_by && <Badge>via {candidate.referred_by}</Badge>}
                  {candidate.documents_awaiting_approval > 0 && (
                    <Badge>{`${candidate.documents_awaiting_approval} to approve`}</Badge>
                  )}
                  <EngagementBadge engagement={candidate.engagement} />
                  <Badge tone={candidate.verified_at ? 'done' : 'pending'}>
                    {candidate.verified_at
                      ? 'verified'
                      : candidate.submitted_at
                        ? 'submitted'
                        : `draft · ${candidate.completion_percent}%`}
                  </Badge>
                  <Badge tone={done === CHECKLIST_LABELS.length ? 'done' : 'pending'}>
                    {done}/{CHECKLIST_LABELS.length}
                  </Badge>
                </div>
              </div>

              {/* Sections of a dossier get signed off, so a finished one is
                  stamped rather than ticked in a checkbox the operator cannot
                  actually toggle. */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-md)', marginTop: 'var(--sp-sm)' }}>
                {CHECKLIST_LABELS.map(([key, label]) => (
                  <ChecklistMark key={key} done={candidate.checklist[key]} label={label} />
                ))}
              </div>

              <Button variant="ghost" size="compact" onClick={() => onOpen(candidate.id)} style={{ marginTop: 'var(--sp-sm)' }}>
                Open dossier
              </Button>
            </div>
          )
        })}

        {!isLoading && (data?.data.length ?? 0) === 0 && <p className="helper-text">No candidates match.</p>}
      </div>

      <div style={{ marginTop: 'var(--sp-md)' }}>
        <Pagination page={page} data={data} onPage={setPage} />
      </div>
    </Card>
  )
}
