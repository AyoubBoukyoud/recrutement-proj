'use client';

// Interface 17 — Connexion employeur.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function EmployerLoginPage() {
  const router = useRouter();
  const { loginEmployer } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const success = await loginEmployer(email, password);
    setIsSubmitting(false);
    if (!success) {
      setError(t('auth:employerLogin.errorInvalid'));
      return;
    }
    router.replace('/employer/dashboard');
  };

  return (
    <main className="flex min-h-screen flex-col justify-between bg-surface">
      <header className="sticky top-0 z-10 flex w-full flex-col items-center gap-2 bg-surface px-6 py-6">
        <Link href="/language" aria-label={t('common:actions.back')} className="absolute left-6 top-6 text-primary hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            arrow_back
          </span>
        </Link>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-onPrimary">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            language
          </span>
        </div>
        <p className="text-xs tracking-wide text-onSurface-variant">{t('auth:employerLogin.tagline')}</p>
      </header>

      <div className="flex flex-grow items-center justify-center px-6 py-8">
        <div className="w-full max-w-[480px] rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-[0px_4px_20px_rgba(27,94,55,0.06)]">
          <div className="mb-6 text-center">
            <h1 className="mb-1 text-[26px] font-bold text-primary">{t('auth:employerLogin.title')}</h1>
            <p className="text-sm text-onSurface-variant">{t('auth:employerLogin.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-primary">
                {t('auth:employerLogin.emailLabel')}
              </label>
              <div dir="ltr" className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2.5 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 20 }}>
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('auth:employerLogin.emailPlaceholder')}
                  className="w-full border-none bg-transparent p-0 text-sm outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-primary">
                {t('auth:employerLogin.passwordLabel')}
              </label>
              <div dir="ltr" className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2.5 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 20 }}>
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border-none bg-transparent p-0 text-sm outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-outline transition-colors hover:text-primary"
                  aria-label={showPassword ? t('auth:employerLogin.hidePassword') : t('auth:employerLogin.showPassword')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-error">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  error
                </span>
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-outline text-primary focus:ring-primary/20"
                />
                <span className="text-sm text-onSurface-variant">{t('auth:employerLogin.rememberMe')}</span>
              </label>
              <Link href="#" className="text-sm font-medium text-primary hover:underline">
                {t('auth:employerLogin.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-onPrimary shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? t('auth:employerLogin.submitting') : t('auth:employerLogin.submitCta')}
            </button>
          </form>

          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-outline-variant" />
            <span className="bg-surface-lowest px-3 text-xs font-semibold uppercase tracking-widest text-outline">
              {t('auth:employerLogin.or')}
            </span>
            <div className="flex-grow border-t border-outline-variant" />
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-outline-variant bg-surface-lowest py-2.5 text-sm font-medium text-onSurface transition-colors hover:bg-surface-low"
            >
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                account_circle
              </span>
              {t('auth:employerLogin.continueGoogle')}
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-outline-variant bg-surface-lowest py-2.5 text-sm font-medium text-onSurface transition-colors hover:bg-surface-low"
            >
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                window
              </span>
              {t('auth:employerLogin.continueMicrosoft')}
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-outline-variant bg-surface-lowest py-2.5 text-sm font-medium text-onSurface transition-colors hover:bg-surface-low"
            >
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                work
              </span>
              {t('auth:employerLogin.continueLinkedin')}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-onSurface-variant">
              {t('auth:employerLogin.noAccount')}{' '}
              <Link href="#" className="font-semibold text-primary hover:underline">
                {t('auth:employerLogin.requestAccess')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="w-full border-t border-outline-variant bg-surface-lowest px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
          <span className="text-xs text-onSurface-variant">{t('auth:employerLogin.footerCopyright')}</span>
          <div className="flex gap-4">
            <Link href="#" className="text-xs text-onSurface-variant hover:text-gold-dark">
              {t('auth:employerLogin.legalMentions')}
            </Link>
            <Link href="#" className="text-xs text-onSurface-variant hover:text-gold-dark">
              {t('auth:employerLogin.privacy')}
            </Link>
            <Link href="/auth-phone" className="text-xs font-semibold text-primary hover:underline">
              {t('auth:employerLogin.candidateSpace')}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
