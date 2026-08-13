'use client';

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/opsApi'
import { Badge, Button, Card, Eyebrow, Field, Notice } from '@/components/ui'
import { EngagementBadge } from '@/components/admin/EngagementBadge'
import { AssignTasks } from '@/components/admin/AssignTasks'
import type { AdminCandidateDetail as Detail, AdminDocument } from '@/types/admin'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-outline-variant pt-4">
      <Eyebrow tone="accent">{title}</Eyebrow>
      {children}
    </div>
  )
}

const APPROVAL_TONE = { approved: 'done', rejected: 'pending', pending: 'pending' } as const

const APPROVAL_LABELS = { approved: 'approuvé', rejected: 'rejeté', pending: 'en attente' } as const

const DOCUMENT_LABELS: Record<AdminDocument['type'], string> = {
  cv: 'CV',
  certificate: 'certificat',
  diploma: 'diplôme',
}

/**
 * Accepter ou rejeter un document. Distinct d'`ocr_status` : la photo lisible
 * du mauvais diplôme se scanne parfaitement et reste irrecevable, et le
 * candidat doit savoir lequel des deux s'est produit.
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
    <div className="grid gap-2 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-[120px] flex-1 text-sm text-on-surface">{DOCUMENT_LABELS[document.type]}</span>
        <Badge tone={APPROVAL_TONE[document.approval_status]}>{APPROVAL_LABELS[document.approval_status]}</Badge>
        {/* Le verdict de notre scanner, tenu visiblement à part du nôtre. */}
        {document.ocr_status !== 'completed' && <Badge>scan : {document.ocr_status.replace('_', ' ')}</Badge>}
        {document.url && (
          <a href={document.url} target="_blank" rel="noreferrer" className="helper-text hover:text-primary">
            Ouvrir
          </a>
        )}
      </div>

      {document.rejection_reason && !rejecting && (
        <p className="helper-text">Rejeté : {document.rejection_reason}</p>
      )}

      {rejecting ? (
        <div className="grid gap-2">
          <Field
            label="Pourquoi ce document est-il rejeté ?"
            hint="le candidat le voit"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Il s'agit d'un bulletin de paie, pas d'un diplôme."
          />
          <div className="flex gap-2">
            <Button
              size="compact"
              disabled={!reason.trim() || review.isPending}
              onClick={() => review.mutate({ approval_status: 'rejected', rejection_reason: reason.trim() })}
            >
              Confirmer le rejet
            </Button>
            <Button variant="ghost" size="compact" onClick={() => setRejecting(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {document.approval_status !== 'approved' && (
            <Button size="compact" variant="ghost" onClick={() => review.mutate({ approval_status: 'approved' })}>
              Approuver
            </Button>
          )}
          {document.approval_status !== 'rejected' && (
            <Button size="compact" variant="ghost" onClick={() => setRejecting(true)}>
              Rejeter
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** Vérification et notes internes — le jugement propre de l'administrateur, que
 *  la liste de complétude ne sait délibérément pas exprimer. */
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
    <div className="grid gap-2">
      {candidate.verified_at ? (
        <Notice tone="pending">
          {`Vérifié par ${candidate.verified_by?.name ?? 'un administrateur'}. Les recruteurs voient ce dossier comme contrôlé.`}
        </Notice>
      ) : (
        <p className="helper-text">
          Pas encore vérifié. La liste rapporte ce qui existe ; vérifier enregistre qu&apos;une personne l&apos;a lu.
        </p>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes de suivi internes — jamais montrées au candidat ni aux recruteurs."
        rows={3}
        className="min-h-[72px] w-full resize-y rounded-element border border-outline bg-surface-lowest px-3.5 py-2.5 text-[15px] text-on-surface transition-colors placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="compact"
          disabled={mutation.isPending || notes === (candidate.admin_notes ?? '')}
          onClick={() => mutation.mutate({ admin_notes: notes })}
        >
          Enregistrer les notes
        </Button>
        <Button
          variant="ghost"
          size="compact"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ verified: !candidate.verified_at })}
        >
          {candidate.verified_at ? 'Retirer la vérification' : 'Marquer vérifié'}
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
      <Button variant="ghost" size="compact" onClick={onBack} className="mb-6">
        ← Retour aux candidats
      </Button>

      {isLoading && <p className="helper-text">Chargement…</p>}

      {data && (
        <div className="grid gap-6">
          <div className="grid justify-items-start gap-1">
            <h1 className="title">
              {[data.first_name, data.last_name].filter(Boolean).join(' ') || data.user.phone}
            </h1>
            <p className="helper-text">
              {[
                data.user.phone,
                data.profession,
                data.specialization,
                data.years_of_experience != null ? `${data.years_of_experience} ans` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={data.verified_at ? 'done' : 'pending'}>
                {data.verified_at ? 'vérifié' : data.submitted_at ? 'soumis' : 'brouillon'}
              </Badge>
              <Badge>{data.completeness.percent} % complet</Badge>
              <EngagementBadge engagement={data.engagement} />
            </div>
          </div>

          <Section title="Vérification">
            <VerificationPanel candidate={data} />
          </Section>

          <Section title="Stage quotidien">
            <AssignTasks candidate={data} />
          </Section>

          <Section title="Documents">
            {data.documents.length === 0 ? (
              <p className="helper-text">Rien de téléversé pour l&apos;instant.</p>
            ) : (
              data.documents.map((document) => (
                <DocumentRow key={document.id} document={document} candidateId={data.id} />
              ))
            )}
          </Section>

          <Section title="Langues">
            {data.languages.length === 0 ? (
              <p className="helper-text">Aucune déclarée.</p>
            ) : (
              <div className="grid gap-1">
                {data.languages.map((language) => (
                  <div key={language.id} className="flex items-center gap-2">
                    <span className="w-8 font-mono text-[13px] text-on-surface">
                      {language.language.toUpperCase()}
                    </span>
                    <span className="w-10 text-sm text-on-surface">{language.cefr_level ?? '—'}</span>
                    <span className="helper-text">{language.source.replace(/_/g, ' ')}</span>
                    {language.level_discrepancy && <Badge>sources divergentes</Badge>}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Formation">
            {data.educations.length === 0 ? (
              <p className="helper-text">Aucune enregistrée.</p>
            ) : (
              data.educations.map((education) => (
                <p key={education.id} className="text-sm text-on-surface">
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
