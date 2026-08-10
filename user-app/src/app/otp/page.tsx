'use client';

// Interface 4 — Vérification OTP : saisie automatique 6 chiffres, validation déclenche la navigation.

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useLanguage } from '@/context/LanguageContext';

const RESEND_SECONDS = 45;

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';
  const { verifyOtp, requestOtp } = useAuth();
  const { getIncompleteStep } = useProfile();
  const { t } = useLanguage();

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [shake, setShake] = useState(false);
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
    const success = await verifyOtp(code);
    setIsVerifying(false);
    if (!success) {
      setError(t('otp_error_invalid'));
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setDigits(Array(6).fill(''));
      inputsRef.current[0]?.focus();
      return;
    }
    const incompleteStep = getIncompleteStep();
    router.replace(incompleteStep ? `/profile-creation?step=${incompleteStep}` : '/dashboard');
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    requestOtp(phone);
    setSecondsLeft(RESEND_SECONDS);
    setDigits(Array(6).fill(''));
    inputsRef.current[0]?.focus();
  };

  return (
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
                className={`h-12 w-11 rounded-pillar border border-outline-variant bg-surface-container-lowest text-center text-xl font-extrabold text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 shadow-sm ${
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
            <button
              type="button"
              onClick={handleResend}
              disabled={secondsLeft > 0}
              className={`text-sm font-semibold transition-all ${
                secondsLeft > 0 ? 'cursor-not-allowed text-outline opacity-60' : 'text-primary hover:underline cursor-pointer'
              }`}
            >
              {t('otp_resend_cta')}
            </button>
          </div>

          {isVerifying && <p className="text-center text-xs font-medium text-primary animate-pulse">{t('otp_verifying')}</p>}
          {error && <p className="text-center text-xs font-semibold text-error">{error}</p>}

          <button
            type="submit"
            onClick={() => submitCode(digits.join(''))}
            disabled={isVerifying || digits.some((d) => !d)}
            className="w-full max-w-[340px] rounded-pillar bg-primary py-4 text-sm font-bold text-onPrimary shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
          >
            {isVerifying ? t('loading') : t('otp_verify_cta')}
          </button>
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
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpContent />
    </Suspense>
  );
}

