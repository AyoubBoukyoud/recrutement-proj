import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { TopBar } from '../components/TopBar'
import { Card, Field, SelectField, Button, Badge, SectionHeader, Eyebrow } from '../components/ui'
import type { CandidateDetail, CandidateListItem, Language, PaginatedResponse } from '../types/candidate'

const storageUrl = (path: string) => `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/storage/${path}`

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'fr', label: 'French' },
  { value: 'ar', label: 'Arabic' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
]

type Filters = {
  profession: string
  specialization: string
  language: Language | ''
  cefr_level: string
  min_experience: string
  availability_status: string
}

const EMPTY_FILTERS: Filters = {
  profession: '',
  specialization: '',
  language: '',
  cefr_level: '',
  min_experience: '',
  availability_status: '',
}

function CandidateCard({ candidate, onOpen }: { candidate: CandidateListItem; onOpen: () => void }) {
  return (
    <Card style={{ padding: 0 }}>
      {/* A button, not a clickable div — the whole card is one target and has
          to be reachable by keyboard like every other control here. */}
      <button className="card-button" onClick={onOpen}>
        <h3 style={{ marginBottom: 'var(--sp-xs)' }}>
          {candidate.first_name} {candidate.last_name}
        </h3>
        <p className="helper-text">
          {candidate.profession ?? 'No profession set'}
          {candidate.specialization ? ` · ${candidate.specialization}` : ''}
          {candidate.years_of_experience != null ? ` · ${candidate.years_of_experience} yrs` : ''}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 'var(--sp-sm)', flexWrap: 'wrap' }}>
          {candidate.languages.map((l) => (
            <Badge key={l.id} tone={l.cefr_level ? 'done' : 'pending'}>
              {l.language.toUpperCase()} {l.cefr_level ?? '—'}
            </Badge>
          ))}
        </div>
      </button>
    </Card>
  )
}

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

function CandidateDetailView({ id, onBack }: { id: number; onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-candidate', id],
    queryFn: () => api.get(`/recruiter/candidates/${id}`).then((r) => r.data as CandidateDetail),
  })

  return (
    <Card>
      <Button variant="ghost" size="compact" onClick={onBack} style={{ marginBottom: 'var(--sp-lg)' }}>
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
            {data.availability_status && (
              <Badge tone={data.availability_status === 'immediate' ? 'done' : 'pending'}>
                {data.availability_status.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>

          <Section title="Languages">
            <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
              {data.languages.map((l) => (
                <Badge key={l.id} tone={l.cefr_level ? 'done' : 'pending'}>
                  {l.language.toUpperCase()} {l.cefr_level ?? '—'} ({l.source})
                </Badge>
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
            {data.documents.length === 0 && <p className="helper-text">None uploaded.</p>}
            <div style={{ display: 'grid', gap: 6, justifyItems: 'start' }}>
              {data.documents.map((d) => (
                <a key={d.id} href={storageUrl(d.file_path)} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
                  Download {d.type} ({d.ocr_status})
                </a>
              ))}
            </div>
          </Section>

          {data.language_assessments.length > 0 && (
            <Section title="AI assessment metrics">
              <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
                {data.language_assessments.map((a) => (
                  <Badge key={a.id} tone={a.predicted_cefr ? 'done' : 'pending'}>
                    {a.language.toUpperCase()} {a.predicted_cefr ?? a.status}
                  </Badge>
                ))}
              </div>
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

export default function RecruiterSearch() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS)
  const [openId, setOpenId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-candidates', appliedFilters],
    queryFn: () => {
      const params = Object.fromEntries(Object.entries(appliedFilters).filter(([, v]) => v !== ''))
      return api.get('/recruiter/candidates', { params }).then((r) => r.data as PaginatedResponse<CandidateListItem>)
    },
  })

  return (
    <div>
      <TopBar title="Recruiter search" />
      <main
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'var(--sp-xl) var(--sp-lg)',
          display: 'grid',
          gap: 'var(--sp-lg)',
        }}
      >
        {openId ? (
          <CandidateDetailView id={openId} onBack={() => setOpenId(null)} />
        ) : (
          <>
            <Card>
              <SectionHeader eyebrow="Search" title="Filters" />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 'var(--sp-md)',
                }}
              >
                <Field
                  label="Profession"
                  value={filters.profession}
                  onChange={(e) => setFilters({ ...filters, profession: e.target.value })}
                />
                <Field
                  label="Specialization"
                  value={filters.specialization}
                  onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                />
                <SelectField
                  label="Language"
                  value={filters.language}
                  onChange={(e) => setFilters({ ...filters, language: e.target.value as Language | '' })}
                >
                  <option value="">Any</option>
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Min. CEFR level"
                  value={filters.cefr_level}
                  onChange={(e) => setFilters({ ...filters, cefr_level: e.target.value })}
                >
                  <option value="">Any</option>
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </SelectField>
                <Field
                  label="Min. years of experience"
                  type="number"
                  value={filters.min_experience}
                  onChange={(e) => setFilters({ ...filters, min_experience: e.target.value })}
                />
                <SelectField
                  label="Availability"
                  value={filters.availability_status}
                  onChange={(e) => setFilters({ ...filters, availability_status: e.target.value })}
                >
                  <option value="">Any</option>
                  <option value="immediate">Immediate</option>
                  <option value="within_1_month">Within 1 month</option>
                  <option value="within_2_months">Within 2 months</option>
                </SelectField>
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginTop: 'var(--sp-lg)' }}>
                <Button onClick={() => setAppliedFilters(filters)}>Search</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilters(EMPTY_FILTERS)
                    setAppliedFilters(EMPTY_FILTERS)
                  }}
                >
                  Clear
                </Button>
              </div>
            </Card>

            {isLoading && <p className="helper-text">Loading candidates…</p>}
            {data && data.data.length === 0 && <p className="helper-text">No candidates match these filters.</p>}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 'var(--sp-md)',
              }}
            >
              {data?.data.map((c) => (
                <CandidateCard key={c.id} candidate={c} onOpen={() => setOpenId(c.id)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
