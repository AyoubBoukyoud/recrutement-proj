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
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'Arabe' },
  { value: 'en', label: 'Anglais' },
  { value: 'de', label: 'Allemand' },
]

const EDUCATION_LEVELS = [
  { value: 'general_school', label: 'Enseignement général' },
  { value: 'vocational', label: 'Formation professionnelle' },
  { value: 'professional_training', label: 'Formation qualifiante' },
  { value: 'bachelor', label: 'Licence' },
  { value: 'master', label: 'Master' },
  { value: 'other', label: 'Autre' },
]

const STAGE_LABELS: Record<ShortlistStage, string> = {
  saved: 'Enregistré',
  contacted: 'Contacté',
  interviewing: 'En entretien',
  placed: 'Placé',
  rejected: 'Sans suite',
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

/** Écarte les vides, pour que la requête ne porte que les choix du recruteur. */
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
    <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-outline-variant text-primary accent-primary focus:ring-2 focus:ring-primary/25"
      />
      {label}
    </label>
  )
}

function CandidateCard({ candidate, onOpen }: { candidate: CandidateListItem; onOpen: () => void }) {
  return (
    /* Un bouton, pas un div cliquable — la carte entière est une seule cible et
       doit s'atteindre au clavier comme n'importe quel autre contrôle ici. */
    <button
      onClick={onOpen}
      className="group h-full rounded-card border border-outline-variant bg-surface-lowest p-5 text-left transition-colors hover:border-primary focus-visible:border-primary"
    >
      <h3 className="mb-1 text-[15px] font-semibold text-on-surface group-hover:text-primary">
        {candidate.first_name} {candidate.last_name}
      </h3>
      <p className="helper-text">
        {candidate.profession ?? 'Métier non renseigné'}
        {candidate.specialization ? ` · ${candidate.specialization}` : ''}
        {candidate.years_of_experience != null ? ` · ${candidate.years_of_experience} ans` : ''}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {candidate.languages.map((l) => (
          <Badge key={l.id} tone={l.cefr_level ? 'done' : 'pending'}>
            {l.language.toUpperCase()} {l.cefr_level ?? '—'}
          </Badge>
        ))}
      </div>

      {/* Où ce recruteur s'était arrêté, et ce qui mérite son temps. Les marques
          de tri appartiennent à la carte, pas à deux clics dans le dossier. */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {candidate.shortlisted && candidate.shortlist_stage && (
          <Badge tone="done">{STAGE_LABELS[candidate.shortlist_stage]}</Badge>
        )}
        {candidate.has_verified_assessment && <Badge>évalué</Badge>}
        {candidate.has_video && <Badge>vidéo</Badge>}
        {!candidate.submitted && <Badge tone="pending">brouillon</Badge>}
      </div>
    </button>
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
    link.download = `selection-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          eyebrow="Pipeline"
          title="Ma sélection"
          subtitle="Les candidats que vous avez retenus, et où chacun en est."
        />
        <Button variant="ghost" size="compact" onClick={downloadCsv}>
          Exporter en CSV
        </Button>
      </div>

      {isLoading && <p className="helper-text">Chargement…</p>}
      {data && data.data.length === 0 && (
        <p className="helper-text">
          Rien d&apos;enregistré pour l&apos;instant. Ouvrez un candidat et retenez-le pour démarrer un pipeline.
        </p>
      )}

      <div className="grid gap-2">
        {data?.data.map((row) => (
          <div
            key={row.id}
            className="flex flex-wrap items-center gap-4 border-t border-outline-variant py-2"
          >
            <button
              onClick={() => onOpen(row.candidate_profile_id)}
              className="cursor-pointer border-none bg-transparent p-0 text-left"
            >
              <span className="text-[15px] font-semibold text-on-surface hover:text-primary">
                {row.candidate?.first_name} {row.candidate?.last_name}
              </span>
              <span className="helper-text block">{row.candidate?.profession ?? 'Métier non renseigné'}</span>
            </button>

            <Badge tone={row.stage === 'placed' ? 'done' : 'pending'}>{STAGE_LABELS[row.stage]}</Badge>

            {row.contact?.phone && (
              <a href={`tel:${row.contact.phone}`} className="font-mono text-[13px] text-primary hover:underline">
                {row.contact.phone}
              </a>
            )}

            {row.notes && <span className="helper-text basis-full">{row.notes}</span>}
          </div>
        ))}
      </div>

      <div className="mt-4">
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
    // Une nouvelle recherche repart du début ; rester en page 4 du jeu de
    // résultats précédent, c'est ainsi qu'un filtre paraît n'avoir rien renvoyé.
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopBar title="Recherche recruteur" />

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8">
        {openId ? (
          <CandidateDossier id={openId} onBack={() => setOpenId(null)} />
        ) : (
          <>
            <div className="flex gap-2">
              <Button variant={tab === 'search' ? 'primary' : 'ghost'} size="compact" onClick={() => setTab('search')}>
                Recherche
              </Button>
              <Button
                variant={tab === 'shortlist' ? 'primary' : 'ghost'}
                size="compact"
                onClick={() => setTab('shortlist')}
              >
                Ma sélection
              </Button>
            </div>

            {tab === 'shortlist' ? (
              <ShortlistView onOpen={setOpenId} />
            ) : (
              <>
                <Card>
                  <SectionHeader eyebrow="Recherche" title="Filtres" />

                  <div className="grid gap-4">
                    <Field
                      label="Recherche"
                      placeholder="Nom, métier ou spécialisation"
                      value={filters.q}
                      onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applyFilters(filters)
                      }}
                    />

                    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
                      <Field
                        label="Métier"
                        value={filters.profession}
                        onChange={(e) => setFilters({ ...filters, profession: e.target.value })}
                      />
                      <Field
                        label="Spécialisation"
                        value={filters.specialization}
                        onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                      />
                      <SelectField
                        label="Langue"
                        value={filters.language}
                        onChange={(e) => setFilters({ ...filters, language: e.target.value as Language | '' })}
                      >
                        <option value="">Indifférent</option>
                        {LANGUAGES.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </SelectField>
                      <SelectField
                        label="Niveau CECRL min."
                        value={filters.cefr_level}
                        onChange={(e) => setFilters({ ...filters, cefr_level: e.target.value })}
                      >
                        <option value="">Indifférent</option>
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </SelectField>
                      <Field
                        label="Années d'expérience min."
                        type="number"
                        value={filters.min_experience}
                        onChange={(e) => setFilters({ ...filters, min_experience: e.target.value })}
                      />
                      <SelectField
                        label="Disponibilité"
                        value={filters.availability_status}
                        onChange={(e) => setFilters({ ...filters, availability_status: e.target.value })}
                      >
                        <option value="">Indifférent</option>
                        <option value="immediate">Immédiate</option>
                        <option value="within_1_month">Sous 1 mois</option>
                        <option value="within_2_months">Sous 2 mois</option>
                      </SelectField>
                      <SelectField
                        label="Niveau d'études"
                        value={filters.education_level}
                        onChange={(e) => setFilters({ ...filters, education_level: e.target.value })}
                      >
                        <option value="">Indifférent</option>
                        {EDUCATION_LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </SelectField>
                      <SelectField
                        label="Trier par"
                        value={filters.sort}
                        onChange={(e) => {
                          // Le tri ne se compose pas comme un filtre : il
                          // s'applique aux résultats déjà à l'écran.
                          const next = { ...filters, sort: e.target.value }
                          setFilters(next)
                          applyFilters(next)
                        }}
                      >
                        <option value="recent">Mise à jour récente</option>
                        <option value="experience">Plus expérimenté</option>
                        <option value="name">Nom (A–Z)</option>
                      </SelectField>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <Toggle
                        label="Vidéo de présentation"
                        checked={filters.has_video}
                        onChange={(v) => setFilters({ ...filters, has_video: v })}
                      />
                      <Toggle
                        label="Évaluation de langue vérifiée"
                        checked={filters.verified_assessment}
                        onChange={(v) => setFilters({ ...filters, verified_assessment: v })}
                      />
                      <Toggle
                        label="Dossier soumis"
                        checked={filters.submitted_only}
                        onChange={(v) => setFilters({ ...filters, submitted_only: v })}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button onClick={() => applyFilters(filters)}>Rechercher</Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setFilters(EMPTY_FILTERS)
                        applyFilters(EMPTY_FILTERS)
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </Card>

                {isLoading && <p className="helper-text">Chargement des candidats…</p>}
                {data && data.data.length === 0 && (
                  <p className="helper-text">Aucun candidat ne correspond à ces filtres.</p>
                )}

                <div className="grid gap-4">
                  <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
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
