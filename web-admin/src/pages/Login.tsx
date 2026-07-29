import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Field, StepLedger, Notice, Badge, Wordmark } from '../components/ui'

export default function Login() {
  const { requestOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [debugCode, setDebugCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { debugCode } = await requestOtp(phone)
      setDebugCode(debugCode)
      setStep('code')
    } catch {
      setError('Could not send a code — check the phone number and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await verifyOtp(phone, code)
      navigate('/')
    } catch {
      setError('That code is invalid or has expired.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 'var(--sp-xl)', display: 'grid', gap: 'var(--sp-sm)', justifyItems: 'center' }}>
          <Wordmark />
          <p className="helper-text">Operator access for admins and recruiters</p>
        </div>

        <div className="card" style={{ padding: 'var(--sp-lg)' }}>
          <div style={{ marginBottom: 'var(--sp-lg)' }}>
            <StepLedger
              step={step === 'phone' ? 0 : 1}
              total={2}
              label={step === 'phone' ? 'Phone number' : 'Confirm code'}
            />
          </div>

          {step === 'phone' && (
            <form onSubmit={handleRequestOtp} style={{ display: 'grid', gap: 'var(--sp-md)' }}>
              <Field
                label="Phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212600000001"
                autoFocus
                required
              />
              <Button type="submit" disabled={!phone || busy}>
                {busy ? 'Sending…' : 'Send code'}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: 'var(--sp-md)' }}>
              {debugCode && <Badge>DEV OTP · {debugCode}</Badge>}
              <Field
                label="Verification code"
                hint={`Sent to ${phone}`}
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                autoFocus
                required
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.3em', textAlign: 'center' }}
              />
              <Button type="submit" disabled={code.length !== 6 || busy}>
                {busy ? 'Verifying…' : 'Verify & sign in'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep('phone')}>
                Use a different number
              </Button>
            </form>
          )}

          {error && (
            <div style={{ marginTop: 'var(--sp-md)' }}>
              <Notice>{error}</Notice>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
