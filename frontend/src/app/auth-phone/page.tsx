'use client';

// Interface 3 — Authentification : choix de la méthode (Google ou numéro), puis
// pour le numéro saisie, validation, et /otp?phone=...

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { googleFailureMessage, otpFailureMessage } from '@/lib/authMessages';
import { useLanguage } from '@/context/LanguageContext';
import { Button, IconButton } from '@/components/shared/Button';
import { AuthShell } from '@/components/AuthShell';
import { toInternationalPhone } from '@/lib/phoneNumber';
import { useProfile } from '@/context/ProfileContext';
import { destinationForRole } from '@/lib/roleDestination';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { AuthBrandBanner } from '@/components/AuthBrandPanel';
import {
  GOOGLE_SIGN_IN_ENABLED,
  asGoogleFailure,
  clearPendingGoogleLink,
  readPendingGoogleLink,
  type PendingGoogleLink,
} from '@/lib/googleAuth';

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

/**
 * Google et le numéro sont deux portes d'entrée indépendantes : l'écran
 * s'ouvre sur ce choix, et le formulaire du numéro n'apparaît qu'une fois
 * cette méthode choisie. Les présenter ensemble laissait croire qu'il fallait
 * fournir les deux. Le formulaire est aussi une entrée d'historique
 * (`?method=phone`), pour que « Précédent » ramène au choix.
 */
type Method = 'choose' | 'phone';

function urlWithMethod(method: Method): string {
  const query = new URLSearchParams(window.location.search);
  if (method === 'phone') query.set('method', 'phone');
  else query.delete('method');
  const search = query.toString();
  return search ? `?${search}` : window.location.pathname;
}

export default function AuthPhonePage() {
  const router = useRouter();
  const { requestOtp, user, token, isLoading } = useAuth();
  const { getIncompleteStep } = useProfile();
  const { t } = useLanguage();
  const [intent, setIntent] = useState<Intent>('job_seeker');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [referralToken, setReferralToken] = useState<string | null>(null);
  // Compte Google vérifié, en attente du numéro qui lui sera rattaché.
  const [googleLink, setGoogleLink] = useState<PendingGoogleLink | null>(null);
  // Sans Google configuré, il n'y a rien à choisir : on va droit au numéro.
  const [method, setMethod] = useState<Method>(GOOGLE_SIGN_IN_ENABLED ? 'choose' : 'phone');
  // Le formulaire a été ouvert depuis le choix, dans cet écran : revenir au
  // choix, c'est alors reculer d'une entrée d'historique.
  const openedFromChooser = useRef(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  // Un rattachement Google en cours attend précisément un numéro.
  const canChoose = GOOGLE_SIGN_IN_ENABLED && !googleLink;
  // Le public se choisit avec la méthode ; le formulaire du numéro ne le
  // repropose que s'il est le seul écran (pas de choix de méthode).
  const showIntentSwitch = method === 'choose' || !canChoose;

  // Déjà connecté : l'écran de connexion n'a rien à offrir, sinon une seconde
  // session sur le même appareil. On renvoie vers l'espace du rôle.
  useEffect(() => {
    if (isLoading || !user || !token) return;
    router.replace(destinationForRole(user.role, getIncompleteStep()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, token]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('intent') === 'recruiter') setIntent('recruiter');
    setSessionExpired(query.get('reason') === 'session_expired');
    setReferralToken(query.get('ref'));

    // Retour d'un « Continuer avec Google » : échec à expliquer, ou compte
    // Google vérifié dont il reste à confirmer le numéro.
    const googleFailure = asGoogleFailure(query.get('google_error'));
    if (googleFailure) setError(googleFailureMessage(googleFailure, t));
    const pendingLink = query.get('google') === 'link' ? readPendingGoogleLink() : null;
    if (pendingLink) setGoogleLink(pendingLink);
    else clearPendingGoogleLink();
    if (pendingLink || query.get('method') === 'phone') setMethod('phone');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // « Précédent » / « Suivant » du navigateur entre le choix et le formulaire.
  useEffect(() => {
    if (!canChoose) return;
    const sync = () => {
      setError(null);
      setMethod(new URLSearchParams(window.location.search).get('method') === 'phone' ? 'phone' : 'choose');
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [canChoose]);

  useEffect(() => {
    if (method === 'phone' && openedFromChooser.current) phoneInputRef.current?.focus();
  }, [method]);

  const choosePhone = () => {
    setError(null);
    openedFromChooser.current = true;
    window.history.pushState(null, '', urlWithMethod('phone'));
    setMethod('phone');
  };

  const backToChooser = () => {
    setError(null);
    if (openedFromChooser.current) {
      openedFromChooser.current = false;
      window.history.back();
      return;
    }
    window.history.replaceState(null, '', urlWithMethod('choose'));
    setMethod('choose');
  };

  const cancelGoogleLink = () => {
    clearPendingGoogleLink();
    setGoogleLink(null);
    if (GOOGLE_SIGN_IN_ENABLED) setMethod('choose');
    router.replace('/auth-phone');
  };

  const submit = async () => {
    const fullPhone = toInternationalPhone(phone, countryCode);
    if (!/^\+[1-9]\d{7,14}$/.test(fullPhone)) {
      setError(t('phone_error_invalid'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await requestOtp(fullPhone, referralToken ?? undefined);
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

  // Retour au choix depuis le formulaire, sinon à l'accueil.
  const goBack = () => {
    if (method === 'phone' && canChoose) backToChooser();
    else router.push('/');
  };

  const errorBanner = error && (
    <div role="alert" className="fade-in-entry opacity-0 mb-4 flex items-center gap-2 rounded-pillar bg-error-light p-3 text-xs font-medium text-error">
      <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
        error
      </span>
      {error}
    </div>
  );

  return (
    <AuthShell split>
    {/* Mobile : bandeau photo, contenu en haut, action principale collée en
        bas. Bureau (`lg`) : colonne de formulaire à côté de la colonne de
        marque d'AuthShell, contenu centré verticalement et aligné à gauche. */}
    <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
      <AuthBrandBanner />

      {/* Même pastille, même hauteur que les réglages langue / thème, côté
          début de ligne (à droite en arabe). */}
      <div className="absolute start-2 top-[max(0.5rem,env(safe-area-inset-top))] z-[70] rounded-full bg-surface-container-lowest p-0.5 shadow-soft lg:start-6 lg:top-6 lg:shadow-none">
        <IconButton aria-label="Retour" onClick={goBack}>
          <span className="material-symbols-outlined rtl:-scale-x-100" aria-hidden="true" style={{ fontSize: 22 }}>
            arrow_back
          </span>
        </IconButton>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-6 lg:max-w-[440px] lg:justify-center lg:px-0 lg:py-24">
        {sessionExpired && (
          <div role="status" className="mb-4 flex items-start gap-2 rounded-pillar border border-outline-variant bg-gold-light p-3 text-xs font-medium text-onSurface">
            <span className="material-symbols-outlined text-gold-dark" style={{ fontSize: 18 }}>schedule</span>
            {t('auth_session_expired')}
          </div>
        )}
        {googleLink && (
          <div role="status" className="mb-4 rounded-pillar border border-primary/20 bg-primary/10 p-3 text-xs font-medium text-onSurface">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary" aria-hidden="true" style={{ fontSize: 18 }}>link</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-primary">{t('google_link_title')}</p>
                {googleLink.email && <p className="mt-0.5 break-all font-semibold">{googleLink.email}</p>}
                <p className="mt-1 leading-normal">{t('google_link_body')}</p>
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <Button variant="link" size="sm" onClick={cancelGoogleLink}>
                {t('google_link_cancel')}
              </Button>
            </div>
          </div>
        )}
        {referralToken && (
          <div role="status" className="mb-4 flex items-start gap-2 rounded-pillar border border-primary/20 bg-primary/10 p-3 text-xs font-medium text-onSurface">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>how_to_reg</span>
            {t('referral_notice')}
          </div>
        )}

        {/* Sélecteur discret : il précise le public, il ne doit pas voler la
            vedette aux deux méthodes de connexion. */}
        {showIntentSwitch && (
          <div className="fade-in-entry opacity-0 mb-8 grid grid-cols-2 gap-1 rounded-pillar border border-outline-variant bg-surface-container-low p-1">
            {(
              [
                ['job_seeker', t('auth_intent_job_seeker')],
                ['recruiter', t('auth_intent_recruiter')],
              ] as const
            ).map(([value, label]) => {
              const selected = intent === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIntent(value)}
                  aria-pressed={selected}
                  className={[
                    'h-10 rounded-pillar px-3 text-xs font-bold transition-[background-color,color,box-shadow] duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    selected
                      ? 'bg-surface-container-lowest text-primary shadow-sm ring-1 ring-outline-variant'
                      : 'text-onSurface-variant hover:text-onSurface',
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {method === 'choose' ? (
          <>
            <div className="fade-in-entry opacity-0 mb-8">
              <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-primary lg:text-[2rem]">
                {intent === 'recruiter' ? t('phone_screen_title_recruiter') : t('auth_choose_title')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">
                {intent === 'recruiter' ? t('auth_choose_subtitle_recruiter') : t('auth_choose_subtitle')}
              </p>
            </div>
            {errorBanner}
            <div className="fade-in-entry stagger-1 opacity-0 pb-10 lg:pb-0">
              <GoogleSignInButton />
              {/* « ou » entre les deux : l'une OU l'autre, jamais les deux. */}
              <div className="my-4 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-outline-variant" />
                <span className="text-xs font-semibold text-onSurface-variant">{t('auth_or')}</span>
                <span className="h-px flex-1 bg-outline-variant" />
              </div>
              <Button
                variant="neutral"
                size="lg"
                fullWidth
                onClick={choosePhone}
                leadingIcon={
                  <span className="material-symbols-outlined text-primary" aria-hidden="true" style={{ fontSize: 22 }}>
                    smartphone
                  </span>
                }
              >
                {t('auth_method_phone')}
              </Button>
            </div>
          </>
        ) : (
          <form
            id="auth-phone-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="fade-in-entry opacity-0 mb-6">
              <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-primary lg:text-[2rem]">
                {intent === 'recruiter' ? t('phone_screen_title_recruiter') : t('phone_screen_title')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">
                {intent === 'recruiter' ? t('phone_screen_subtitle_recruiter') : t('phone_screen_subtitle')}
              </p>
            </div>

            <div className="fade-in-entry stagger-1 opacity-0 mb-2 space-y-2">
              <label htmlFor="auth-phone-number" className="block text-[10px] font-bold uppercase tracking-widest text-onSurface-variant">
                {t('phone_field_label')}
              </label>
              <div className="flex h-14 items-center gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest px-4 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-light">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }} aria-hidden="true">
                  phone
                </span>
                <select
                  id="auth-phone-country"
                  aria-label={t('phone_country_label')}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-sm font-bold text-primary outline-none focus:ring-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="h-6 w-px bg-outline-variant" aria-hidden="true" />
                <input
                  ref={phoneInputRef}
                  id="auth-phone-number"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="6 12 34 56 78"
                  className="min-w-0 flex-1 border-none bg-transparent p-0 text-base font-semibold text-onSurface placeholder:text-outline outline-none focus:ring-0"
                />
              </div>
            </div>
            <p className="fade-in-entry stagger-1 opacity-0 mb-6 text-[11px] leading-normal text-onSurface-variant">
              {t('phone_field_hint')}
            </p>

            {errorBanner}

            <div className="fade-in-entry stagger-2 opacity-0 flex gap-3 rounded-pillar border border-outline-variant bg-surface-container-low p-3">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-primary" aria-hidden="true" style={{ fontSize: 18 }}>
                verified_user
              </span>
              <p className="text-[11px] font-medium leading-normal text-primary">{t('phone_consent')}</p>
            </div>
          </form>
        )}

        {method === 'phone' && (
          // Mobile : collé en bas de l'écran, l'action reste sous le pouce même
          // quand les bandeaux allongent la page. Bureau : juste sous le
          // formulaire, dans la même colonne.
          <footer className="fade-in-entry stagger-3 opacity-0 sticky bottom-0 -mx-6 mt-auto space-y-2 border-t border-outline-variant bg-surface px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:static lg:mx-0 lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0">
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
            {canChoose && (
              <Button variant="ghost" size="md" fullWidth onClick={backToChooser}>
                {t('auth_other_method')}
              </Button>
            )}
          </footer>
        )}
      </div>

      {DevAuthTools && <DevAuthTools />}
    </main>
    </AuthShell>
  );
}
