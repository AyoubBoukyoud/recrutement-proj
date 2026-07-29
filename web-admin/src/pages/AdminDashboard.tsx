import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { TopBar } from '../components/TopBar'
import { Card, StatusPill, Button, Badge, SectionHeader, CheckMark } from '../components/ui'
import type { Complaint } from '../types/complaint'
import type { PaginatedResponse } from '../types/candidate'

const storageUrl = (path: string) => `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/storage/${path}`

type AdminCandidate = {
  id: number
  phone: string
  name: string | null
  availability_status: string | null
  referred_by: string | null
  checklist: {
    profile_completed: boolean
    cv_uploaded: boolean
    certificates_uploaded: boolean
    video_recorded: boolean
  }
}

const CHECKLIST_LABELS: [keyof AdminCandidate['checklist'], string][] = [
  ['profile_completed', 'Personal profile completed'],
  ['cv_uploaded', 'CV uploaded & parsed'],
  ['certificates_uploaded', 'Certificates uploaded'],
  ['video_recorded', 'Presentation video recorded'],
]

function ComplaintsPanel() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-complaints'],
    queryFn: () => api.get('/admin/complaints').then((r) => r.data as PaginatedResponse<Complaint>),
    refetchInterval: 5000,
  })

  const resolveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/complaints/${id}`, { status: 'resolved' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-complaints'] }),
  })

  const open = data?.data.filter((c) => c.status !== 'resolved') ?? []

  return (
    <Card>
      <SectionHeader
        eyebrow="Réclamations"
        title="Complaints"
        subtitle={isLoading ? 'Loading…' : `${open.length} open`}
      />
      <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
        {open.map((c) => (
          <div key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--sp-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-sm)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.5px' }}>
                {c.user.name ?? c.user.phone}
              </span>
              <Badge>{c.type}</Badge>
            </div>
            {c.type === 'text' ? (
              <p style={{ fontSize: 14, marginTop: 'var(--sp-sm)' }}>{c.body}</p>
            ) : (
              c.audio_path && (
                <audio controls src={storageUrl(c.audio_path)} style={{ marginTop: 'var(--sp-sm)', width: '100%' }} />
              )
            )}
            <Button
              variant="ghost"
              size="compact"
              onClick={() => resolveMutation.mutate(c.id)}
              style={{ marginTop: 'var(--sp-sm)' }}
            >
              Mark resolved
            </Button>
          </div>
        ))}
        {!isLoading && open.length === 0 && <p className="helper-text">No open complaints.</p>}
      </div>
    </Card>
  )
}

function CandidateChecklistPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-candidates'],
    queryFn: () => api.get('/admin/candidates').then((r) => r.data as PaginatedResponse<AdminCandidate>),
  })

  return (
    <Card>
      <SectionHeader
        eyebrow="Dossiers"
        title="Candidate progress"
        subtitle={isLoading ? 'Loading…' : `${data?.data.length ?? 0} candidates`}
      />
      <div style={{ display: 'grid', gap: 'var(--sp-lg)' }}>
        {data?.data.map((candidate) => {
          const done = CHECKLIST_LABELS.filter(([key]) => candidate.checklist[key]).length
          return (
            <div key={candidate.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--sp-md)' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-sm)' }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.5px' }}>
                  {candidate.name ?? candidate.phone}
                </span>
                <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }}>
                  {candidate.referred_by && <Badge>via {candidate.referred_by}</Badge>}
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
                  <span
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      color: candidate.checklist[key] ? 'var(--ink)' : 'var(--ink-muted)',
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
                        background: candidate.checklist[key] ? 'var(--accent)' : 'transparent',
                        border: candidate.checklist[key] ? 'none' : '1px solid var(--line)',
                        color: 'var(--card)',
                      }}
                    >
                      {candidate.checklist[key] && <CheckMark size={9} />}
                    </span>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        {!isLoading && data?.data.length === 0 && <p className="helper-text">No candidates yet.</p>}
      </div>
    </Card>
  )
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-ping'],
    queryFn: () => api.get('/admin/ping').then((r) => r.data),
  })

  return (
    <div>
      <TopBar title="Admin dashboard" />
      <main
        style={{
          maxWidth: 720,
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

        <ComplaintsPanel />
        <CandidateChecklistPanel />
      </main>
    </div>
  )
}
