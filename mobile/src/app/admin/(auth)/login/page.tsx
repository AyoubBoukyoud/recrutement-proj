'use client';

// Authentification admin — accès au layout (admin).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const success = await loginAdmin(email, password);
    setIsSubmitting(false);
    if (!success) {
      setError(t('auth:adminLogin.errorInvalid'));
      return;
    }
    router.replace('/admin/utilisateurs');
  };

  return (
    <main className="relative flex min-h-screen flex-col justify-center bg-primary-dark p-6">
      <Link href="/language" aria-label={t('common:actions.back')} className="absolute left-6 top-6 text-white hover:opacity-80 transition-opacity">
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
          arrow_back
        </span>
      </Link>
      <div className="mx-auto w-full max-w-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold text-onGold shadow-floating">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>shield_person</span>
        </div>
        <h1 className="text-center text-2xl font-bold text-white">{t('auth:adminLogin.title')}</h1>
        <p className="mt-1.5 text-center text-sm text-primary-light">{t('auth:adminLogin.subtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-3xl bg-surface-lowest p-6 shadow-floating">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-onSurface-variant">
              {t('auth:adminLogin.identifierLabel')}
            </label>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm font-medium text-onSurface outline-none focus:border-primary"
              placeholder={t('auth:adminLogin.identifierPlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-onSurface-variant">
              {t('auth:adminLogin.passwordLabel')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm font-medium text-onSurface outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs font-medium text-error">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-onPrimary shadow-soft transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? t('auth:adminLogin.submitting') : t('auth:adminLogin.submitCta')}
          </button>
        </form>
      </div>
    </main>
  );
}
