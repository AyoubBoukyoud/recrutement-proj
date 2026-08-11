import { useQuery } from '@tanstack/react-query'
import { api, storageUrl } from '../lib/api'
import { AssessmentMetrics } from './AssessmentMetrics'
import { DocumentList } from './DocumentList'
import { ShortlistPanel } from './ShortlistPanel'
import { Badge, Button, Card, Eyebrow } from './ui'
import type { CandidateDetail } from '../types/candidate'


/** Sections of a dossier are labelled by the form, so they take an eyebrow
 *  rather than a heading that would compete with the candidate's name. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-sm)', borderTop: '1px solid var(--line)', paddingTop: 'var(--sp-md)' }}>
      <Eyebrow>{title}</Eyebrow>
      <div>{children}</div>
    </div>
  )
}

export function CandidateDossier({ id, onBack }: { id: number; onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-candidate', id],
    queryFn: () => api.get(`/recruiter/candidates/${id}`).then((r) => r.data as CandidateDetail),
  })

  return (
    <Card>
      <Button variant="ghost" size="compact" onClick={onBack} className="no-print" style={{ marginBottom: 'var(--sp-lg)' }}>
        ← Back to results
      </Button>

      {isLoading && <p className="helper-text">Loading…</p>}

      {data && (
        <div style={{ display: 'grid', gap: 'var(--sp-lg)' }}>
          <div style={{ display: 'grid', gap: 'var(--sp-xs)', justifyItems: 'start' }}>
            <h1>
              {data.first_name} {data.last_name}
            </h1>
            <p className="helper-text">
              {data.profession} {data.specialization ? `· ${data.specialization}` : ''}
              {data.years_of_experience != null ? ` · ${data.years_of_experience} years experience` : ''}
            </p>
            <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
              {data.availability_status && (
                <Badge tone={data.availability_status === 'immediate' ? 'done' : 'pending'}>
                  {data.availability_status.replace(/_/g, ' ')}
                </Badge>
              )}
              {/* A draft is still discoverable, but a recruiter should know
                  they are looking at one before they act on it. */}
              {data.submitted_at ? <Badge tone="done">dossier submitted</Badge> : <Badge>still a draft</Badge>}
            </div>
          </div>

          <div className="no-print">
            <ShortlistPanel candidate={data} />
          </div>

          <Section title="Languages">
            <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
              {data.languages.length === 0 && <p className="helper-text">None declared.</p>}
              {data.languages.map((l) => (
                <div key={l.id} style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge tone={l.cefr_level ? 'done' : 'pending'}>
                    {l.language.toUpperCase()} {l.cefr_level ?? '—'} ({l.source.replace(/_/g, ' ')})
                  </Badge>
                  {/* Both sources, always — the effective level is the higher
                      of the two, so a recruiter needs to see which is which
                      rather than one number of unknown provenance. */}
                  {l.self_declared_cefr && <span className="helper-text">declared {l.self_declared_cefr}</span>}
                  {l.ai_cefr && <span className="helper-text">AI {l.ai_cefr}</span>}
                  {l.level_discrepancy && <Badge tone="pending">declared and assessed levels differ</Badge>}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Education">
            {data.educations.length === 0 && <p className="helper-text">None recorded.</p>}
            {data.educations.map((e) => (
              <p key={e.id} style={{ fontSize: 14, marginBottom: 'var(--sp-xs)' }}>
                {e.level.replace(/_/g, ' ')} {e.field ? `· ${e.field}` : ''} {e.institution ? `· ${e.institution}` : ''}
              </p>
            ))}
          </Section>

          <Section title="Documents">
            <DocumentList documents={data.documents} />
          </Section>

          {data.language_assessments.length > 0 && (
            <Section title="AI assessment metrics">
              <AssessmentMetrics assessments={data.language_assessments} />
            </Section>
          )}

          {data.presentation_video_path && (
            <Section title="Presentation video">
              <video controls style={{ width: '100%', maxWidth: 480, borderRadius: 'var(--radius-md)' }}>
                <source src={storageUrl(data.presentation_video_path)} />
              </video>
            </Section>
          )}
        </div>
      )}
    </Card>
  )
}
