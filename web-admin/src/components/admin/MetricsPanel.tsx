import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, Eyebrow, SectionHeader } from '../ui'
import type { Metrics } from '../../types/admin'

/**
 * One number, and what it means. Tone is reserved for figures that are asking
 * for something to be done — a backlog of documents nobody has approved is not
 * the same kind of fact as how many candidates exist.
 */
function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: number | string
  hint?: string
  tone?: 'neutral' | 'attention'
}) {
  return (
    <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
      <Eyebrow>{label}</Eyebrow>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 24,
          lineHeight: 1.1,
          color: tone === 'attention' && Number(value) > 0 ? 'var(--attention)' : 'var(--ink)',
        }}
      >
        {value}
      </span>
      {hint && <span className="helper-text">{hint}</span>}
    </div>
  )
}

function StatRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-sm)', borderTop: '1px solid var(--line)', paddingTop: 'var(--sp-md)' }}>
      <Eyebrow tone="accent">{title}</Eyebrow>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--sp-md)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function MetricsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/admin/metrics').then((r) => r.data as Metrics),
    refetchInterval: 30_000,
  })

  return (
    <Card>
      <SectionHeader
        eyebrow="Vue d’ensemble"
        title="Platform"
        subtitle={isLoading ? 'Loading…' : 'Refreshes every 30 seconds'}
      />

      {data && (
        <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
          <StatRow title="Candidates">
            <Stat label="Total" value={data.candidates.total} />
            <Stat label="Submitted" value={data.candidates.submitted} hint="declared finished" />
            <Stat label="Verified" value={data.candidates.verified} hint="checked by us" />
            <Stat label="Discoverable" value={data.candidates.discoverable} hint="consents on record" />
            <Stat label="New this week" value={data.candidates.new_this_week} />
          </StatRow>

          <StatRow title="Paperwork">
            <Stat
              label="To approve"
              value={data.documents.awaiting_approval}
              tone="attention"
              hint="waiting on us"
            />
            <Stat label="Approved" value={data.documents.approved} />
            <Stat label="Rejected" value={data.documents.rejected} />
            <Stat
              label="Unreadable"
              value={data.documents.unreadable}
              tone="attention"
              hint="scanner got nothing"
            />
          </StatRow>

          <StatRow title="Daily internship">
            <Stat label="Active today" value={data.internship.active_candidates_today} />
            <Stat
              label="Done today"
              value={`${data.internship.completed_today}/${data.internship.assigned_today}`}
            />
            <Stat label="Overdue" value={data.internship.overdue} tone="attention" />
            <Stat
              label="Enrolled"
              value={data.internship.candidates_with_assignments}
              hint="ever assigned work"
            />
          </StatRow>

          <StatRow title="Support & growth">
            <Stat label="Open complaints" value={data.complaints.open} tone="attention" />
            <Stat label="In review" value={data.complaints.in_review} />
            {/* Nobody was reachable when these came in — a configuration
                fault that is otherwise completely invisible. */}
            <Stat
              label="Unannounced"
              value={data.complaints.unannounced}
              tone="attention"
              hint="no alert reached anyone"
            />
            <Stat label="Referred" value={data.growth.referred_registrations} />
            <Stat label="Users" value={data.growth.users} />
          </StatRow>
        </div>
      )}
    </Card>
  )
}
