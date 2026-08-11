import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiErrorMessage } from '../lib/apiError'
import { Badge, Button, Card, Field, Notice, SectionHeader, SelectField } from './ui'
import { Pagination } from './Pagination'
import type { PaginatedResponse } from '../types/candidate'

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

const STATUS_TONE: Record<CommissionStatus, 'pending' | 'done'> = {
  pending: 'pending',
  qualified: 'pending',
  approved: 'pending',
  paid: 'done',
  rejected: 'pending',
}

const money = (row: PayoutRow) =>
  row.commission_amount == null ? '—' : `${Number(row.commission_amount).toFixed(2)} ${row.commission_currency ?? ''}`.trim()

/**
 * The payout queue.
 *
 * Commissions qualify by themselves when a referred candidate submits their
 * dossier; approving and paying one is a person's decision, because there is
 * no payment rail here to make it anything else. The reference field is what
 * makes a dispute traceable to a bank transfer or a cash receipt later.
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 'var(--sp-md)', flexWrap: 'wrap' }}>
        <SectionHeader
          eyebrow="Referrals"
          title="Commission payouts"
          subtitle="A referral qualifies when the candidate submits their dossier. Approving and paying is manual."
        />
        <div style={{ minWidth: 180 }}>
          <SelectField
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as '' | CommissionStatus)
              setPage(1)
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending (not submitted)</option>
            <option value="qualified">Qualified — owed</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </SelectField>
        </div>
      </div>

      {isLoading && <p className="helper-text">Loading…</p>}
      {data && data.data.length === 0 && <p className="helper-text">Nothing here.</p>}

      <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
        {data?.data.map((row) => (
          <div
            key={row.id}
            style={{
              display: 'grid',
              gap: 'var(--sp-sm)',
              paddingTop: 'var(--sp-sm)',
              borderTop: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
              <Badge tone={STATUS_TONE[row.commission_status]}>{row.commission_status}</Badge>
              <span style={{ fontSize: 14 }}>
                {row.agent ?? 'Unknown agent'} → {row.candidate ?? 'Unnamed candidate'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, marginLeft: 'auto' }}>{money(row)}</span>
            </div>

            <span className="helper-text">
              Registered {new Date(row.registered_at).toLocaleDateString()}
              {row.qualified_at ? ` · qualified ${new Date(row.qualified_at).toLocaleDateString()}` : ''}
              {row.paid_at ? ` · paid ${new Date(row.paid_at).toLocaleDateString()}` : ''}
              {row.payout_reference ? ` · ref ${row.payout_reference}` : ''}
            </span>

            {/* Nothing to act on until the candidate has actually submitted. */}
            {(row.commission_status === 'qualified' || row.commission_status === 'approved') && (
              <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'end', flexWrap: 'wrap' }}>
                {row.commission_status === 'qualified' && (
                  <Button
                    size="compact"
                    onClick={() => resolve.mutate({ id: row.id, commission_status: 'approved' })}
                    disabled={resolve.isPending}
                  >
                    Approve
                  </Button>
                )}
                <div style={{ minWidth: 200 }}>
                  <Field
                    label="Payout reference"
                    placeholder="Transfer or receipt number"
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
                  Mark paid
                </Button>
                <Button
                  variant="ghost"
                  size="compact"
                  onClick={() => resolve.mutate({ id: row.id, commission_status: 'rejected' })}
                  disabled={resolve.isPending}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--sp-md)' }}>
        <Pagination page={page} data={data} onPage={setPage} />
      </div>

      {resolve.error && <Notice>{apiErrorMessage(resolve.error, 'That did not save.')}</Notice>}
    </Card>
  )
}
