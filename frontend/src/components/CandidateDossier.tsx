'use client';

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/opsApi'
import { AssessmentMetrics } from '@/components/AssessmentMetrics'
import { DocumentList } from '@/components/DocumentList'
import { ShortlistPanel } from '@/components/ShortlistPanel'
import { Badge, Button, Card, Eyebrow } from '@/components/ui'
import type { CandidateDetail } from '@/types/candidate'

const AVAILABILITY_LABELS: Record<string, string> = {
  immediate: 'disponible immédiatement',
  within_1_month: 'disponible sous 1 mois',
  within_2_months: 'disponible sous 2 mois',
}

/** Les sections d'un dossier sont étiquetées par le formulaire : elles prennent
 *  un surtitre plutôt qu'un titre qui concurrencerait le nom du candidat. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-outline-variant pt-4">
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
      <Button variant="ghost" size="compact" onClick={onBack} className="no-print mb-6">
        ← Retour aux résultats
      </Button>

      {isLoading && <p className="helper-text">Chargement…</p>}

      {data && (
        <div className="grid gap-6">
          <div className="grid justify-items-start gap-1">
            <h1 className="title">
              {data.first_name} {data.last_name}
            </h1>
            <p className="helper-text">
              {data.profession} {data.specialization ? `· ${data.specialization}` : ''}
              {data.years_of_experience != null ? ` · ${data.years_of_experience} ans d'expérience` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.availability_status && (
                <Badge tone={data.availability_status === 'immediate' ? 'done' : 'pending'}>
                  {AVAILABILITY_LABELS[data.availability_status] ?? data.availability_status.replace(/_/g, ' ')}
                </Badge>
              )}
              {/* Un brouillon reste visible, mais un recruteur doit savoir qu'il
                  en consulte un avant d'agir dessus. */}
              {data.submitted_at ? <Badge tone="done">dossier soumis</Badge> : <Badge>encore un brouillon</Badge>}
            </div>
          </div>

          <div className="no-print">
            <ShortlistPanel candidate={data} />
          </div>

          <Section title="Langues">
            <div className="grid gap-2">
              {data.languages.length === 0 && <p className="helper-text">Aucune déclarée.</p>}
              {data.languages.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center gap-2">
                  <Badge tone={l.cefr_level ? 'done' : 'pending'}>
                    {l.language.toUpperCase()} {l.cefr_level ?? '—'} ({l.source.replace(/_/g, ' ')})
                  </Badge>
                  {/* Les deux sources, toujours — le niveau retenu est le plus
                      élevé des deux, donc un recruteur doit voir lequel est
                      lequel plutôt qu'un chiffre de provenance inconnue. */}
                  {l.self_declared_cefr && <span className="helper-text">déclaré {l.self_declared_cefr}</span>}
                  {l.ai_cefr && <span className="helper-text">IA {l.ai_cefr}</span>}
                  {l.level_discrepancy && <Badge tone="pending">niveaux déclaré et évalué divergents</Badge>}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Formation">
            {data.educations.length === 0 && <p className="helper-text">Aucune enregistrée.</p>}
            {data.educations.map((e) => (
              <p key={e.id} className="mb-1 text-sm text-on-surface">
                {e.level.replace(/_/g, ' ')} {e.field ? `· ${e.field}` : ''} {e.institution ? `· ${e.institution}` : ''}
              </p>
            ))}
          </Section>

          <Section title="Documents">
            <DocumentList documents={data.documents} />
          </Section>

          {data.language_assessments.length > 0 && (
            <Section title="Mesures de l'évaluation IA">
              <AssessmentMetrics assessments={data.language_assessments} />
            </Section>
          )}

          {data.video_url && (
            <Section title="Vidéo de présentation">
              <video controls className="w-full max-w-[480px] rounded-element">
                <source src={data.video_url} />
              </video>
            </Section>
          )}
        </div>
      )}
    </Card>
  )
}
