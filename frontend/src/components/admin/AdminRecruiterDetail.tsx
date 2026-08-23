'use client';

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/opsApi'
import { Badge, Button, Card, Eyebrow, Field, Modal, Notice, Tabs } from '@/components/ui'
import { apiErrorMessage } from '@/lib/apiError'
import {
  ACCOUNT_STATUS_LABELS,
  type AccountStatus,
  type AdminActivityEvent,
  type AdminRecruiterDetail as Detail,
  type AdminRecruiterShortlistItem,
} from '@/types/admin'
import type { ShortlistStage } from '@/types/candidate'

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
  { key: 'entreprise', label: 'Entreprise' },
  { key: 'candidatures', label: 'Candidats shortlistés' },
  { key: 'entretiens', label: 'Entretiens' },
  { key: 'activites', label: 'Activités' },
  { key: 'historique', label: 'Historique' },
]

function candidateName(candidate: AdminRecruiterShortlistItem['candidate_profile']) {
  if (!candidate) return 'Candidat supprimé'
  return [candidate.first_name, candidate.last_name].filter(Boolean).join(' ') || `#${candidate.id}`
}

function ShortlistTable({ entries, router }: { entries: AdminRecruiterShortlistItem[]; router: ReturnType<typeof useRouter> }) {
  if (entries.length === 0) return <p className="helper-text">Aucun candidat suivi pour l&apos;instant.</p>

  return (
    <div className="-mx-6 overflow-x-auto px-6">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            <th className="pb-2 pr-3 font-bold">Candidat</th>
            <th className="pb-2 pr-3 font-bold">Stade</th>
            <th className="pb-2 pr-3 font-bold">Notes</th>
            <th className="pb-2 pr-3 font-bold">Dernière mise à jour</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-surface-container/40">
              <td className="py-2 pr-3">
                {entry.candidate_profile ? (
                  <button
                    onClick={() => router.push(`/admin/candidats/${entry.candidate_profile!.id}`)}
                    className="border-none bg-transparent p-0 text-left text-[13px] font-semibold text-primary hover:underline"
                  >
                    {candidateName(entry.candidate_profile)}
                  </button>
                ) : (
                  <span className="text-[13px] text-on-surface-variant">{candidateName(entry.candidate_profile)}</span>
                )}
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

function useActivity(recruiterId: number) {
  return useQuery({
    queryKey: ['admin-recruiter-activity', recruiterId],
    queryFn: () => api.get(`/admin/recruiters/${recruiterId}/activity`).then((r) => r.data as AdminActivityEvent[]),
  })
}

function ActivityTimeline({ recruiterId }: { recruiterId: number }) {
  const { data, isLoading } = useActivity(recruiterId)

  if (isLoading) return <p className="helper-text">Chargement…</p>
  if (!data || data.length === 0) return <p className="helper-text">Aucune activité enregistrée.</p>

  return (
    <div className="grid gap-3">
      {data.map((event, i) => (
        <div key={`${event.type}-${event.at}-${i}`} className="flex gap-3 border-l-2 border-outline-variant pl-3">
          <div className="grid gap-0.5">
            <span className="text-[13px] text-on-surface">{event.label}</span>
            <span className="font-mono text-[11px] text-on-surface-variant">{new Date(event.at).toLocaleString('fr-FR')}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function HistoryList({ recruiterId }: { recruiterId: number }) {
  const { data, isLoading } = useActivity(recruiterId)

  if (isLoading) return <p className="helper-text">Chargement…</p>
  if (!data || data.length === 0) return <p className="helper-text">Aucun historique.</p>

  return (
    <ul className="grid gap-1.5">
      {data.map((event, i) => (
        <li key={`${event.type}-${event.at}-${i}`} className="flex items-baseline justify-between gap-3 text-[13px]">
          <span className="text-on-surface">{event.label}</span>
          <span className="shrink-0 font-mono text-[11px] text-on-surface-variant">{new Date(event.at).toLocaleDateString('fr-FR')}</span>
        </li>
      ))}
    </ul>
  )
}

function OverviewTab({ recruiter }: { recruiter: Detail }) {
  const pending = recruiter.shortlist.filter((e) => e.stage === 'saved' || e.stage === 'contacted').length
  const interviewing = recruiter.shortlist.filter((e) => e.stage === 'interviewing').length
  const placed = recruiter.shortlist.filter((e) => e.stage === 'placed').length
  const recent = [...recruiter.shortlist].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5)

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
        {[
          ['Candidatures totales', recruiter.shortlist.length],
          ['En cours', pending],
          ['Entretiens', interviewing],
          ['Recrutements', placed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-card border border-outline-variant bg-surface-lowest p-3">
            <Eyebrow>{label}</Eyebrow>
            <div className="mt-1 font-mono text-xl leading-none tabular-nums text-on-surface">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-2 border-t border-outline-variant pt-4">
        <Eyebrow tone="accent">Derniers candidats suivis</Eyebrow>
        {recent.length === 0 ? (
          <p className="helper-text">Aucun candidat suivi pour l&apos;instant.</p>
        ) : (
          <ul className="grid gap-1">
            {recent.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 text-[13px] text-on-surface">
                <span>{candidateName(entry.candidate_profile)}</span>
                <Badge tone={entry.stage === 'placed' ? 'done' : 'neutral'}>{STAGE_LABELS[entry.stage]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function CompanyTab({ recruiter }: { recruiter: Detail }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    company_name: recruiter.company?.company_name ?? '',
    sector: recruiter.company?.sector ?? '',
    city: recruiter.company?.city ?? '',
    phone: recruiter.company?.phone ?? '',
    website: recruiter.company?.website ?? '',
    employees_count: recruiter.company?.employees_count?.toString() ?? '',
  })

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/admin/recruiters/${recruiter.id}`, {
        ...form,
        employees_count: form.employees_count ? Number(form.employees_count) : null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-recruiter', recruiter.id] }),
  })

  const verify = useMutation({
    mutationFn: (verified: boolean) => api.patch(`/admin/recruiters/${recruiter.id}/verify`, { verified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recruiter', recruiter.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-recruiters'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
    },
  })

  return (
    <div className="grid gap-6">
      {recruiter.company?.verified_at ? (
        <Notice tone="pending">
          {`Entreprise vérifiée par ${recruiter.company.verified_by?.name ?? 'un administrateur'}.`}
        </Notice>
      ) : (
        <p className="helper-text">Entreprise pas encore vérifiée.</p>
      )}

      <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <Field label="Nom de l'entreprise" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        <Field label="Secteur" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
        <Field label="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Field label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Field label="Site web" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        <Field
          label="Effectif"
          type="number"
          min={0}
          value={form.employees_count}
          onChange={(e) => setForm({ ...form, employees_count: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="compact" disabled={save.isPending} onClick={() => save.mutate()}>
          Enregistrer
        </Button>
        <Button size="compact" variant="ghost" disabled={verify.isPending} onClick={() => verify.mutate(!recruiter.company?.verified_at)}>
          {recruiter.company?.verified_at ? 'Retirer la vérification' : 'Vérifier'}
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
            Ce recruteur ne pourra plus se connecter à la plateforme tant que ce statut n&apos;est pas changé.
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

export function AdminRecruiterDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const activeTab = searchParams.get('tab') ?? 'apercu'
  const [statusTarget, setStatusTarget] = useState<{ status: AccountStatus; label: string } | null>(null)

  const setTab = (key: string) => router.push(`/admin/recruteurs/${id}?tab=${key}`)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-recruiter', id],
    queryFn: () => api.get(`/admin/recruiters/${id}`).then((r) => r.data as Detail),
  })

  const statusMutation = useMutation({
    mutationFn: (status: AccountStatus) => api.patch(`/admin/recruiters/${id}/status`, { status }),
    onSuccess: () => {
      setStatusTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin-recruiter', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-recruiters'] })
      queryClient.invalidateQueries({ queryKey: ['admin-recruiter-activity', id] })
    },
  })

  return (
    <Card>
      <Button variant="ghost" size="compact" onClick={onBack} className="mb-6">
        ← Retour aux recruteurs
      </Button>

      {isLoading && <p className="helper-text">Chargement…</p>}

      {data && (
        <div className="grid gap-6">
          <div className="grid justify-items-start gap-1">
            <h1 className="title">{data.name ?? data.phone}</h1>
            <p className="helper-text">
              {[data.phone, data.email, data.company?.company_name, data.company?.city].filter(Boolean).join(' · ')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={data.status === 'active' ? 'done' : data.status === 'blocked' ? 'error' : 'pending'}>
                {ACCOUNT_STATUS_LABELS[data.status]}
              </Badge>
              <Badge tone={data.company?.verified_at ? 'done' : 'pending'}>
                {data.company?.verified_at ? 'entreprise vérifiée' : 'non vérifiée'}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="compact" variant="ghost" onClick={() => setTab('informations')}>
                Modifier
              </Button>
              {data.status === 'blocked' ? (
                <Button size="compact" variant="ghost" onClick={() => statusMutation.mutate('active')}>
                  Débloquer
                </Button>
              ) : (
                <Button size="compact" variant="danger" onClick={() => setStatusTarget({ status: 'blocked', label: 'Bloquer ce recruteur' })}>
                  Bloquer
                </Button>
              )}
              {data.status === 'inactive' ? (
                <Button size="compact" variant="ghost" onClick={() => statusMutation.mutate('active')}>
                  Réactiver
                </Button>
              ) : (
                <Button size="compact" variant="ghost" onClick={() => setStatusTarget({ status: 'inactive', label: 'Désactiver ce recruteur' })}>
                  Désactiver
                </Button>
              )}
            </div>
          </div>

          <Tabs tabs={TABS} active={activeTab} onChange={setTab} />

          {activeTab === 'apercu' && <OverviewTab recruiter={data} />}
          {activeTab === 'informations' && (
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              {([
                ['Nom', data.name ?? '—'],
                ['Téléphone', data.phone],
                ['Email', data.email ?? '—'],
                ['Inscrit le', new Date(data.created_at).toLocaleDateString('fr-FR')],
                ['Statut', ACCOUNT_STATUS_LABELS[data.status]],
                ['Motif du statut', data.status_reason ?? '—'],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="grid gap-0.5 rounded-element border border-outline-variant p-3">
                  <Eyebrow>{label}</Eyebrow>
                  <span className="text-[14px] text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'entreprise' && <CompanyTab recruiter={data} />}
          {activeTab === 'candidatures' && <ShortlistTable entries={data.shortlist} router={router} />}
          {activeTab === 'entretiens' && (
            <div className="grid gap-2">
              <p className="helper-text">
                Aucune date/heure d&apos;entretien n&apos;est enregistrée dans ce produit — seul le stade « en entretien » du pipeline
                de sélection l&apos;indique.
              </p>
              <ShortlistTable entries={data.shortlist.filter((e) => e.stage === 'interviewing')} router={router} />
            </div>
          )}
          {activeTab === 'activites' && <ActivityTimeline recruiterId={data.id} />}
          {activeTab === 'historique' && <HistoryList recruiterId={data.id} />}
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
