'use client';

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/opsApi'
import { apiErrorMessage } from '@/lib/apiError'
import { Pagination } from '@/components/Pagination'
import { Card, Button, Badge, SectionHeader, Eyebrow, Notice } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import type { PaginatedResponse } from '@/types/candidate'

type Earnings = {
  currency: string
  registrations: number
  counts: Record<'pending' | 'qualified' | 'approved' | 'paid' | 'rejected', number>
  owed: number
  paid: number
  lifetime: number
}

type AgentInfo = {
  qr_code_token: string
  registrations_count: number
  commission_rate: number
  /** Set while a rotated-away token is still attributing registrations. */
  previous_token_active_until: string | null
  grace_days: number
  earnings: Earnings
}

type ReferralRow = {
  id: number
  candidate_name: string | null
  profession: string | null
  registered_at: string
  commission_status: 'pending' | 'qualified' | 'approved' | 'paid' | 'rejected'
  commission_amount: string | number | null
  commission_currency: string | null
}

// Un lien web, pas un schéma d'app : l'appareil photo natif d'un téléphone
// n'ouvre jamais un lien recruitment://, mais suit toujours un https:// vers
// le navigateur, où /auth-phone lit `ref` et l'attribue au candidat.
const referralLink = (token: string) => `${window.location.origin}/auth-phone?ref=${token}`

const STATUS_COPY: Record<ReferralRow['commission_status'], string> = {
  pending: 'en attente de leur dossier',
  qualified: 'acquise',
  approved: 'approuvée pour versement',
  paid: 'payée',
  rejected: 'non payable',
}

const currency = (amount: number, code: string) => `${amount.toFixed(2)} ${code}`

/** Les trois chiffres pour lesquels un agent ouvre cette page. */
function Earnings({ earnings }: { earnings: Earnings }) {
  const tiles = [
    { label: 'Dû', value: currency(earnings.owed, earnings.currency), accent: true },
    { label: 'Versé', value: currency(earnings.paid, earnings.currency), accent: false },
    { label: 'Inscriptions', value: String(earnings.registrations), accent: false },
  ]

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`grid gap-1 rounded-element border border-outline-variant p-4 ${
            tile.accent ? 'bg-primary/[0.06]' : 'bg-transparent'
          }`}
        >
          <Eyebrow>{tile.label}</Eyebrow>
          <span className="font-mono text-lg tabular-nums text-on-surface">{tile.value}</span>
        </div>
      ))}
    </div>
  )
}

function ReferralList() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['referral-registrations', page],
    queryFn: () =>
      api
        .get('/referrals/agent/registrations', { params: { page } })
        .then((r) => r.data as PaginatedResponse<ReferralRow>),
  })

  return (
    <Card>
      <SectionHeader
        eyebrow="Vos parrainages"
        title="Qui vous avez amené"
        subtitle="Un parrainage est acquis dès que le candidat soumet son dossier complété."
      />

      {isLoading && <p className="helper-text">Chargement…</p>}
      {data && data.data.length === 0 && (
        <p className="helper-text">Personne ne s&apos;est encore inscrit avec votre code.</p>
      )}

      <div className="grid gap-2">
        {data?.data.map((row) => (
          <div key={row.id} className="flex flex-wrap items-center gap-2 border-t border-outline-variant pt-2">
            <div className="grid min-w-[160px] flex-1 gap-0.5">
              <span className="text-sm text-on-surface">
                {row.candidate_name ?? 'Inscrit, nom non renseigné'}
              </span>
              <span className="helper-text">
                {row.profession ?? 'Métier non renseigné'} ·{' '}
                {new Date(row.registered_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <Badge tone={row.commission_status === 'paid' ? 'done' : 'pending'}>
              {STATUS_COPY[row.commission_status]}
            </Badge>
            <span className="font-mono text-[13px] tabular-nums text-on-surface">
              {row.commission_amount == null
                ? '—'
                : `${Number(row.commission_amount).toFixed(2)} ${row.commission_currency ?? ''}`.trim()}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Pagination page={page} data={data} onPage={setPage} noun="parrainage" />
      </div>
    </Card>
  )
}

export function AgentReferrals() {
  const queryClient = useQueryClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [confirmingRotate, setConfirmingRotate] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data } = useQuery({
    queryKey: ['referral-agent'],
    queryFn: () => api.get('/referrals/agent').then((r) => r.data as AgentInfo),
  })

  const rotateMutation = useMutation({
    mutationFn: () => api.post('/referrals/agent/rotate'),
    onSuccess: () => {
      setConfirmingRotate(false)
      queryClient.invalidateQueries({ queryKey: ['referral-agent'] })
    },
  })

  useEffect(() => {
    if (data && canvasRef.current) {
      // De l'encre plutôt que du vert : ce code est imprimé puis scanné dans
      // la lumière où se trouve l'agent — le contraste l'emporte sur la teinte.
      // La valeur est lue sur la variable CSS que le plugin Tailwind pose
      // depuis packages/design-tokens, pour ne pas recopier un token ici.
      const ink =
        getComputedStyle(document.documentElement).getPropertyValue('--on-surface').trim() || '#191C1D'

      QRCode.toCanvas(canvasRef.current, referralLink(data.qr_code_token), {
        width: 240,
        margin: 1,
        color: { dark: ink, light: '#ffffff' },
      })
    }
  }, [data])

  /** Un fichier que l'agent peut confier à un imprimeur, pas une capture d'écran. */
  function downloadPng() {
    if (!canvasRef.current || !data) return
    const link = document.createElement('a')
    link.href = canvasRef.current.toDataURL('image/png')
    link.download = `qr-parrainage-${data.qr_code_token.slice(0, 8)}.png`
    link.click()
  }

  async function copyLink() {
    if (!data) return
    await navigator.clipboard.writeText(referralLink(data.qr_code_token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto grid max-w-[880px] gap-6">
      <header>
        <p className="eyebrow eyebrow-accent">Acquisition candidats</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface">Parrainages et commissions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
          Partagez votre QR code, suivez les inscriptions attribuées et consultez les montants acquis.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start">
        <Card>
          <SectionHeader
            eyebrow="Parrainage"
            title="Votre QR code de recrutement"
            subtitle="Les candidats qui le scannent vous sont attribués, et vous gagnez dès qu'ils soumettent un dossier complété."
          />
          <canvas ref={canvasRef} className="mx-auto block max-w-full" />

          {data && (
            <div className="mt-4 grid justify-items-center gap-1">
              <Eyebrow>Jeton</Eyebrow>
              <p className="font-mono text-xs text-on-surface-variant">{data.qr_code_token}</p>
              <span className="helper-text">
                {currency(data.commission_rate, data.earnings.currency)} par parrainage acquis
              </span>
            </div>
          )}

          <div className="no-print mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="ghost" size="compact" onClick={downloadPng}>
              Télécharger en PNG
            </Button>
            <Button variant="ghost" size="compact" onClick={() => window.print()}>
              Imprimer
            </Button>
            <Button variant="ghost" size="compact" onClick={copyLink}>
              {copied ? 'Lien copié' : 'Copier le lien'}
            </Button>
          </div>

          {data?.previous_token_active_until && (
            <div className="mt-4">
              <Notice tone="pending">
                Votre code précédent fonctionne encore jusqu&apos;au{' '}
                {new Date(data.previous_token_active_until).toLocaleDateString('fr-FR')} : ce qui est déjà
                imprimé continue donc de compter jusque-là.
              </Notice>
            </div>
          )}
        </Card>

        {data && (
          <Card>
            <SectionHeader eyebrow="Gains" title="Ce que vous avez gagné" />
            <Earnings earnings={data.earnings} />
          </Card>
        )}
      </div>

      <ReferralList />

      {/* La rotation tuait silencieusement chaque QR code qu'un agent avait déjà
          distribué. C'est désormais une décision, dont la conséquence est dite. */}
      {confirmingRotate ? (
        <Card>
          <div className="grid gap-4">
            <SectionHeader eyebrow="Attention" title="Générer un nouveau code ?" />
            <p className="text-sm text-on-surface">
              Votre code actuel cesse immédiatement d&apos;être distribué. Les codes déjà imprimés ou
              affichés continuent de fonctionner pendant{' '}
              <strong>{data?.grace_days ?? 30} jours</strong>, puis cessent de vous attribuer les
              inscriptions.
            </p>
            <p className="helper-text">À faire si votre code a été copié ou détourné.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => rotateMutation.mutate()} disabled={rotateMutation.isPending}>
                {rotateMutation.isPending ? 'Génération…' : 'Oui, générer un nouveau code'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmingRotate(false)}
                disabled={rotateMutation.isPending}
              >
                Annuler
              </Button>
            </div>
            {rotateMutation.error && (
              <Notice>{apiErrorMessage(rotateMutation.error, "Cela n'a pas fonctionné. Réessayez.")}</Notice>
            )}
          </div>
        </Card>
      ) : (
        <Button variant="ghost" className="no-print" onClick={() => setConfirmingRotate(true)}>
          Générer un nouveau code
        </Button>
      )}
    </div>
  )
}

export default function AgentDashboard() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['referral-agent'],
    queryFn: () => api.get('/referrals/agent').then((response) => response.data as AgentInfo),
  })
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Agent'

  return (
    <div className="mx-auto grid max-w-[1200px] gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow eyebrow-accent">Tableau de bord</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface">Bonjour {firstName} 👋</h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Voici l’essentiel de votre activité commerciale.
          </p>
        </div>
        <Link
          href="/agent/parrainages"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-element bg-primary px-4 text-sm font-semibold text-onPrimary transition-colors hover:bg-primary-dark"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">qr_code_2</span>
          Afficher mon QR code
        </Link>
      </header>

      {isError && <Notice>Impossible de charger votre activité. Rechargez la page pour réessayer.</Notice>}

      <section aria-labelledby="agent-summary-title">
        <h2 id="agent-summary-title" className="sr-only">Résumé de l’activité</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Inscriptions',
              value: isLoading ? '…' : String(data?.earnings.registrations ?? 0),
              helper: 'candidats attribués',
              icon: 'person_add',
            },
            {
              label: 'Commissions dues',
              value: isLoading || !data ? '…' : currency(data.earnings.owed, data.earnings.currency),
              helper: 'à recevoir',
              icon: 'payments',
            },
            {
              label: 'Commissions versées',
              value: isLoading || !data ? '…' : currency(data.earnings.paid, data.earnings.currency),
              helper: 'déjà réglées',
              icon: 'account_balance_wallet',
            },
            {
              label: 'Dossiers acquis',
              value: isLoading ? '…' : String(data?.earnings.counts.qualified ?? 0),
              helper: 'profils complétés',
              icon: 'verified',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-card border border-outline-variant bg-surface-lowest p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{item.label}</p>
                  <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-on-surface">{item.value}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{item.helper}</p>
                </div>
                <span className="material-symbols-outlined rounded-lg bg-primary-light p-2 text-primary-dark" aria-hidden="true">
                  {item.icon}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Accès rapides">
        <Link
          href="/agent/parrainages"
          className="group rounded-card border border-outline-variant bg-surface-lowest p-6 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow tone="accent">Parrainages</Eyebrow>
              <h2 className="mt-2 text-xl font-semibold text-on-surface">QR code et suivi des candidats</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Téléchargez votre QR, copiez le lien et vérifiez le statut de chaque commission.
              </p>
            </div>
            <span className="material-symbols-outlined text-primary transition-transform group-hover:translate-x-1" aria-hidden="true">
              arrow_forward
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone="done">{data?.earnings.counts.paid ?? 0} payée(s)</Badge>
            <Badge tone="pending">{data?.earnings.counts.pending ?? 0} en attente</Badge>
          </div>
        </Link>

        <Link
          href="/agent/centres"
          className="group rounded-card border border-outline-variant bg-surface-lowest p-6 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow tone="accent">Prospection</Eyebrow>
              <h2 className="mt-2 text-xl font-semibold text-on-surface">Centres et entreprises</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Centralisez les appels, les statuts d’offre et les notes partagées avec l’équipe.
              </p>
            </div>
            <span className="material-symbols-outlined text-primary transition-transform group-hover:translate-x-1" aria-hidden="true">
              arrow_forward
            </span>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">sync</span>
            Données partagées avec l’administration
          </div>
        </Link>
      </section>
    </div>
  )
}
