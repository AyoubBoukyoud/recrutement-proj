'use client';

// Interface 4 — Vérification OTP : saisie automatique 6 chiffres, validation déclenche la navigation.

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { otpFailureMessage } from '@/lib/authMessages';
import { useProfile } from '@/context/ProfileContext';
import { useLanguage } from '@/context/LanguageContext';
import { destinationForRole } from '@/lib/roleDestination';
import { Button } from '@/components/shared/Button';
import { AuthShell } from '@/components/AuthShell';

const RESEND_SECONDS = 45;

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';
  const intent = searchParams.get('intent') === 'recruiter' ? 'recruiter' : 'job_seeker';
  const initialDebugCode = searchParams.get('debug_code');
  const { verifyOtp, requestOtp, resendAvailableIn } = useAuth();
  const { getIncompleteStep } = useProfile();
  const { t } = useLanguage();

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(resendAvailableIn ?? RESEND_SECONDS);
  const [debugCode, setDebugCode] = useState<string | null>(initialDebugCode);
  const [shake, setShake] = useState(false);
  // Rempli uniquement quand quelqu'un a choisi « Je recrute » mais que le
  // compte, une fois vérifié, s'avère être un simple candidat : la connexion
  // a réussi, seule la redirection est mise en pause le temps de prévenir.
  const [pendingDestination, setPendingDestination] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== '')) {
      submitCode(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const submitCode = async (code: string) => {
    setError(null);
    setIsVerifying(true);
    const result = await verifyOtp(code, phone || undefined);
    setIsVerifying(false);
    if (!result.ok) {
      setError(otpFailureMessage(result, t));
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setDigits(Array(6).fill(''));
      inputsRef.current[0]?.focus();
      return;
    }

    const destination = destinationForRole(result.role, getIncompleteStep());

    // Le rôle réel décide toujours de la destination — « Je recrute » n'est
    // qu'une intention. Si le compte n'a pas d'accès recruteur, la connexion
    // reste valide (candidat) mais on le dit avant de rediriger.
    if (intent === 'recruiter' && result.role === 'candidate') {
      setPendingDestination(destination);
      return;
    }

    router.replace(destination);
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    const result = await requestOtp(phone);
    setIsResending(false);

    if (!result.ok) {
      setError(otpFailureMessage(result, t));
      // Un refus pour cause de quota porte son propre délai ; toute autre
      // erreur laisse le bouton disponible pour réessayer tout de suite.
      if (result.retryAfter) setSecondsLeft(result.retryAfter);
      return;
    }

    setSecondsLeft(result.resendAvailableIn);
    setDebugCode(result.debugCode);
    setDigits(Array(6).fill(''));
    inputsRef.current[0]?.focus();
  };

  if (pendingDestination) {
    return (
      <AuthShell>
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-surface px-6 py-10 text-center shadow-subtle">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low text-primary shadow-subtle">
          <span className="material-symbols-outlined" style={{ fontSize: 44 }}>
            info
          </span>
        </div>
        <h2 className="mb-2 text-2xl font-extrabold text-onSurface">{t('recruiter_access_pending_title')}</h2>
        <p className="mx-auto mb-8 max-w-[320px] text-sm leading-relaxed text-onSurface-variant">
          {t('recruiter_access_pending_body')}
        </p>
        <Button
          size="lg"
          onClick={() => router.replace(pendingDestination)}
          className="w-full max-w-[340px] shadow-sm"
        >
          {t('recruiter_access_pending_cta')}
        </Button>
      </main>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-subtle">
      <header className="sticky top-0 z-10 border-b border-surface-container-high bg-surface px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/auth-phone"
            aria-label="Retour"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>
              arrow_back
            </span>
          </Link>
          <h1 className="text-lg font-extrabold text-primary">{t('otp_screen_label')}</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="fade-in-entry opacity-0 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low text-primary shadow-subtle">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 44 }}>
            mark_email_read
          </span>
        </div>

        <div className="fade-in-entry opacity-0 text-center mb-8">
          <h2 className="text-2xl font-extrabold text-onSurface mb-2">{t('otp_title')}</h2>
          <p className="mx-auto max-w-[320px] text-sm leading-relaxed text-onSurface-variant">
            {t('otp_subtitle_prefix')} <span className="font-bold text-primary">{phone || '—'}</span>
          </p>
        </div>

        <form
          className="fade-in-entry stagger-1 opacity-0 flex w-full flex-col items-center gap-6"
          onSubmit={(e) => e.preventDefault()}
        >
          {debugCode && <p className="rounded-full bg-primary/10 px-4 py-2 font-mono text-sm font-bold text-primary">Code local : {debugCode}</p>}
          <div className={`flex items-center justify-center gap-2 ${shake ? 'animate-[shake_0.4s]' : ''}`}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={isVerifying}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`h-12 w-11 rounded-pillar border border-outline bg-surface-container-lowest text-center text-xl font-extrabold text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 shadow-sm ${
                  error ? 'border-error ring-2 ring-error/20' : ''
                }`}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center">
            {secondsLeft > 0 ? (
              <p className="text-xs font-medium text-outline">
                {t('otp_resend_countdown_prefix')} 0:{String(secondsLeft).padStart(2, '0')}
              </p>
            ) : null}
            <Button
              variant="link"
              onClick={handleResend}
              disabled={secondsLeft > 0 || isResending}
              className="font-semibold"
            >
              {t('otp_resend_cta')}
            </Button>
          </div>

          {isVerifying && <p className="text-center text-xs font-medium text-primary animate-pulse">{t('otp_verifying')}</p>}
          {error && <p className="text-center text-xs font-semibold text-error">{error}</p>}

          <Button
            type="submit"
            size="lg"
            onClick={() => submitCode(digits.join(''))}
            disabled={isVerifying || digits.some((d) => !d)}
            isLoading={isVerifying}
            loadingLabel={t('loading')}
            className="w-full max-w-[340px] shadow-sm"
          >
            {isVerifying ? t('loading') : t('otp_verify_cta')}
          </Button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </main>
    </AuthShell>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpContent />
    </Suspense>
  );
}
