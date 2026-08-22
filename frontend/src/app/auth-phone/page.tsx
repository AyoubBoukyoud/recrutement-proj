'use client';

// Interface 3 — Authentification par téléphone : saisie du numéro, validation, puis /otp?phone=...

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { otpFailureMessage } from '@/lib/authMessages';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/shared/Button';
import { AuthShell } from '@/components/AuthShell';
import { USE_MOCKS } from '@/data/config';
import { MOCK_OTP_CODE } from '@/data/fixtures/auth';
import { destinationForRole } from '@/lib/roleDestination';

const COUNTRY_CODES = [
  { code: '+212', label: '🇲🇦 +212' },
  { code: '+49', label: '🇩🇪 +49' },
];

type DevMenuItem = { path: string; label: string };
type DevLinkGroup = { key: string; label: string; items: DevMenuItem[] };

/**
 * Pages publiques du mini-site marketing `/amud/marketing/*` (portées depuis
 * 3 maquettes indépendantes des dashboards par rôle). Pages publiques, sans
 * connexion, donc de simples liens.
 */
const DEV_MARKETING_LINKS: DevMenuItem[] = [
  { path: '/amud/marketing/home', label: 'Accueil — Le pont professionnel' },
  { path: '/amud/marketing/employers', label: 'Employeurs — Confiance & conformité' },
  { path: '/amud/marketing/product', label: 'Produit — Matching en temps réel' },
];

type DevRealAccount = { phone: string; label: string; path: string };

/**
 * Comptes de démo dont la destination réelle (`/admin/apercu`) est protégée
 * par `middleware.ts` : un simple `Link`, comme dans `DEV_REAL_APP_LINKS`, y
 * serait aussitôt renvoyé vers `/auth-phone` faute de cookie `as_role`. Ces
 * boutons passent donc par `devSignInReal`, qui rejoue la vérification OTP
 * réelle (même téléphone que `MOCK_ACCOUNTS`) avant de naviguer vers
 * `destinationForRole`.
 */
const DEV_REAL_OTP_ACCOUNTS: DevRealAccount[] = [
  { phone: '+212600000004', label: 'Admin — 06 00 00 00 04', path: '/admin/apercu' },
];

/**
 * Contrairement à `DEV_REAL_OTP_ACCOUNTS` (qui saute l'écran OTP en appelant
 * `verifyOtp` directement), ce lien mène au véritable écran `/otp` — numéro
 * déjà rempli — pour tester ce parcours-là. Compte candidat 101
 * (`incompleteProfileStep: null`), donc `destinationForRole` atterrit sur
 * `/dashboard` une fois le code `000000` saisi.
 */
const DEV_CANDIDATE_OTP_LINK = { phone: '+212600000001', label: 'Candidat — écran OTP → /dashboard' };

/**
 * Pages réelles de l'app (hors `/amud`, hors ce menu) qui n'ont pas encore de
 * raccourci ci-dessus. Simples liens `Link`, comme `DEV_MARKETING_LINKS` : pas
 * de connexion mock à déclencher, on veut juste pouvoir ouvrir la page. Liste
 * dérivée de `frontend/src/app/**\/page.tsx` — à tenir à jour si une page est
 * ajoutée ailleurs et manuellement rattachée à un groupe ci-dessus.
 * `/admin` (redirige vers `/admin/apercu`) et `/admin/[...slug]` (fallback
 * 404 générique) sont volontairement omis : ni l'un ni l'autre n'est une
 * destination utile en soi.
 */
const DEV_REAL_APP_LINKS: DevLinkGroup[] = [
  {
    key: 'public',
    label: 'Public / avant connexion',
    items: [
      { path: '/', label: 'Accueil' },
      { path: '/employeurs', label: 'Employeurs' },
      { path: '/language', label: 'Choix de la langue' },
      { path: '/splash', label: 'Splash screen' },
      { path: '/otp', label: 'Vérification OTP' },
      { path: '/profile-creation', label: 'Création de profil (5 étapes)' },
      { path: '/metiers/infirmier', label: 'Fiche métier (exemple : infirmier)' },
      { path: '/offline', label: 'Page hors-ligne' },
    ],
  },
  {
    key: 'candidate-real',
    label: 'Espace candidat (réel)',
    items: [
      { path: '/dashboard', label: 'Tableau de bord' },
      { path: '/offres', label: "Offres d'emploi" },
      { path: '/documents', label: 'Documents & extraction CV' },
      { path: '/profil', label: 'Profil public' },
      { path: '/reclamation', label: 'Réclamation' },
      { path: '/faq', label: 'FAQ / Centre d’aide' },
      { path: '/matching-preferences', label: 'Préférences de matching' },
      { path: '/quiz-metier', label: 'Quiz métier' },
      { path: '/simulateur-salaire', label: 'Simulateur de salaire (template Stitch)' },
      { path: '/salaire', label: 'Simuler mon salaire' },
      { path: '/parrainage', label: 'Programme de parrainage' },
      { path: '/verification-identite', label: 'Vérification d’identité' },
      { path: '/video', label: 'Vidéo de présentation' },
      { path: '/visibilite', label: 'Score de visibilité' },
      { path: '/test-langue', label: 'Test de langue IA' },
      { path: '/cours-allemand', label: 'Cours d’allemand (template Stitch)' },
      { path: '/lecon-jour', label: 'Leçon du jour' },
    ],
  },
  {
    key: 'admin-real',
    label: 'Back-office admin (réel)',
    items: [
      { path: '/admin/apercu', label: 'Aperçu (métriques)' },
      { path: '/admin/candidats', label: 'Candidats' },
      { path: '/admin/candidats/1', label: 'Dossier candidat (exemple : id 1)' },
      { path: '/admin/recruteurs', label: 'Recruteurs' },
      { path: '/admin/recruteurs/201', label: 'Dossier recruteur (exemple : id 201)' },
      { path: '/admin/parrainage', label: 'Commissions de parrainage' },
      { path: '/admin/reclamations', label: 'Réclamations' },
      { path: '/admin/stage', label: 'Catalogue du stage' },
      { path: '/admin/utilisateurs', label: 'Utilisateurs' },
    ],
  },
];

/** Groupe repliable de simples liens `Link` — pas de connexion mock, juste ouvrir la page. */
function DevLinkGroupList({
  groups,
  expandedKey,
  onToggle,
}: {
  groups: DevLinkGroup[];
  expandedKey: string | null;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {groups.map((group) => {
        const isOpen = expandedKey === group.key;
        return (
          <div key={group.key} className="overflow-hidden rounded-pillar border border-outline-variant bg-surface-container-lowest">
            <button
              type="button"
              onClick={() => onToggle(group.key)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
            >
              {group.label}
              <span
                className="material-symbols-outlined transition-transform duration-150"
                style={{ fontSize: 18, transform: isOpen ? 'rotate(180deg)' : undefined }}
              >
                expand_more
              </span>
            </button>
            {isOpen && (
              <div className="max-h-56 divide-y divide-outline-variant/60 overflow-y-auto border-t border-outline-variant">
                {group.items.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="flex items-center justify-between px-4 py-2 text-left text-xs text-onSurface-variant transition-colors hover:bg-primary/5 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Connexion candidat ou recruteur/staff : même téléphone, même code — le rôle
 * qui décide de la destination vient toujours du back, jamais de ce choix.
 * `intent` n'est qu'une intention affichée et transmise à /otp, qui prévient
 * l'appelant si le numéro n'a en réalité pas d'accès recruteur.
 */
type Intent = 'job_seeker' | 'recruiter';

export default function AuthPhonePage() {
  const router = useRouter();
  const { requestOtp, verifyOtp } = useAuth();
  const { t } = useLanguage();
  const [intent, setIntent] = useState<Intent>('job_seeker');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Chemin en cours de connexion (pas juste le rôle : plusieurs pages
  // partagent un même rôle, chacune a son propre état de chargement).
  const [devLoadingPath, setDevLoadingPath] = useState<string | null>(null);
  // Idem pour les groupes de DEV_REAL_APP_LINKS — état séparé, ce sont deux menus distincts.
  const [expandedRealGroup, setExpandedRealGroup] = useState<string | null>(null);

  // Se connecte avec le vrai téléphone du compte puis suit la même
  // redirection que l'écran OTP (`destinationForRole`), pour atterrir sur la
  // vraie page protégée (`/admin/apercu`) plutôt que sur une maquette `/amud`.
  const devSignInReal = async (account: DevRealAccount) => {
    setError(null);
    setDevLoadingPath(account.path);
    try {
      const result = await verifyOtp(MOCK_OTP_CODE, account.phone);
      if (!result.ok) {
        setError(otpFailureMessage(result, t));
        return;
      }
      router.push(destinationForRole(result.role, null));
    } catch (err) {
      console.error('devSignInReal a échoué', err);
      setError(otpFailureMessage({ ok: false, reason: 'unknown' }, t));
    } finally {
      setDevLoadingPath(null);
    }
  };

  const submit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) {
      setError(t('phone_error_invalid'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const fullPhone = `${countryCode}${digits}`;
    const result = await requestOtp(fullPhone);
    setIsSubmitting(false);

    // On ne navigue que si le code est réellement parti : envoyer le candidat
    // attendre un message qui n'arrivera jamais serait pire qu'une erreur ici.
    if (!result.ok) {
      setError(otpFailureMessage(result, t));
      return;
    }

    router.push(`/otp?phone=${encodeURIComponent(fullPhone)}&intent=${intent}`);
  };

  return (
    <AuthShell>
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-subtle">
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
          <label className="block text-[10px] font-bold uppercase tracking-widest text-onSurface-variant">
            {t('phone_field_label')}
          </label>
          <div className="flex items-center gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-sm">
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
          <p className="text-[11px] leading-normal text-primary font-medium">{t('phone_consent')}</p>
        </div>
      </form>

      {USE_MOCKS && (
        <div className="fade-in-entry opacity-0 mx-6 mb-4 rounded-pillar border border-dashed border-outline-variant bg-surface-container-low p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-onSurface-variant">
            Espace réel (via OTP)
          </p>
          <div className="space-y-1.5">
            {DEV_REAL_OTP_ACCOUNTS.map((account) => (
              <Button
                key={account.path}
                variant="outline"
                size="sm"
                fullWidth
                className="justify-start"
                onClick={() => devSignInReal(account)}
                disabled={devLoadingPath !== null}
                isLoading={devLoadingPath === account.path}
              >
                {account.label}
              </Button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-onSurface-variant">
            Parcours OTP réel (candidat)
          </p>
          <Link
            href={`/otp?phone=${encodeURIComponent(DEV_CANDIDATE_OTP_LINK.phone)}&intent=job_seeker`}
            className="flex h-10 w-full items-center justify-start gap-2 rounded-pillar border border-outline bg-transparent px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
          >
            {DEV_CANDIDATE_OTP_LINK.label}
          </Link>

          <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-onSurface-variant">
            Site public (sans connexion)
          </p>
          <div className="space-y-1.5">
            {DEV_MARKETING_LINKS.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="flex h-10 w-full items-center justify-start gap-2 rounded-pillar border border-outline bg-transparent px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-onSurface-variant">
            Pages réelles de l&apos;app (pas encore dans ce menu)
          </p>
          <DevLinkGroupList
            groups={DEV_REAL_APP_LINKS}
            expandedKey={expandedRealGroup}
            onToggle={(key) => setExpandedRealGroup((prev) => (prev === key ? null : key))}
          />
        </div>
      )}

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
        <Button variant="outline" fullWidth onClick={submit} disabled={isSubmitting}>
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
            chat
          </span>
          {t('phone_whatsapp_cta')}
        </Button>
      </footer>
    </main>
    </AuthShell>
  );
}

