'use client';

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/opsApi'
import { apiErrorMessage } from '@/lib/apiError'
import { Badge, Button, Card, Field, Notice, SectionHeader, SelectField } from '@/components/ui'
import { Pagination } from '@/components/Pagination'
import type { PaginatedResponse } from '@/types/candidate'

type CommissionStatus = 'pending' | 'qualified' | 'approved' | 'paid' | 'rejected'

type PayoutRow = {
  id: number
  agent: string | null
  candidate: string | null
  candidate_submitted: boolean
  registered_at: string
  commission_status: CommissionStatus
  commission_amount: string | number | null
  commission_currency: string | null
  qualified_at: string | null
  paid_at: string | null
  payout_reference: string | null
}

const STATUS_TONE: Record<CommissionStatus, 'pending' | 'done' | 'error'> = {
  pending: 'pending',
  qualified: 'pending',
  approved: 'pending',
  paid: 'done',
  rejected: 'error',
}

const STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: 'en attente',
  qualified: 'acquise',
  approved: 'approuvée',
  paid: 'payée',
  rejected: 'rejetée',
}

const money = (row: PayoutRow) =>
  row.commission_amount == null ? '—' : `${Number(row.commission_amount).toFixed(2)} ${row.commission_currency ?? ''}`.trim()

/**
 * La file des versements.
 *
 * Une commission s'acquiert d'elle-même lorsqu'un candidat parrainé soumet son
 * dossier ; l'approuver et la payer est la décision d'une personne, faute de
 * circuit de paiement ici pour en faire autre chose. Le champ de référence est
 * ce qui rend un litige traçable plus tard jusqu'à un virement ou un reçu.
 */
export function ReferralPayouts() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'' | CommissionStatus>('')
  const [page, setPage] = useState(1)
  const [reference, setReference] = useState<Record<number, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['admin-referrals', status, page],
    queryFn: () =>
      api
        .get('/admin/referrals', { params: { page, ...(status ? { status } : {}) } })
        .then((r) => r.data as PaginatedResponse<PayoutRow>),
  })

  const resolve = useMutation({
    mutationFn: (payload: { id: number; commission_status: CommissionStatus; payout_reference?: string }) =>
      api.patch(`/admin/referrals/${payload.id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-referrals'] }),
  })

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          eyebrow="Parrainage"
          title="Versement des commissions"
          subtitle="Un parrainage s'acquiert quand le candidat soumet son dossier. L'approbation et le paiement sont manuels."
        />
        <div className="min-w-[180px]">
          <SelectField
            label="Statut"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as '' | CommissionStatus)
              setPage(1)
            }}
          >
            <option value="">Toutes</option>
            <option value="pending">En attente (non soumis)</option>
            <option value="qualified">Acquises — dues</option>
            <option value="approved">Approuvées</option>
            <option value="paid">Payées</option>
            <option value="rejected">Rejetées</option>
          </SelectField>
        </div>
      </div>

      {isLoading && <p className="helper-text">Chargement…</p>}
      {data && data.data.length === 0 && <p className="helper-text">Rien ici.</p>}

      <div className="grid gap-2">
        {data?.data.map((row) => (
          <div key={row.id} className="grid gap-2 border-t border-outline-variant pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[row.commission_status]}>{STATUS_LABELS[row.commission_status]}</Badge>
              <span className="text-sm text-on-surface">
                {row.agent ?? 'Agent inconnu'} → {row.candidate ?? 'Candidat sans nom'}
              </span>
              <span className="ml-auto font-mono text-[13px] tabular-nums text-on-surface">{money(row)}</span>
            </div>

            <span className="helper-text">
              Inscrit le {new Date(row.registered_at).toLocaleDateString('fr-FR')}
              {row.qualified_at ? ` · acquise le ${new Date(row.qualified_at).toLocaleDateString('fr-FR')}` : ''}
              {row.paid_at ? ` · payée le ${new Date(row.paid_at).toLocaleDateString('fr-FR')}` : ''}
              {row.payout_reference ? ` · réf. ${row.payout_reference}` : ''}
            </span>

            {/* Rien sur quoi agir tant que le candidat n'a pas réellement soumis. */}
            {(row.commission_status === 'qualified' || row.commission_status === 'approved') && (
              <div className="flex flex-wrap items-end gap-2">
                {row.commission_status === 'qualified' && (
                  <Button
                    size="compact"
                    onClick={() => resolve.mutate({ id: row.id, commission_status: 'approved' })}
                    disabled={resolve.isPending}
                  >
                    Approuver
                  </Button>
                )}
                <div className="min-w-[200px]">
                  <Field
                    label="Référence de versement"
                    placeholder="Numéro de virement ou de reçu"
                    value={reference[row.id] ?? ''}
                    onChange={(e) => setReference({ ...reference, [row.id]: e.target.value })}
                  />
                </div>
                <Button
                  size="compact"
                  onClick={() =>
                    resolve.mutate({
                      id: row.id,
                      commission_status: 'paid',
                      payout_reference: reference[row.id] || undefined,
                    })
                  }
                  disabled={resolve.isPending}
                >
                  Marquer payée
                </Button>
                <Button
                  variant="ghost"
                  size="compact"
                  onClick={() => resolve.mutate({ id: row.id, commission_status: 'rejected' })}
                  disabled={resolve.isPending}
                >
                  Rejeter
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Pagination page={page} data={data} onPage={setPage} noun="parrainage" />
      </div>

      {resolve.error && <Notice>{apiErrorMessage(resolve.error, "L'enregistrement a échoué.")}</Notice>}
    </Card>
  )
}
