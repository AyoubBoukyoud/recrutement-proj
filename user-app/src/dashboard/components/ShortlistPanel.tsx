import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiErrorMessage } from '../lib/apiError'
import { Badge, Button, Eyebrow, Notice, SelectField } from './ui'
import type { CandidateContact, CandidateDetail, ShortlistEntry, ShortlistStage } from '../types/candidate'

const STAGES: { value: ShortlistStage; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'placed', label: 'Placed' },
  { value: 'rejected', label: 'Not proceeding' },
]

/**
 * The next step, which the dossier used to lack entirely.
 *
 * Contact details are an action rather than a field: the platform collects
 * explicit CNDP consent, so taking someone's number is recorded against the
 * recruiter who took it. Saving, staging and notes sit beside it because the
 * moment you have the number is the moment the candidate is in a pipeline.
 */
export function ShortlistPanel({ candidate }: { candidate: CandidateDetail }) {
  const queryClient = useQueryClient()
  const entry = candidate.shortlist

  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [savedNotes, setSavedNotes] = useState(entry?.notes ?? '')

  // A different candidate opened in the same panel starts from their notes,
  // not the last one's.
  useEffect(() => {
    setNotes(entry?.notes ?? '')
    setSavedNotes(entry?.notes ?? '')
  }, [candidate.id])

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['recruiter-candidate', candidate.id] }),
      queryClient.invalidateQueries({ queryKey: ['recruiter-candidates'] }),
      queryClient.invalidateQueries({ queryKey: ['recruiter-shortlist'] }),
    ])

  const save = useMutation({
    mutationFn: (payload: { stage?: ShortlistStage; notes?: string }) =>
      api
        .put(`/recruiter/candidates/${candidate.id}/shortlist`, payload)
        .then((r) => r.data as ShortlistEntry & { notes: string | null }),
    onSuccess: async (data) => {
      setSavedNotes(data.notes ?? '')
      await invalidate()
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/recruiter/candidates/${candidate.id}/shortlist`),
    onSuccess: async () => {
      setNotes('')
      setSavedNotes('')
      await invalidate()
    },
  })

  const reveal = useMutation({
    mutationFn: () =>
      api
        .post(`/recruiter/candidates/${candidate.id}/contact`)
        .then((r) => r.data as { contact: CandidateContact }),
    onSuccess: invalidate,
  })

  const contact = candidate.contact ?? reveal.data?.contact ?? null
  const failure = save.error ?? remove.error ?? reveal.error
  const notesDirty = notes !== savedNotes

  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--sp-md)',
        padding: 'var(--sp-md)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--accent-soft)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
        <Eyebrow tone="accent">Your pipeline</Eyebrow>
        {entry ? <Badge tone="done">on your shortlist</Badge> : <Badge>not saved</Badge>}
      </div>

      {contact ? (
        <div style={{ display: 'grid', gap: 4 }}>
          <Eyebrow>Contact</Eyebrow>
          <a href={`tel:${contact.phone}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 16 }}>
            {contact.phone}
          </a>
          {contact.email && (
            <a href={`mailto:${contact.email}`} style={{ fontSize: 14 }}>
              {contact.email}
            </a>
          )}
          {candidate.shortlist?.contact_revealed_at && (
            <span className="helper-text">
              Released to you on {new Date(candidate.shortlist.contact_revealed_at).toLocaleDateString()}
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--sp-sm)', justifyItems: 'start' }}>
          <Button onClick={() => reveal.mutate()} disabled={reveal.isPending}>
            {reveal.isPending ? 'Releasing…' : 'Show contact details'}
          </Button>
          <span className="helper-text">
            This candidate consented to being contacted about roles. The disclosure is recorded against your
            account and adds them to your shortlist.
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gap: 'var(--sp-sm)', maxWidth: 320 }}>
        <SelectField
          label="Stage"
          value={entry?.stage ?? 'saved'}
          onChange={(e) => save.mutate({ stage: e.target.value as ShortlistStage })}
          disabled={save.isPending}
        >
          {STAGES.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </SelectField>
      </div>

      <label style={{ display: 'grid', gap: 6 }}>
        <span className="field-label">Private notes</span>
        <textarea
          className="field-input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Only you can see these."
          style={{ resize: 'vertical' }}
        />
      </label>

      <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
        <Button onClick={() => save.mutate({ notes })} disabled={save.isPending || !notesDirty}>
          {save.isPending ? 'Saving…' : notesDirty ? 'Save notes' : 'Notes saved'}
        </Button>
        {entry && (
          <Button variant="ghost" onClick={() => remove.mutate()} disabled={remove.isPending}>
            Remove from shortlist
          </Button>
        )}
        <Button variant="ghost" onClick={() => window.print()}>
          Print dossier
        </Button>
      </div>

      {failure && <Notice>{apiErrorMessage(failure, 'That did not save. Try again.')}</Notice>}
    </div>
  )
}
