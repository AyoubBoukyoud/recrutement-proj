import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { TopBar } from '../components/TopBar'
import { ReferralPayouts } from '../components/ReferralPayouts'
import { Card, StatusPill, Button, Badge, SectionHeader } from '../components/ui'
import { MetricsPanel } from '../components/admin/MetricsPanel'
import { CandidatesPanel } from '../components/admin/CandidatesPanel'
import { AdminCandidateDetail } from '../components/admin/AdminCandidateDetail'
import { TaskCataloguePanel } from '../components/admin/TaskCataloguePanel'
import { UsersPanel } from '../components/admin/UsersPanel'
import type { Complaint, ComplaintStatus } from '../types/complaint'
import type { PaginatedResponse } from '../types/candidate'

const storageUrl = (path: string) => `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/storage/${path}`

const COMPLAINT_FILTERS: { value: ComplaintStatus | 'active'; label: string }[] = [
  { value: 'active', label: 'Needs attention' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
]

/** One complaint: listen or read it, move it along, and answer it. */
function ComplaintRow({ complaint }: { complaint: Complaint }) {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState(complaint.admin_response ?? '')

  const mutation = useMutation({
    mutationFn: (payload: { status?: ComplaintStatus; response?: string }) =>
      api.patch(`/admin/complaints/${complaint.id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-complaints'] }),
  })

  // The server builds a playable URL; storageUrl is the fallback for rows
  // written before that attribute existed.
  const audio = complaint.audio_url ?? (complaint.audio_path ? storageUrl(complaint.audio_path) : null)

  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-sm)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.5px' }}>
          {complaint.user.name ?? complaint.user.phone}
        </span>
        <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }}>
          {/* A complaint nobody was told about is the failure mode worth
              seeing: it means no admin has an email and no webhook is set. */}
          {!complaint.admin_notified_at && <Badge>not alerted</Badge>}
          <Badge tone={complaint.status === 'resolved' ? 'done' : 'pending'}>
            {complaint.status.replace('_', ' ')}
          </Badge>
          <Badge>{complaint.type}</Badge>
        </div>
      </div>

      {complaint.type === 'text' ? (
        <p style={{ fontSize: 14, marginTop: 'var(--sp-sm)' }}>{complaint.body}</p>
      ) : (
        audio && <audio controls src={audio} style={{ marginTop: 'var(--sp-sm)', width: '100%' }} />
      )}

      {complaint.responded_at && (
        <p className="helper-text" style={{ marginTop: 'var(--sp-sm)' }}>
          {`Answered by ${complaint.responded_by?.name ?? 'an administrator'} — the candidate sees this in the app.`}
        </p>
      )}

      <textarea
        className="field-input"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write back to the candidate…"
        rows={2}
        style={{ marginTop: 'var(--sp-sm)', width: '100%', minHeight: 64, resize: 'vertical' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-sm)', marginTop: 'var(--sp-sm)' }}>
        <Button
          size="compact"
          disabled={!reply.trim() || reply.trim() === complaint.admin_response || mutation.isPending}
          onClick={() => mutation.mutate({ response: reply.trim() })}
        >
          {complaint.responded_at ? 'Update reply' : 'Send reply'}
        </Button>

        {complaint.status === 'open' && (
          <Button variant="ghost" size="compact" onClick={() => mutation.mutate({ status: 'in_review' })}>
            Move to review
          </Button>
        )}
        {complaint.status !== 'resolved' && (
          <Button variant="ghost" size="compact" onClick={() => mutation.mutate({ status: 'resolved' })}>
            Mark resolved
          </Button>
        )}
        {complaint.status === 'resolved' && (
          <Button variant="ghost" size="compact" onClick={() => mutation.mutate({ status: 'open' })}>
            Reopen
          </Button>
        )}
      </div>
    </div>
  )
}

function ComplaintsPanel() {
  const [filter, setFilter] = useState<ComplaintStatus | 'active'>('active')

  const { data, isLoading } = useQuery({
    // `active` spans two statuses, so it is filtered client-side off the
    // unfiltered page rather than asking the API for something it cannot express.
    queryKey: ['admin-complaints', filter === 'active' ? null : filter],
    queryFn: () =>
      api
        .get('/admin/complaints', { params: filter === 'active' ? {} : { status: filter } })
        .then((r) => r.data as PaginatedResponse<Complaint>),
    refetchInterval: 5000,
  })

  const complaints = (data?.data ?? []).filter((c) => filter !== 'active' || c.status !== 'resolved')

  return (
    <Card>
      <SectionHeader
        eyebrow="Réclamations"
        title="Complaints"
        subtitle={isLoading ? 'Loading…' : `${complaints.length} shown`}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-md)' }}>
        {COMPLAINT_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="compact"
            variant={filter === f.value ? 'primary' : 'ghost'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
        {complaints.map((c) => (
          <ComplaintRow key={c.id} complaint={c} />
        ))}
        {!isLoading && complaints.length === 0 && <p className="helper-text">Nothing here.</p>}
      </div>
    </Card>
  )
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-ping'],
    queryFn: () => api.get('/admin/ping').then((r) => r.data),
  })

  const [openCandidate, setOpenCandidate] = useState<number | null>(null)

  return (
    <div>
      <TopBar title="Admin dashboard" />
      <main
        style={{
          maxWidth: 940,
          margin: '0 auto',
          padding: 'var(--sp-xl) var(--sp-lg)',
          display: 'grid',
          gap: 'var(--sp-lg)',
        }}
      >
        <Card>
          <SectionHeader eyebrow="System" title="Backend connectivity" />
          <StatusPill
            status={isLoading ? 'pending' : error ? 'error' : 'ok'}
            label={isLoading ? 'Checking API…' : error ? 'API unreachable or unauthorized' : `API says: ${data?.message}`}
          />
        </Card>

        <MetricsPanel />
        <ComplaintsPanel />
        {/* Opening a dossier replaces the list rather than sitting beside it:
            at this width a detail view alongside a list is two cramped
            columns, and the admin is doing one or the other. */}
        {openCandidate ? (
          <AdminCandidateDetail id={openCandidate} onBack={() => setOpenCandidate(null)} />
        ) : (
          <CandidatesPanel onOpen={setOpenCandidate} />
        )}
        <TaskCataloguePanel />
        <UsersPanel />
        <ReferralPayouts />
      </main>
    </div>
  )
}
