'use client';

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { TopBar } from '../components/TopBar'
import { CandidateDossier } from '../components/CandidateDossier'
import { Pagination } from '../components/Pagination'
import { Card, Field, SelectField, Button, Badge, SectionHeader } from '../components/ui'
import type {
  CandidateListItem,
  Language,
  PaginatedResponse,
  ShortlistRow,
  ShortlistStage,
} from '../types/candidate'

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'fr', label: 'French' },
  { value: 'ar', label: 'Arabic' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
]

const EDUCATION_LEVELS = [
  { value: 'general_school', label: 'General school' },
  { value: 'vocational', label: 'Vocational' },
  { value: 'professional_training', label: 'Professional training' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'other', label: 'Other' },
]

const STAGE_LABELS: Record<ShortlistStage, string> = {
  saved: 'Saved',
  contacted: 'Contacted',
  interviewing: 'Interviewing',
  placed: 'Placed',
  rejected: 'Not proceeding',
}

type Filters = {
  q: string
  profession: string
  specialization: string
  language: Language | ''
  cefr_level: string
  min_experience: string
  availability_status: string
  education_level: string
  sort: string
  has_video: boolean
  verified_assessment: boolean
  submitted_only: boolean
}

const EMPTY_FILTERS: Filters = {
  q: '',
  profession: '',
  specialization: '',
  language: '',
  cefr_level: '',
  min_experience: '',
  availability_status: '',
  education_level: '',
  sort: 'recent',
  has_video: false,
  verified_assessment: false,
  submitted_only: false,
}

/** Drops empties, so the query string carries only what the recruiter chose. */
function toParams(filters: Filters, page: number) {
  const params: Record<string, string | number> = { page }

  Object.entries(filters).forEach(([key, value]) => {
    if (value === '' || value === false) return
    params[key] = value === true ? 1 : (value as string)
  })

  return params
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', fontSize: 14, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
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

        {/* Where this recruiter left off, and what is worth their time. Triage
            marks belong on the card, not two clicks into the dossier. */}
        <div style={{ display: 'flex', gap: 6, marginTop: 'var(--sp-sm)', flexWrap: 'wrap' }}>
          {candidate.shortlisted && candidate.shortlist_stage && (
            <Badge tone="done">{STAGE_LABELS[candidate.shortlist_stage]}</Badge>
          )}
          {candidate.has_verified_assessment && <Badge>assessed</Badge>}
          {candidate.has_video && <Badge>video</Badge>}
          {!candidate.submitted && <Badge tone="pending">draft</Badge>}
        </div>
      </button>
    </Card>
  )
}

function ShortlistView({ onOpen }: { onOpen: (id: number) => void }) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-shortlist', page],
    queryFn: () =>
      api
        .get('/recruiter/shortlist', { params: { page } })
        .then((r) => r.data as PaginatedResponse<ShortlistRow>),
  })

  async function downloadCsv() {
    const response = await api.get('/recruiter/shortlist/export', { responseType: 'blob' })
    const url = URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `shortlist-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          gap: 'var(--sp-md)',
          flexWrap: 'wrap',
        }}
      >
        <SectionHeader
          eyebrow="Pipeline"
          title="My shortlist"
          subtitle="Candidates you saved, and where each one has got to."
        />
        <Button variant="ghost" size="compact" onClick={downloadCsv}>
          Export CSV
        </Button>
      </div>

      {isLoading && <p className="helper-text">Loading…</p>}
      {data && data.data.length === 0 && (
        <p className="helper-text">Nothing saved yet. Open a candidate and save them to start a pipeline.</p>
      )}

      <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
        {data?.data.map((row) => (
          <div
            key={row.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-md)',
              flexWrap: 'wrap',
              padding: 'var(--sp-sm) 0',
              borderTop: '1px solid var(--line)',
            }}
          >
            <button
              onClick={() => onOpen(row.candidate_profile_id)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>
                {row.candidate?.first_name} {row.candidate?.last_name}
              </span>
              <span className="helper-text" style={{ display: 'block' }}>
                {row.candidate?.profession ?? 'No profession set'}
              </span>
            </button>

            <Badge tone={row.stage === 'placed' ? 'done' : 'pending'}>{STAGE_LABELS[row.stage]}</Badge>

            {row.contact?.phone && (
              <a href={`tel:${row.contact.phone}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                {row.contact.phone}
              </a>
            )}

            {row.notes && (
              <span className="helper-text" style={{ flexBasis: '100%' }}>
                {row.notes}
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--sp-md)' }}>
        <Pagination page={page} data={data} onPage={setPage} />
      </div>
    </Card>
  )
}

export default function RecruiterSearch() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<number | null>(null)
  const [tab, setTab] = useState<'search' | 'shortlist'>('search')

  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-candidates', appliedFilters, page],
    queryFn: () =>
      api
        .get('/recruiter/candidates', { params: toParams(appliedFilters, page) })
        .then((r) => r.data as PaginatedResponse<CandidateListItem>),
  })

  function applyFilters(next: Filters) {
    setAppliedFilters(next)
    // A new search starts at the beginning; staying on page 4 of the previous
    // result set is how a filter comes to look as though it returned nothing.
    setPage(1)
  }

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
          <CandidateDossier id={openId} onBack={() => setOpenId(null)} />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
              <Button variant={tab === 'search' ? 'primary' : 'ghost'} size="compact" onClick={() => setTab('search')}>
                Search
              </Button>
              <Button
                variant={tab === 'shortlist' ? 'primary' : 'ghost'}
                size="compact"
                onClick={() => setTab('shortlist')}
              >
                My shortlist
              </Button>
            </div>

            {tab === 'shortlist' ? (
              <ShortlistView onOpen={setOpenId} />
            ) : (
              <>
                <Card>
                  <SectionHeader eyebrow="Search" title="Filters" />

                  <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
                    <Field
                      label="Search"
                      placeholder="Name, profession or specialisation"
                      value={filters.q}
                      onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applyFilters(filters)
                      }}
                    />

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
                      <SelectField
                        label="Education level"
                        value={filters.education_level}
                        onChange={(e) => setFilters({ ...filters, education_level: e.target.value })}
                      >
                        <option value="">Any</option>
                        {EDUCATION_LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </SelectField>
                      <SelectField
                        label="Sort by"
                        value={filters.sort}
                        onChange={(e) => {
                          // Sorting is not a filter you compose — it applies
                          // to the results already on screen.
                          const next = { ...filters, sort: e.target.value }
                          setFilters(next)
                          applyFilters(next)
                        }}
                      >
                        <option value="recent">Recently updated</option>
                        <option value="experience">Most experienced</option>
                        <option value="name">Name (A–Z)</option>
                      </SelectField>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--sp-lg)', flexWrap: 'wrap' }}>
                      <Toggle
                        label="Has presentation video"
                        checked={filters.has_video}
                        onChange={(v) => setFilters({ ...filters, has_video: v })}
                      />
                      <Toggle
                        label="Verified language assessment"
                        checked={filters.verified_assessment}
                        onChange={(v) => setFilters({ ...filters, verified_assessment: v })}
                      />
                      <Toggle
                        label="Dossier submitted"
                        checked={filters.submitted_only}
                        onChange={(v) => setFilters({ ...filters, submitted_only: v })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginTop: 'var(--sp-lg)' }}>
                    <Button onClick={() => applyFilters(filters)}>Search</Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setFilters(EMPTY_FILTERS)
                        applyFilters(EMPTY_FILTERS)
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </Card>

                {isLoading && <p className="helper-text">Loading candidates…</p>}
                {data && data.data.length === 0 && <p className="helper-text">No candidates match these filters.</p>}

                <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
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

                  <Pagination page={page} data={data} onPage={setPage} />
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
