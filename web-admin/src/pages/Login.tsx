import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../lib/apiError'
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
    } catch (e) {
      setError(apiErrorMessage(e, "Impossible d'envoyer un code — vérifiez le numéro et réessayez."))
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
    } catch (e) {
      setError(apiErrorMessage(e, 'Ce code est invalide ou a expiré.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-surface p-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 grid justify-items-center gap-2">
          <Wordmark />
          <p className="helper-text">Accès opérateur — administrateurs et recruteurs</p>
        </div>

        <div className="rounded-card border border-outline-variant bg-surface-lowest p-6">
          <div className="mb-6">
            <StepLedger
              step={step === 'phone' ? 0 : 1}
              total={2}
              label={step === 'phone' ? 'Numéro de téléphone' : 'Confirmer le code'}
            />
          </div>

          {step === 'phone' && (
            <form onSubmit={handleRequestOtp} className="grid gap-4">
              <Field
                label="Numéro de téléphone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212600000001"
                autoFocus
                required
              />
              <Button type="submit" disabled={!phone || busy}>
                {busy ? 'Envoi…' : 'Envoyer le code'}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyOtp} className="grid gap-4">
              {debugCode && <Badge>DEV OTP · {debugCode}</Badge>}
              <Field
                label="Code de vérification"
                hint={`Envoyé au ${phone}`}
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                autoFocus
                required
                className="text-center font-mono tracking-[0.3em]"
              />
              <Button type="submit" disabled={code.length !== 6 || busy}>
                {busy ? 'Vérification…' : 'Vérifier et se connecter'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep('phone')}>
                Utiliser un autre numéro
              </Button>
            </form>
          )}

          {error && (
            <div className="mt-4">
              <Notice>{error}</Notice>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
