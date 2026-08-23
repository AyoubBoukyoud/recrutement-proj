'use client';

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/opsApi'
import { Badge, Button, Card, Eyebrow, Field, Modal, Notice, Tabs } from '@/components/ui'
import { EngagementBadge } from '@/components/admin/EngagementBadge'
import { AssignTasks } from '@/components/admin/AssignTasks'
import { apiErrorMessage } from '@/lib/apiError'
import {
  ACCOUNT_STATUS_LABELS,
  SKILL_LEVEL_LABELS,
  type AccountStatus,
  type AdminActivityEvent,
  type AdminCandidateDetail as Detail,
  type AdminDocument,
  type AdminShortlistEntry,
} from '@/types/admin'
import type { ShortlistStage } from '@/types/candidate'

const APPROVAL_TONE = { approved: 'done', rejected: 'pending', pending: 'pending' } as const

const APPROVAL_LABELS = { approved: 'approuvé', rejected: 'rejeté', pending: 'en attente' } as const

const DOCUMENT_LABELS: Record<AdminDocument['type'], string> = {
  cv: 'CV',
  certificate: 'certificat',
  diploma: 'diplôme',
}

/**
 * Ce produit n'a pas d'offres d'emploi ni de candidatures formelles : ce
 * qu'un recruteur fait d'un candidat est ce pipeline (RecruiterShortlist
 * côté backend). « Candidatures » et « Entretiens » dans ce module sont donc
 * ces mêmes lignes, lues sous deux angles différents — pas une donnée
 * inventée séparément.
 */
const STAGE_LABELS: Record<ShortlistStage, string> = {
  saved: 'Enregistré',
  contacted: 'Contacté',
  interviewing: 'En entretien',
  placed: 'Placé',
  rejected: 'Sans suite',
}

const TABS: { key: string; label: string }[] = [
  { key: 'apercu', label: "Vue d'ensemble" },
  { key: 'informations', label: 'Informations' },
  { key: 'cv', label: 'CV' },
  { key: 'competences', label: 'Compétences' },
  { key: 'experiences', label: 'Expériences' },
  { key: 'formation', label: 'Formation' },
  { key: 'candidatures', label: 'Candidatures' },
  { key: 'entretiens', label: 'Entretiens' },
  { key: 'activites', label: 'Activités' },
  { key: 'notes', label: 'Notes' },
  { key: 'historique', label: 'Historique' },
]

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
        {document.ocr_status !== 'completed' && <Badge>scan : {document.ocr_status.replace('_', ' ')}</Badge>}
        {document.url && (
          <a href={document.url} target="_blank" rel="noreferrer" className="helper-text hover:text-primary">
            Ouvrir
          </a>
        )}
      </div>

      {document.rejection_reason && !rejecting && <p className="helper-text">Rejeté : {document.rejection_reason}</p>}

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

function ShortlistTable({ entries, router }: { entries: AdminShortlistEntry[]; router: ReturnType<typeof useRouter> }) {
  if (entries.length === 0) return <p className="helper-text">Aucun recruteur n&apos;a suivi ce candidat pour l&apos;instant.</p>

  return (
    <div className="-mx-6 overflow-x-auto px-6">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            <th className="pb-2 pr-3 font-bold">Recruteur</th>
            <th className="pb-2 pr-3 font-bold">Stade</th>
            <th className="pb-2 pr-3 font-bold">Notes</th>
            <th className="pb-2 pr-3 font-bold">Dernière mise à jour</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-surface-container/40">
              <td className="py-2 pr-3">
                <button
                  onClick={() => router.push(`/admin/recruteurs/${entry.user.id}`)}
                  className="border-none bg-transparent p-0 text-left text-[13px] font-semibold text-primary hover:underline"
                >
                  {entry.user.name ?? entry.user.phone}
                </button>
              </td>
              <td className="py-2 pr-3">
                <Badge tone={entry.stage === 'placed' ? 'done' : entry.stage === 'rejected' ? 'error' : 'pending'}>
                  {STAGE_LABELS[entry.stage]}
                </Badge>
              </td>
              <td className="py-2 pr-3 text-[13px] text-on-surface-variant">{entry.notes ?? '—'}</td>
              <td className="py-2 pr-3 text-[12px] text-on-surface-variant">
                {new Date(entry.updated_at).toLocaleDateString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActivityTimeline({ candidateId }: { candidateId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-candidate-activity', candidateId],
    queryFn: () => api.get(`/admin/candidates/${candidateId}/activity`).then((r) => r.data as AdminActivityEvent[]),
  })

  if (isLoading) return <p className="helper-text">Chargement…</p>
  if (!data || data.length === 0) return <p className="helper-text">Aucune activité enregistrée.</p>

  return (
    <div className="grid gap-3">
      {data.map((event, i) => (
        <div key={`${event.type}-${event.at}-${i}`} className="flex gap-3 border-l-2 border-outline-variant pl-3">
          <div className="grid gap-0.5">
            <span className="text-[13px] text-on-surface">{event.label}</span>
            <span className="font-mono text-[11px] text-on-surface-variant">
              {new Date(event.at).toLocaleString('fr-FR')}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function HistoryList({ candidateId }: { candidateId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-candidate-activity', candidateId],
    queryFn: () => api.get(`/admin/candidates/${candidateId}/activity`).then((r) => r.data as AdminActivityEvent[]),
  })

  if (isLoading) return <p className="helper-text">Chargement…</p>
  if (!data || data.length === 0) return <p className="helper-text">Aucun historique.</p>

  return (
    <ul className="grid gap-1.5">
      {data.map((event, i) => (
        <li key={`${event.type}-${event.at}-${i}`} className="flex items-baseline justify-between gap-3 text-[13px]">
          <span className="text-on-surface">{event.label}</span>
          <span className="shrink-0 font-mono text-[11px] text-on-surface-variant">
            {new Date(event.at).toLocaleDateString('fr-FR')}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Le pipeline recruteur (§ Candidatures) tient lieu de KPI « candidatures » — aucune autre entité ne les compte dans ce produit. */
function OverviewTab({ candidate }: { candidate: Detail }) {
  const active = candidate.shortlist_entries.filter((e) => e.stage === 'contacted' || e.stage === 'interviewing').length
  const interviewing = candidate.shortlist_entries.filter((e) => e.stage === 'interviewing').length
  const placed = candidate.shortlist_entries.filter((e) => e.stage === 'placed').length

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
        {[
          ['Candidatures', candidate.shortlist_entries.length],
          ['En cours', active],
          ['Entretiens', interviewing],
          ['Recrutements', placed],
          ['Profil complété', `${candidate.completeness.percent}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-card border border-outline-variant bg-surface-lowest p-3">
            <Eyebrow>{label}</Eyebrow>
            <div className="mt-1 font-mono text-xl leading-none tabular-nums text-on-surface">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-2 border-t border-outline-variant pt-4">
        <Eyebrow tone="accent">Résumé du profil</Eyebrow>
        <div className="grid gap-1.5 text-[14px] text-on-surface">
          <p>
            <span className="text-on-surface-variant">Compétences principales : </span>
            {candidate.skills.length > 0 ? candidate.skills.slice(0, 5).map((s) => s.skill).join(', ') : '—'}
          </p>
          <p>
            <span className="text-on-surface-variant">Poste souhaité : </span>
            {[candidate.profession, candidate.specialization].filter(Boolean).join(' · ') || '—'}
          </p>
          <p>
            <span className="text-on-surface-variant">Formation : </span>
            {candidate.educations[0]
              ? [candidate.educations[0].field ?? candidate.educations[0].level, candidate.educations[0].institution]
                  .filter(Boolean)
                  .join(' · ')
              : '—'}
          </p>
          <p>
            <span className="text-on-surface-variant">Ville préférée : </span>
            {candidate.city ?? '—'}
          </p>
          <p>
            <span className="text-on-surface-variant">Disponibilité : </span>
            {candidate.availability_status ?? '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

function InformationsTab({ candidate }: { candidate: Detail }) {
  const rows: [string, string][] = [
    ['Prénom', candidate.first_name ?? '—'],
    ['Nom', candidate.last_name ?? '—'],
    ['Date de naissance', candidate.date_of_birth ?? '—'],
    ['Ville', candidate.city ?? '—'],
    ['Téléphone', candidate.user.phone],
    ['Email', candidate.user.email ?? '—'],
    ['Disponibilité', candidate.availability_status ?? '—'],
    ['Inscrit le', new Date(candidate.user.created_at).toLocaleDateString('fr-FR')],
    ['Conditions acceptées', candidate.terms_consent_at ? new Date(candidate.terms_consent_at).toLocaleDateString('fr-FR') : 'non'],
    ['Consentement CNDP', candidate.cndp_consent_at ? new Date(candidate.cndp_consent_at).toLocaleDateString('fr-FR') : 'non'],
  ]

  return (
    <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-0.5 rounded-element border border-outline-variant p-3">
          <Eyebrow>{label}</Eyebrow>
          <span className="text-[14px] text-on-surface">{value}</span>
        </div>
      ))}
    </div>
  )
}

function VerifyAction({ candidate }: { candidate: Detail }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (verified: boolean) => api.patch(`/admin/candidates/${candidate.id}`, { verified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-candidate', candidate.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
    },
  })

  return (
    <div className="grid gap-2 border-t border-outline-variant pt-4">
      <Eyebrow tone="accent">Vérification</Eyebrow>
      {candidate.verified_at ? (
        <Notice tone="pending">
          {`Vérifié par ${candidate.verified_by?.name ?? 'un administrateur'}. Les recruteurs voient ce dossier comme contrôlé.`}
        </Notice>
      ) : (
        <p className="helper-text">Pas encore vérifié.</p>
      )}
      <div>
        <Button
          size="compact"
          variant="ghost"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(!candidate.verified_at)}
        >
          {candidate.verified_at ? 'Retirer la vérification' : 'Marquer vérifié'}
        </Button>
      </div>
    </div>
  )
}

function NotesTab({ candidate }: { candidate: Detail }) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState(candidate.admin_notes ?? '')

  const mutation = useMutation({
    mutationFn: () => api.patch(`/admin/candidates/${candidate.id}`, { admin_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-candidate', candidate.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-candidate-activity', candidate.id] })
    },
  })

  return (
    <div className="grid gap-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes de suivi internes — jamais montrées au candidat ni aux recruteurs."
        aria-label="Notes de suivi internes"
        rows={6}
        className="min-h-[140px] w-full resize-y rounded-element border border-outline bg-surface-lowest px-3.5 py-2.5 text-[15px] text-on-surface transition-colors placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <div>
        <Button size="compact" disabled={mutation.isPending || notes === (candidate.admin_notes ?? '')} onClick={() => mutation.mutate()}>
          Enregistrer les notes
        </Button>
      </div>
    </div>
  )
}

function StatusModal({
  open,
  onClose,
  target,
  onConfirm,
  pending,
  error,
}: {
  open: boolean
  onClose: () => void
  target: { status: AccountStatus; label: string } | null
  onConfirm: () => void
  pending: boolean
  error: unknown
}) {
  return (
    <Modal open={open} onClose={onClose} title={target?.label ?? ''}>
      {target && (
        <div className="grid gap-4">
          <p className="text-[14px] text-on-surface-variant">
            Ce candidat ne pourra plus se connecter à la plateforme tant que ce statut n&apos;est pas changé.
          </p>
          {!!error && <Notice>{apiErrorMessage(error, "Cela n'a pas fonctionné. Réessayez.")}</Notice>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="compact" onClick={onClose} disabled={pending}>
              Annuler
            </Button>
            <Button variant="danger" size="compact" onClick={onConfirm} disabled={pending}>
              Confirmer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export function AdminCandidateDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const activeTab = searchParams.get('tab') ?? 'apercu'
  const [statusTarget, setStatusTarget] = useState<{ status: AccountStatus; label: string } | null>(null)

  const setTab = (key: string) => router.push(`/admin/candidats/${id}?tab=${key}`)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-candidate', id],
    queryFn: () => api.get(`/admin/candidates/${id}`).then((r) => r.data as Detail),
  })

  const statusMutation = useMutation({
    mutationFn: (status: AccountStatus) => api.patch(`/admin/candidates/${id}/status`, { status }),
    onSuccess: () => {
      setStatusTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin-candidate', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['admin-candidate-activity', id] })
    },
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
            <h1 className="title">{[data.first_name, data.last_name].filter(Boolean).join(' ') || data.user.phone}</h1>
            <p className="helper-text">
              {[data.user.phone, data.user.email, data.city, data.profession].filter(Boolean).join(' · ')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={data.user.status === 'active' ? 'done' : data.user.status === 'blocked' ? 'error' : 'pending'}>
                {ACCOUNT_STATUS_LABELS[data.user.status]}
              </Badge>
              <Badge tone={data.verified_at ? 'done' : 'pending'}>
                {data.verified_at ? 'vérifié' : data.submitted_at ? 'soumis' : 'brouillon'}
              </Badge>
              <Badge tone={data.completeness.percent >= 100 ? 'done' : 'pending'}>{data.completeness.percent} % complet</Badge>
              <EngagementBadge engagement={data.engagement} />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="compact" variant="ghost" onClick={() => setTab('informations')}>
                Modifier
              </Button>
              <Button size="compact" variant="ghost" onClick={() => setTab('cv')}>
                Voir le CV
              </Button>
              {data.user.email && (
                <Button size="compact" variant="ghost" onClick={() => window.open(`mailto:${data.user.email}`)}>
                  Contacter
                </Button>
              )}
              {data.user.status === 'blocked' ? (
                <Button size="compact" variant="ghost" onClick={() => statusMutation.mutate('active')}>
                  Débloquer
                </Button>
              ) : (
                <Button
                  size="compact"
                  variant="danger"
                  onClick={() => setStatusTarget({ status: 'blocked', label: 'Bloquer ce candidat' })}
                >
                  Bloquer
                </Button>
              )}
              {data.user.status === 'inactive' ? (
                <Button size="compact" variant="ghost" onClick={() => statusMutation.mutate('active')}>
                  Réactiver
                </Button>
              ) : (
                <Button
                  size="compact"
                  variant="ghost"
                  onClick={() => setStatusTarget({ status: 'inactive', label: 'Désactiver ce candidat' })}
                >
                  Désactiver
                </Button>
              )}
            </div>
          </div>

          <Tabs tabs={TABS} active={activeTab} onChange={setTab} />

          {activeTab === 'apercu' && <OverviewTab candidate={data} />}
          {activeTab === 'informations' && (
            <div className="grid gap-6">
              <InformationsTab candidate={data} />
              <VerifyAction candidate={data} />
            </div>
          )}
          {activeTab === 'cv' && (
            <div className="grid gap-2">
              {data.documents.filter((d) => d.type === 'cv').length === 0 ? (
                <p className="helper-text">Aucun CV téléversé pour l&apos;instant.</p>
              ) : (
                data.documents
                  .filter((d) => d.type === 'cv')
                  .map((document) => <DocumentRow key={document.id} document={document} candidateId={data.id} />)
              )}
            </div>
          )}
          {activeTab === 'competences' && (
            <div className="grid gap-2">
              {data.skills.length === 0 ? (
                <p className="helper-text">Aucune compétence déclarée.</p>
              ) : (
                data.skills.map((skill) => (
                  <div key={skill.id} className="flex flex-wrap items-center gap-2 border-t border-outline-variant py-2">
                    <span className="min-w-[140px] flex-1 text-sm text-on-surface">{skill.skill}</span>
                    <Badge tone="neutral">{SKILL_LEVEL_LABELS[skill.level]}</Badge>
                    {skill.years_of_experience != null && (
                      <span className="helper-text">{skill.years_of_experience} ans</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === 'experiences' && (
            <div className="grid gap-2">
              <p className="helper-text">
                Ce produit ne suit pas d&apos;historique d&apos;expériences détaillé — seul le poste actuel déclaré est disponible.
              </p>
              {data.profession ? (
                <div className="rounded-element border border-outline-variant p-4">
                  <p className="text-[15px] font-semibold text-on-surface">{data.profession}</p>
                  <p className="helper-text">
                    {[data.specialization, data.years_of_experience != null ? `${data.years_of_experience} ans` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              ) : (
                <p className="helper-text">Aucun poste déclaré.</p>
              )}
            </div>
          )}
          {activeTab === 'formation' && (
            <div className="grid gap-1">
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
            </div>
          )}
          {activeTab === 'candidatures' && <ShortlistTable entries={data.shortlist_entries} router={router} />}
          {activeTab === 'entretiens' && (
            <div className="grid gap-2">
              <p className="helper-text">
                Aucune date/heure d&apos;entretien n&apos;est enregistrée dans ce produit — seul le stade « en entretien » du pipeline
                recruteur l&apos;indique.
              </p>
              <ShortlistTable
                entries={data.shortlist_entries.filter((e) => e.stage === 'interviewing')}
                router={router}
              />
            </div>
          )}
          {activeTab === 'activites' && <ActivityTimeline candidateId={data.id} />}
          {activeTab === 'notes' && <NotesTab candidate={data} />}
          {activeTab === 'historique' && <HistoryList candidateId={data.id} />}

          <div className="border-t border-outline-variant pt-4">
            <Eyebrow tone="accent">Stage quotidien</Eyebrow>
            <div className="mt-2">
              <AssignTasks candidate={data} />
            </div>
          </div>
        </div>
      )}

      <StatusModal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        target={statusTarget}
        pending={statusMutation.isPending}
        error={statusMutation.error}
        onConfirm={() => statusTarget && statusMutation.mutate(statusTarget.status)}
      />
    </Card>
  )
}
