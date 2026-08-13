import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { Card, Button, Badge, SectionHeader } from '../ui'
import type { Complaint, ComplaintStatus } from '../../types/complaint'
import type { PaginatedResponse } from '../../types/candidate'

const storageUrl = (path: string) =>
  `${(import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '')}/storage/${path}`

const COMPLAINT_FILTERS: { value: ComplaintStatus | 'active'; label: string }[] = [
  { value: 'active', label: 'À traiter' },
  { value: 'open', label: 'Ouvertes' },
  { value: 'in_review', label: 'En cours' },
  { value: 'resolved', label: 'Résolues' },
]

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: 'ouverte',
  in_review: 'en cours',
  resolved: 'résolue',
}

/** Une réclamation : l'écouter ou la lire, la faire avancer, y répondre. */
function ComplaintRow({ complaint }: { complaint: Complaint }) {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState(complaint.admin_response ?? '')

  const mutation = useMutation({
    mutationFn: (payload: { status?: ComplaintStatus; response?: string }) =>
      api.patch(`/admin/complaints/${complaint.id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-complaints'] }),
  })

  // Le serveur construit une URL lisible ; storageUrl est le repli pour les
  // lignes écrites avant l'existence de cet attribut.
  const audio = complaint.audio_url ?? (complaint.audio_path ? storageUrl(complaint.audio_path) : null)

  return (
    <div className="border-t border-outline-variant pt-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[13px] tracking-[0.5px] text-on-surface">
          {complaint.user.name ?? complaint.user.phone}
        </span>
        <div className="flex items-center gap-2">
          {/* Une réclamation dont personne n'a été averti est la panne qui mérite
              d'être vue : elle signifie qu'aucun admin n'a d'e-mail et qu'aucun
              webhook n'est configuré. */}
          {!complaint.admin_notified_at && <Badge>non signalée</Badge>}
          <Badge tone={complaint.status === 'resolved' ? 'done' : 'pending'}>
            {STATUS_LABELS[complaint.status]}
          </Badge>
          <Badge>{complaint.type === 'voice' ? 'vocal' : 'texte'}</Badge>
        </div>
      </div>

      {complaint.type === 'text' ? (
        <p className="mt-2 text-sm text-on-surface">{complaint.body}</p>
      ) : (
        audio && <audio controls src={audio} className="mt-2 w-full" />
      )}

      {complaint.responded_at && (
        <p className="helper-text mt-2">
          {`Répondu par ${complaint.responded_by?.name ?? 'un administrateur'} — le candidat le voit dans l'application.`}
        </p>
      )}

      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Répondre au candidat…"
        rows={2}
        className="mt-2 min-h-16 w-full resize-y rounded-element border border-outline bg-surface-lowest px-3.5 py-2.5 text-[15px] text-on-surface transition-colors placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="compact"
          disabled={!reply.trim() || reply.trim() === complaint.admin_response || mutation.isPending}
          onClick={() => mutation.mutate({ response: reply.trim() })}
        >
          {complaint.responded_at ? 'Mettre à jour la réponse' : 'Envoyer la réponse'}
        </Button>

        {complaint.status === 'open' && (
          <Button variant="ghost" size="compact" onClick={() => mutation.mutate({ status: 'in_review' })}>
            Passer en cours
          </Button>
        )}
        {complaint.status !== 'resolved' && (
          <Button variant="ghost" size="compact" onClick={() => mutation.mutate({ status: 'resolved' })}>
            Marquer résolue
          </Button>
        )}
        {complaint.status === 'resolved' && (
          <Button variant="ghost" size="compact" onClick={() => mutation.mutate({ status: 'open' })}>
            Rouvrir
          </Button>
        )}
      </div>
    </div>
  )
}

const isFilterValue = (v: string | null): v is ComplaintStatus | 'active' =>
  v === 'active' || v === 'open' || v === 'in_review' || v === 'resolved'

/**
 * Extrait de l'ancien `AdminDashboard.tsx` pour devenir la route
 * `/admin/reclamations`. Le filtre vit désormais dans l'URL plutôt que dans un
 * `useState` local : `?status=open` doit survivre à une actualisation, un
 * retour arrière ou un lien partagé, ce qu'un état de composant ne permet pas.
 */
export function ComplaintsPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawFilter = searchParams.get('status')
  const filter = isFilterValue(rawFilter) ? rawFilter : 'active'

  const setFilter = (value: ComplaintStatus | 'active') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === 'active') next.delete('status')
        else next.set('status', value)
        return next
      },
      { replace: false }
    )
  }

  const { data, isLoading } = useQuery({
    // « À traiter » couvre deux statuts : le filtrage se fait donc côté client
    // sur la page non filtrée, plutôt que de demander à l'API ce qu'elle ne
    // sait pas exprimer.
    queryKey: ['admin-complaints', filter === 'active' ? null : filter],
    queryFn: () =>
      api
        .get('/admin/complaints', { params: filter === 'active' ? {} : { status: filter } })
        .then((r) => r.data as PaginatedResponse<Complaint>),
    refetchInterval: 5000,
  })

  const complaints = (data?.data ?? []).filter((c) => filter !== 'active' || c.status !== 'resolved')

  return (
    <Card>
      <SectionHeader
        eyebrow="Réclamations"
        title="Réclamations"
        subtitle={isLoading ? 'Chargement…' : `${complaints.length} affichée${complaints.length === 1 ? '' : 's'}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {COMPLAINT_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="compact"
            variant={filter === f.value ? 'primary' : 'ghost'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {complaints.map((c) => (
          <ComplaintRow key={c.id} complaint={c} />
        ))}
        {!isLoading && complaints.length === 0 && <p className="helper-text">Rien ici.</p>}
      </div>
    </Card>
  )
}
