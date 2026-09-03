'use client';

// Interface 3 — Authentification par téléphone : saisie du numéro, validation, puis /otp?phone=...

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { otpFailureMessage } from '@/lib/authMessages';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/shared/Button';
import { AuthShell } from '@/components/AuthShell';
import { toInternationalPhone } from '@/lib/phoneNumber';

/**
 * Les raccourcis sont opt-in, même sous `next dev`. Cela permet de lancer une
 * démonstration avec le serveur de développement sans exposer comptes, codes
 * locaux ou catalogue de routes. La production ne doit jamais activer ce
 * drapeau.
 */
const DevAuthTools = process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === '1'
  ? dynamic(() => import('./DevAuthTools').then((module) => module.DevAuthTools), { ssr: false })
  : null;

const COUNTRY_CODES = [
  { code: '+212', label: '🇲🇦 +212' },
  { code: '+49', label: '🇩🇪 +49' },
];

/**
 * Connexion candidat ou recruteur/staff : même téléphone, même code — le rôle
 * qui décide de la destination vient toujours du back, jamais de ce choix.
 * `intent` n'est qu'une intention affichée et transmise à /otp, qui prévient
 * l'appelant si le numéro n'a en réalité pas d'accès recruteur.
 */
type Intent = 'job_seeker' | 'recruiter';

export default function AuthPhonePage() {
  const router = useRouter();
  const { requestOtp } = useAuth();
  const { t } = useLanguage();
  const [intent, setIntent] = useState<Intent>('job_seeker');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('intent') === 'recruiter') setIntent('recruiter');
    setSessionExpired(query.get('reason') === 'session_expired');
  }, []);

  const submit = async () => {
    const fullPhone = toInternationalPhone(phone, countryCode);
    if (!/^\+[1-9]\d{7,14}$/.test(fullPhone)) {
      setError(t('phone_error_invalid'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await requestOtp(fullPhone);
    setIsSubmitting(false);

    // On ne navigue que si le code est réellement parti : envoyer le candidat
    // attendre un message qui n'arrivera jamais serait pire qu'une erreur ici.
    if (!result.ok) {
      setError(otpFailureMessage(result, t));
      return;
    }

    const query = new URLSearchParams({ phone: fullPhone, intent });
    if (result.debugCode) query.set('debug_code', result.debugCode);
    router.push(`/otp?${query.toString()}`);
  };

  return (
    <AuthShell>
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-subtle outline-none">
      <header className="relative flex flex-col items-center px-6 py-4 border-b border-surface-container-high">
        <Link href="/language" aria-label="Retour" className="absolute left-6 top-5 text-primary hover:opacity-80 transition-opacity">
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
        <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">{t('auth_screen_label')}</p>
      </header>

      <form
        id="auth-phone-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex-1 px-6 pt-6"
      >
        {sessionExpired && (
          <div role="status" className="mb-4 flex items-start gap-2 rounded-pillar border border-gold/30 bg-gold/10 p-3 text-xs font-medium text-onSurface">
            <span className="material-symbols-outlined text-gold-dark" style={{ fontSize: 18 }}>schedule</span>
            {t('auth_session_expired')}
          </div>
        )}
        <div className="fade-in-entry opacity-0 mb-6 flex rounded-pillar border border-outline-variant bg-surface-container-lowest p-1">
          {(
            [
              ['job_seeker', t('auth_intent_job_seeker')],
              ['recruiter', t('auth_intent_recruiter')],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant={intent === value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setIntent(value)}
              aria-pressed={intent === value}
              className="flex-1"
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="fade-in-entry opacity-0">
          <h2 className="mb-2 text-2xl font-extrabold text-primary">
            {intent === 'recruiter' ? t('phone_screen_title_recruiter') : t('phone_screen_title')}
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-onSurface-variant">
            {intent === 'recruiter' ? t('phone_screen_subtitle_recruiter') : t('phone_screen_subtitle')}
          </p>
        </div>

        <div className="fade-in-entry stagger-1 opacity-0 mb-2 space-y-2">
          <label htmlFor="auth-phone-number" className="block text-[10px] font-bold uppercase tracking-widest text-onSurface-variant">
            {t('phone_field_label')}
          </label>
          <div className="flex items-center gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }} aria-hidden="true">
              phone
            </span>
            <select
              id="auth-phone-country"
              aria-label={t('phone_country_label')}
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
            <div className="h-6 w-px bg-outline-variant" aria-hidden="true" />
            <input
              id="auth-phone-number"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="6 12 34 56 78"
              className="flex-1 border-none bg-transparent p-0 text-sm font-semibold text-onSurface placeholder:text-outline outline-none focus:ring-0"
            />
          </div>
        </div>
        <p className="fade-in-entry stagger-1 opacity-0 mb-6 text-[11px] text-onSurface-variant">
          {t('phone_field_hint')}
        </p>

        {error && (
          <div role="alert" className="fade-in-entry opacity-0 mb-4 flex items-center gap-2 rounded-pillar bg-error-container/40 p-3 text-xs font-medium text-error">
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
              error
            </span>
            {error}
          </div>
        )}

        <div className="fade-in-entry stagger-2 opacity-0 flex gap-3 rounded-pillar border border-primary/15 bg-surface-container-low p-4">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-primary" style={{ fontSize: 18 }}>
            verified_user
          </span>
          <p className="text-[11px] leading-normal text-primary font-medium">{t('phone_consent')}</p>
        </div>
      </form>

      {DevAuthTools && <DevAuthTools />}

      <footer className="fade-in-entry stagger-3 opacity-0 space-y-3 border-t border-outline-variant bg-surface-container-lowest p-6">
        <Button
          type="submit"
          form="auth-phone-form"
          size="lg"
          fullWidth
          disabled={isSubmitting}
          isLoading={isSubmitting}
          loadingLabel={t('phone_sending')}
          className="shadow-sm"
        >
          {isSubmitting ? t('phone_sending') : t('phone_submit_cta')}
        </Button>
      </footer>
    </main>
    </AuthShell>
  );
}
