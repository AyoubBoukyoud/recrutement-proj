import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { TopBar } from '../components/TopBar'
import { Card, Button, Badge, SectionHeader, Eyebrow } from '../components/ui'

type AgentInfo = { qr_code_token: string; registrations_count: number }

const deepLink = (token: string) => `recruitment://register?ref=${token}`

export default function AgentDashboard() {
  const queryClient = useQueryClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { data } = useQuery({
    queryKey: ['referral-agent'],
    queryFn: () => api.get('/referrals/agent').then((r) => r.data as AgentInfo),
  })

  const rotateMutation = useMutation({
    mutationFn: () => api.post('/referrals/agent/rotate'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referral-agent'] }),
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

  return (
    <div>
      <TopBar title="Referral QR" />
      <main
        style={{
          maxWidth: 480,
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
            subtitle="Candidates who scan this are automatically attributed to you for commission tracking."
          />
          <canvas ref={canvasRef} style={{ margin: '0 auto', display: 'block', maxWidth: '100%' }} />
          {data && (
            <div style={{ display: 'grid', gap: 'var(--sp-xs)', justifyItems: 'center', marginTop: 'var(--sp-md)' }}>
              <Eyebrow>Token</Eyebrow>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-muted)' }}>
                {data.qr_code_token}
              </p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--sp-md)' }}>
            <Badge tone={data && data.registrations_count > 0 ? 'done' : 'pending'}>
              {data
                ? `${data.registrations_count} registration${data.registrations_count === 1 ? '' : 's'}`
                : '—'}
            </Badge>
          </div>
        </Card>

        <Button variant="ghost" onClick={() => rotateMutation.mutate()} disabled={rotateMutation.isPending}>
          Generate a new code
        </Button>
      </main>
    </div>
  )
}
