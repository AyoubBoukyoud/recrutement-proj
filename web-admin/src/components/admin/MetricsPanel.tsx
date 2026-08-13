import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Card, Eyebrow, SectionHeader } from '../ui'
import type { Metrics } from '../../types/admin'

/**
 * Un chiffre, et ce qu'il veut dire. Le ton est réservé aux valeurs qui
 * réclament une action — un arriéré de documents que personne n'a approuvés
 * n'est pas un fait de même nature que le nombre de candidats existants.
 *
 * `to`, quand il est fourni, rend le chiffre cliquable vers la section
 * concernée. Le filtre n'est mis dans l'URL que lorsque la destination le
 * comprend déjà (`?status=…` sur les candidats ou les réclamations) ; les
 * autres chiffres actionnables mènent à leur section sans filtre inventé —
 * aucun changement d'adaptateur ni de contrat d'API n'accompagne ce lien.
 */
function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
  to,
}: {
  label: string
  value: number | string
  hint?: string
  tone?: 'neutral' | 'attention'
  to?: string
}) {
  const valueClass = `font-mono text-2xl leading-none tabular-nums ${
    tone === 'attention' && Number(value) > 0 ? 'text-attention' : 'text-on-surface'
  }`

  if (to) {
    return (
      <Link to={to} className="group grid min-w-0 gap-0.5 rounded-sm">
        <Eyebrow>{label}</Eyebrow>
        <span className={`${valueClass} group-hover:underline`}>{value}</span>
        {hint && <span className="helper-text">{hint}</span>}
      </Link>
    )
  }

  return (
    <div className="grid min-w-0 gap-0.5">
      <Eyebrow>{label}</Eyebrow>
      <span className={valueClass}>{value}</span>
      {hint && <span className="helper-text">{hint}</span>}
    </div>
  )
}

function StatRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-outline-variant pt-4">
      <Eyebrow tone="accent">{title}</Eyebrow>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">{children}</div>
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
        title="Plateforme"
        subtitle={isLoading ? 'Chargement…' : 'Actualisé toutes les 30 secondes'}
      />

      {data && (
        <div className="grid gap-4">
          <StatRow title="Candidats">
            <Stat label="Total" value={data.candidates.total} />
            <Stat
              label="Soumis"
              value={data.candidates.submitted}
              hint="déclarés terminés"
              to="/admin/candidats?status=submitted"
            />
            <Stat
              label="Vérifiés"
              value={data.candidates.verified}
              hint="contrôlés par nous"
              to="/admin/candidats?status=verified"
            />
            <Stat label="Visibles" value={data.candidates.discoverable} hint="consentements enregistrés" />
            <Stat label="Nouveaux cette semaine" value={data.candidates.new_this_week} />
          </StatRow>

          <StatRow title="Pièces justificatives">
            <Stat
              label="À approuver"
              value={data.documents.awaiting_approval}
              tone="attention"
              hint="en attente de notre côté"
              to="/admin/candidats"
            />
            <Stat label="Approuvés" value={data.documents.approved} />
            <Stat label="Rejetés" value={data.documents.rejected} />
            <Stat
              label="Illisibles"
              value={data.documents.unreadable}
              tone="attention"
              hint="le scanner n'a rien lu"
              to="/admin/candidats"
            />
          </StatRow>

          <StatRow title="Stage quotidien">
            <Stat label="Actifs aujourd'hui" value={data.internship.active_candidates_today} />
            <Stat
              label="Faits aujourd'hui"
              value={`${data.internship.completed_today}/${data.internship.assigned_today}`}
            />
            <Stat label="En retard" value={data.internship.overdue} tone="attention" to="/admin/stage" />
            <Stat
              label="Inscrits"
              value={data.internship.candidates_with_assignments}
              hint="ont déjà reçu du travail"
            />
          </StatRow>

          <StatRow title="Support et croissance">
            <Stat
              label="Réclamations ouvertes"
              value={data.complaints.open}
              tone="attention"
              to="/admin/reclamations?status=open"
            />
            <Stat label="En cours" value={data.complaints.in_review} to="/admin/reclamations?status=in_review" />
            {/* Personne n'était joignable à leur arrivée — une erreur de
                configuration autrement complètement invisible. */}
            <Stat
              label="Non signalées"
              value={data.complaints.unannounced}
              tone="attention"
              hint="aucune alerte n'a atteint personne"
              to="/admin/reclamations"
            />
            <Stat label="Parrainés" value={data.growth.referred_registrations} />
            <Stat label="Utilisateurs" value={data.growth.users} />
          </StatRow>
        </div>
      )}
    </Card>
  )
}
