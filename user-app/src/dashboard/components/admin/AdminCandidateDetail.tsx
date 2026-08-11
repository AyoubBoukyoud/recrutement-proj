import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card, Eyebrow, Field, Notice } from '../ui'
import { EngagementBadge } from './EngagementBadge'
import { AssignTasks } from './AssignTasks'
import type { AdminCandidateDetail as Detail, AdminDocument } from '../../types/admin'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-sm)', borderTop: '1px solid var(--line)', paddingTop: 'var(--sp-md)' }}>
      <Eyebrow tone="accent">{title}</Eyebrow>
      {children}
    </div>
  )
}

const APPROVAL_TONE = { approved: 'done', rejected: 'pending', pending: 'pending' } as const

/**
 * Accept or reject one document. Distinct from `ocr_status`: a legible
 * photograph of the wrong diploma scans perfectly and is still not acceptable,
 * and the candidate needs to be told which of the two happened.
 */
function DocumentRow({ document, candidateId }: { document: AdminDocument; candidateId: number }) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState(document.rejection_reason ?? '')
  const [rejecting, setRejecting] = useState(false)

  const review = useMutation({
    mutationFn: (payload: { approval_status: string; rejection_reason?: string }) =>
      api.patch(`/admin/documents/${document.id}/approval`, payload),
    onSuccess: () => {
      setRejecting(false)
      queryClient.invalidateQueries({ queryKey: ['admin-candidate', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
    },
  })

  return (
    <div style={{ display: 'grid', gap: 'var(--sp-sm)', padding: 'var(--sp-sm) 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, flex: 1, minWidth: 120 }}>{document.type}</span>
        <Badge tone={APPROVAL_TONE[document.approval_status]}>{document.approval_status}</Badge>
        {/* Our scanner's verdict, kept visibly separate from ours. */}
        {document.ocr_status !== 'completed' && <Badge>scan: {document.ocr_status.replace('_', ' ')}</Badge>}
        {document.url && (
          <a href={document.url} target="_blank" rel="noreferrer" className="helper-text">
            Open
          </a>
        )}
      </div>

      {document.rejection_reason && !rejecting && (
        <p className="helper-text">Rejected: {document.rejection_reason}</p>
      )}

      {rejecting ? (
        <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
          <Field
            label="Why is this being rejected?"
            hint="the candidate sees this"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="This is a payslip, not a diploma."
          />
          <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
            <Button
              size="compact"
              disabled={!reason.trim() || review.isPending}
              onClick={() => review.mutate({ approval_status: 'rejected', rejection_reason: reason.trim() })}
            >
              Confirm rejection
            </Button>
            <Button variant="ghost" size="compact" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
          {document.approval_status !== 'approved' && (
            <Button size="compact" variant="ghost" onClick={() => review.mutate({ approval_status: 'approved' })}>
              Approve
            </Button>
          )}
          {document.approval_status !== 'rejected' && (
            <Button size="compact" variant="ghost" onClick={() => setRejecting(true)}>
              Reject
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** Verification and internal notes — the administrator's own judgement, which
 *  the completeness checklist deliberately cannot express. */
function VerificationPanel({ candidate }: { candidate: Detail }) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState(candidate.admin_notes ?? '')

  const mutation = useMutation({
    mutationFn: (payload: { verified?: boolean; admin_notes?: string }) =>
      api.patch(`/admin/candidates/${candidate.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-candidate', candidate.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
    },
  })

  return (
    <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
      {candidate.verified_at ? (
        <Notice tone="pending">
          {`Verified by ${candidate.verified_by?.name ?? 'an administrator'}. Recruiters see this dossier as checked.`}
        </Notice>
      ) : (
        <p className="helper-text">
          Not yet verified. The checklist reports what exists; verifying records that a person read it.
        </p>
      )}

      <textarea
        className="field-input"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Internal follow-up notes — never shown to the candidate or to recruiters."
        rows={3}
        style={{ width: '100%', minHeight: 72, resize: 'vertical' }}
      />

      <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
        <Button
          size="compact"
          disabled={mutation.isPending || notes === (candidate.admin_notes ?? '')}
          onClick={() => mutation.mutate({ admin_notes: notes })}
        >
          Save notes
        </Button>
        <Button
          variant="ghost"
          size="compact"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ verified: !candidate.verified_at })}
        >
          {candidate.verified_at ? 'Withdraw verification' : 'Mark verified'}
        </Button>
      </div>
    </div>
  )
}

export function AdminCandidateDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-candidate', id],
    queryFn: () => api.get(`/admin/candidates/${id}`).then((r) => r.data as Detail),
  })

  return (
    <Card>
      <Button variant="ghost" size="compact" onClick={onBack} style={{ marginBottom: 'var(--sp-lg)' }}>
        ← Back to candidates
      </Button>

      {isLoading && <p className="helper-text">Loading…</p>}

      {data && (
        <div style={{ display: 'grid', gap: 'var(--sp-lg)' }}>
          <div style={{ display: 'grid', gap: 'var(--sp-xs)', justifyItems: 'start' }}>
            <h1>{[data.first_name, data.last_name].filter(Boolean).join(' ') || data.user.phone}</h1>
            <p className="helper-text">
              {[
                data.user.phone,
                data.profession,
                data.specialization,
                data.years_of_experience != null ? `${data.years_of_experience} years` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
              <Badge tone={data.verified_at ? 'done' : 'pending'}>
                {data.verified_at ? 'verified' : data.submitted_at ? 'submitted' : 'draft'}
              </Badge>
              <Badge>{data.completeness.percent}% complete</Badge>
              <EngagementBadge engagement={data.engagement} />
            </div>
          </div>

          <Section title="Verification">
            <VerificationPanel candidate={data} />
          </Section>

          <Section title="Daily internship">
            <AssignTasks candidate={data} />
          </Section>

          <Section title="Documents">
            {data.documents.length === 0 ? (
              <p className="helper-text">Nothing uploaded yet.</p>
            ) : (
              data.documents.map((document) => (
                <DocumentRow key={document.id} document={document} candidateId={data.id} />
              ))
            )}
          </Section>

          <Section title="Languages">
            {data.languages.length === 0 ? (
              <p className="helper-text">None declared.</p>
            ) : (
              <div style={{ display: 'grid', gap: 4 }}>
                {data.languages.map((language) => (
                  <div key={language.id} style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, width: 32 }}>
                      {language.language.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 14, width: 40 }}>{language.cefr_level ?? '—'}</span>
                    <span className="helper-text">{language.source.replace(/_/g, ' ')}</span>
                    {language.level_discrepancy && <Badge>sources disagree</Badge>}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Education">
            {data.educations.length === 0 ? (
              <p className="helper-text">None recorded.</p>
            ) : (
              data.educations.map((education) => (
                <p key={education.id} style={{ fontSize: 14 }}>
                  {[education.field ?? education.level, education.institution, education.ended_at?.slice(0, 4)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ))
            )}
          </Section>
        </div>
      )}
    </Card>
  )
}
