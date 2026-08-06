'use client';

// Interface 3 — Authentification par téléphone : saisie du numéro, validation, puis /otp?phone=...

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const COUNTRY_CODES = [
  { code: '+212', label: '🇲🇦 +212' },
  { code: '+49', label: '🇩🇪 +49' },
];

export default function AuthPhonePage() {
  const router = useRouter();
  const { requestOtp } = useAuth();
  const { t } = useLanguage();
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) {
      setError(t('auth:phone.errorInvalid'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const fullPhone = `${countryCode}${digits}`;
    await new Promise((resolve) => setTimeout(resolve, 400));
    requestOtp(fullPhone);
    setIsSubmitting(false);
    router.push(`/otp?phone=${encodeURIComponent(fullPhone)}`);
  };

  return (
    <div className="min-h-screen md:bg-surface-low md:flex md:items-center md:justify-center md:p-6">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-surface shadow-subtle md:min-h-[auto] md:rounded-3xl md:shadow-lg md:overflow-hidden relative">
      <header className="relative flex flex-col items-center px-6 py-4 border-b border-surface-container-high">
        <Link href="/language" aria-label={t('common:actions.back')} className="absolute left-6 top-5 text-primary hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            arrow_back
          </span>
        </Link>
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-onPrimary shadow-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            smartphone
          </span>
        </div>
        <h1 className="text-sm font-extrabold text-primary">Amud Skills</h1>
        <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">{t('auth:phone.screenLabel')}</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex-1 px-6 pt-6"
      >
        <div className="fade-in-entry opacity-0">
          <h2 className="mb-2 text-2xl font-extrabold text-primary">{t('auth:phone.screenTitle')}</h2>
          <p className="mb-6 text-sm leading-relaxed text-onSurface-variant">{t('auth:phone.screenSubtitle')}</p>
        </div>

        <div className="fade-in-entry stagger-1 opacity-0 mb-2 space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-onSurface-variant">
            {t('auth:phone.fieldLabel')}
          </label>
          <div dir="ltr" className="flex items-center gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
              phone
            </span>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="border-none bg-transparent p-0 text-sm font-bold text-primary outline-none focus:ring-0 cursor-pointer"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="h-6 w-px bg-outline-variant" />
            <input
              type="tel"
              dir="ltr"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('auth:phone.placeholder')}
              className="flex-1 border-none bg-transparent p-0 text-sm font-semibold text-onSurface placeholder:text-outline outline-none focus:ring-0"
            />
          </div>
        </div>
        <p className="fade-in-entry stagger-1 opacity-0 mb-6 text-[11px] text-onSurface-variant">
          {t('auth:phone.fieldHint')}
        </p>

        {error && (
          <div className="fade-in-entry opacity-0 mb-4 flex items-center gap-2 rounded-pillar bg-error-container/40 p-3 text-xs font-medium text-error">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              error
            </span>
            {error}
          </div>
        )}

        <div className="fade-in-entry stagger-2 opacity-0 flex gap-3 rounded-pillar border border-primary/15 bg-surface-container-low p-4">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-primary" style={{ fontSize: 18 }}>
            verified_user
          </span>
          <p className="text-[11px] leading-normal text-primary font-medium">{t('auth:phone.consent')}</p>
        </div>
      </form>

      <footer className="fade-in-entry stagger-3 opacity-0 space-y-3 border-t border-outline-variant bg-surface-container-lowest p-6">
        <button
          type="submit"
          onClick={submit}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-pillar bg-primary py-4 text-sm font-bold text-onPrimary shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? t('auth:phone.sending') : t('auth:phone.submitCta')}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest py-3.5 text-sm font-semibold text-primary transition-all hover:bg-surface-container-low active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
            chat
          </span>
          {t('auth:phone.whatsappCta')}
        </button>
      </footer>
    </main>
    </div>
  );
}

