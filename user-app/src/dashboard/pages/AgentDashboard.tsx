'use client';

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiErrorMessage } from '../lib/apiError'
import { TopBar } from '../components/TopBar'
import { Pagination } from '../components/Pagination'
import { Card, Button, Badge, SectionHeader, Eyebrow, Notice } from '../components/ui'
import type { PaginatedResponse } from '../types/candidate'

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

const deepLink = (token: string) => `recruitment://register?ref=${token}`

const STATUS_COPY: Record<ReferralRow['commission_status'], string> = {
  pending: 'waiting on their dossier',
  qualified: 'earned',
  approved: 'approved for payout',
  paid: 'paid',
  rejected: 'not payable',
}

const currency = (amount: number, code: string) => `${amount.toFixed(2)} ${code}`

/** The three numbers an agent opens this page for. */
function Earnings({ earnings }: { earnings: Earnings }) {
  const tiles = [
    { label: 'Owed to you', value: currency(earnings.owed, earnings.currency), accent: true },
    { label: 'Paid out', value: currency(earnings.paid, earnings.currency), accent: false },
    { label: 'Registrations', value: String(earnings.registrations), accent: false },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--sp-md)' }}>
      {tiles.map((tile) => (
        <div
          key={tile.label}
          style={{
            display: 'grid',
            gap: 4,
            padding: 'var(--sp-md)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            background: tile.accent ? 'var(--accent-soft)' : 'transparent',
          }}
        >
          <Eyebrow>{tile.label}</Eyebrow>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18 }}>{tile.value}</span>
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
        eyebrow="Your referrals"
        title="Who you brought in"
        subtitle="A referral is earned once the candidate submits their completed dossier."
      />

      {isLoading && <p className="helper-text">Loading…</p>}
      {data && data.data.length === 0 && (
        <p className="helper-text">Nobody has signed up with your code yet.</p>
      )}

      <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
        {data?.data.map((row) => (
          <div
            key={row.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-sm)',
              flexWrap: 'wrap',
              paddingTop: 'var(--sp-sm)',
              borderTop: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'grid', gap: 2, flex: 1, minWidth: 160 }}>
              <span style={{ fontSize: 14 }}>{row.candidate_name ?? 'Signed up, no name yet'}</span>
              <span className="helper-text">
                {row.profession ?? 'No profession set'} · {new Date(row.registered_at).toLocaleDateString()}
              </span>
            </div>
            <Badge tone={row.commission_status === 'paid' ? 'done' : 'pending'}>
              {STATUS_COPY[row.commission_status]}
            </Badge>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              {row.commission_amount == null
                ? '—'
                : `${Number(row.commission_amount).toFixed(2)} ${row.commission_currency ?? ''}`.trim()}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--sp-md)' }}>
        <Pagination page={page} data={data} onPage={setPage} />
      </div>
    </Card>
  )
}

export default function AgentDashboard() {
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
      QRCode.toCanvas(canvasRef.current, deepLink(data.qr_code_token), {
        width: 240,
        margin: 1,
        // Ink rather than seal green: this code gets printed and scanned in
        // whatever light the agent is standing in, so contrast wins over tint.
        color: { dark: '#141a17', light: '#ffffff' },
      })
    }
  }, [data])

  /** A file the agent can put in a print shop's hands, not a screenshot. */
  function downloadPng() {
    if (!canvasRef.current || !data) return
    const link = document.createElement('a')
    link.href = canvasRef.current.toDataURL('image/png')
    link.download = `referral-qr-${data.qr_code_token.slice(0, 8)}.png`
    link.click()
  }

  async function copyLink() {
    if (!data) return
    await navigator.clipboard.writeText(deepLink(data.qr_code_token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <TopBar title="Referral QR" />
      <main
        style={{
          maxWidth: 520,
          margin: '0 auto',
          padding: 'var(--sp-xl) var(--sp-lg)',
          display: 'grid',
          gap: 'var(--sp-lg)',
        }}
      >
        <Card>
          <SectionHeader
            eyebrow="Referral"
            title="Your recruitment QR code"
            subtitle="Candidates who scan this are attributed to you, and you earn once they submit a completed dossier."
          />
          <canvas ref={canvasRef} style={{ margin: '0 auto', display: 'block', maxWidth: '100%' }} />

          {data && (
            <div style={{ display: 'grid', gap: 'var(--sp-xs)', justifyItems: 'center', marginTop: 'var(--sp-md)' }}>
              <Eyebrow>Token</Eyebrow>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-muted)' }}>
                {data.qr_code_token}
              </p>
              <span className="helper-text">
                {currency(data.commission_rate, data.earnings.currency)} per qualifying referral
              </span>
            </div>
          )}

          <div
            className="no-print"
            style={{ display: 'flex', gap: 'var(--sp-sm)', justifyContent: 'center', marginTop: 'var(--sp-md)', flexWrap: 'wrap' }}
          >
            <Button variant="ghost" size="compact" onClick={downloadPng}>
              Download PNG
            </Button>
            <Button variant="ghost" size="compact" onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="ghost" size="compact" onClick={copyLink}>
              {copied ? 'Link copied' : 'Copy link'}
            </Button>
          </div>

          {data?.previous_token_active_until && (
            <div style={{ marginTop: 'var(--sp-md)' }}>
              <Notice tone="pending">
                Your previous code still works until{' '}
                {new Date(data.previous_token_active_until).toLocaleDateString()}, so anything already
                printed keeps counting until then.
              </Notice>
            </div>
          )}
        </Card>

        {data && (
          <Card>
            <SectionHeader eyebrow="Earnings" title="What you have earned" />
            <Earnings earnings={data.earnings} />
          </Card>
        )}

        <ReferralList />

        {/* Rotation used to silently kill every QR code an agent had already
            handed out. It is now a decision, with the consequence spelled out. */}
        {confirmingRotate ? (
          <Card style={{ display: 'grid', gap: 'var(--sp-md)' }}>
            <SectionHeader eyebrow="Careful" title="Generate a new code?" />
            <p style={{ fontSize: 14 }}>
              Your current code stops being handed out immediately. Codes you have already printed or
              posted keep working for{' '}
              <strong>{data?.grace_days ?? 30} more days</strong>, then stop attributing registrations
              to you.
            </p>
            <p className="helper-text">Do this if your code has been copied or misused.</p>
            <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
              <Button onClick={() => rotateMutation.mutate()} disabled={rotateMutation.isPending}>
                {rotateMutation.isPending ? 'Generating…' : 'Yes, generate a new code'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingRotate(false)} disabled={rotateMutation.isPending}>
                Cancel
              </Button>
            </div>
            {rotateMutation.error && (
              <Notice>{apiErrorMessage(rotateMutation.error, 'That did not work. Try again.')}</Notice>
            )}
          </Card>
        ) : (
          <Button variant="ghost" className="no-print" onClick={() => setConfirmingRotate(true)}>
            Generate a new code
          </Button>
        )}
      </main>
    </div>
  )
}
