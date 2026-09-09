'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shared/Button';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { USE_MOCKS } from '@/data/config';
import { authRepository } from '@/data/auth';
import { MOCK_OTP_CODE } from '@/data/fixtures/auth';
import { otpFailureMessage } from '@/lib/authMessages';
import { destinationForRole } from '@/lib/roleDestination';

type MenuItem = { path: string; label: string };
type LinkGroup = { key: string; label: string; items: MenuItem[] };
type RealAccount = { phone: string; label: string; path: string };

const MARKETING_LINKS: MenuItem[] = [
  { path: '/amud/marketing/home', label: 'Accueil — prototype' },
  { path: '/amud/marketing/employers', label: 'Employeurs — prototype' },
  { path: '/amud/marketing/product', label: 'Produit — prototype' },
];

const REAL_OTP_ACCOUNTS: RealAccount[] = [
  { phone: '+212600000001', label: 'Admin — 06 00 00 00 01', path: '/admin' },
  { phone: '+212600000002', label: 'Recruteur — 06 00 00 00 02', path: '/recruiter' },
  { phone: '+212600000003', label: 'Agent — 06 00 00 00 03', path: '/agent' },
];

const CANDIDATE_OTP = { phone: '+212600000004', label: 'Candidat — écran OTP → /dashboard' };

const REAL_APP_LINKS: LinkGroup[] = [
  {
    key: 'public',
    label: 'Public / avant connexion',
    items: [
      { path: '/', label: 'Accueil' },
      { path: '/employeurs', label: 'Employeurs' },
      { path: '/language', label: 'Choix de la langue' },
      { path: '/otp', label: 'Vérification OTP' },
      { path: '/profile-creation', label: 'Création de profil' },
      { path: '/metiers/infirmier', label: 'Fiche métier' },
      { path: '/offline', label: 'Page hors-ligne' },
    ],
  },
  {
    key: 'candidate-real',
    label: 'Espace candidat (réel)',
    items: [
      { path: '/dashboard', label: 'Tableau de bord' },
      { path: '/offres', label: 'Offres' },
      { path: '/documents', label: 'Documents' },
      { path: '/profil', label: 'Profil' },
      { path: '/candidatures', label: 'Candidatures' },
      { path: '/favoris', label: 'Favoris' },
      { path: '/notifications', label: 'Notifications' },
      { path: '/visibilite', label: 'Visibilité' },
      { path: '/test-langue', label: 'Estimation orale' },
      { path: '/reclamation', label: 'Support' },
      { path: '/compte', label: 'Compte' },
    ],
  },
  {
    key: 'admin-real',
    label: 'Back-office admin (réel)',
    // La console a son propre `layout.tsx` et sa navigation depuis que
    // `destinationForRole('admin')` y renvoie ; ce menu n'est plus le seul
    // point d'entrée, il reste pratique pour sauter directement à un écran.
    items: [
      { path: '/admin', label: 'Vue d’ensemble' },
      { path: '/admin/utilisateurs', label: 'Utilisateurs et rôles' },
      { path: '/admin/offres', label: 'Offres' },
      { path: '/admin/candidatures', label: 'Candidatures' },
      { path: '/admin/journal', label: 'Journal' },
      { path: '/admin/notifications', label: 'Notifications' },
    ],
  },
];

function LinkGroups({ expanded, onToggle }: { expanded: string | null; onToggle: (key: string) => void }) {
  return (
    <div className="space-y-1.5">
      {REAL_APP_LINKS.map((group) => {
        const open = expanded === group.key;
        return (
          <div key={group.key} className="overflow-hidden rounded-pillar border border-outline-variant bg-surface-container-lowest">
            <button type="button" onClick={() => onToggle(group.key)} aria-expanded={open} className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-bold text-primary hover:bg-primary/5">
              {group.label}
              <span className={`material-symbols-outlined transition-transform ${open ? 'rotate-180' : ''}`} style={{ fontSize: 18 }}>expand_more</span>
            </button>
            {open && (
              <div className="max-h-56 divide-y divide-outline-variant/60 overflow-y-auto border-t border-outline-variant">
                {group.items.map((item) => <Link key={item.path} href={item.path} className="block px-4 py-2 text-xs text-onSurface-variant hover:bg-primary/5 hover:text-primary">{item.label}</Link>)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Opt-in development catalog. Never imported by the normal client bundle. */
export function DevAuthTools() {
  const router = useRouter();
  const { verifyOtp } = useAuth();
  const { t } = useLanguage();
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (account: RealAccount) => {
    setError(null);
    setLoadingPath(account.path);
    try {
      const code = USE_MOCKS
        ? MOCK_OTP_CODE
        : (await authRepository.requestOtp(account.phone)).debug_otp_code;
      if (!code) {
        setError('Connexion rapide indisponible : aucun code local retourné par le serveur.');
        return;
      }
      const result = await verifyOtp(code, account.phone);
      if (!result.ok) {
        setError(otpFailureMessage(result, t));
        return;
      }
      router.push(destinationForRole(result.role, null));
    } catch {
      setError(otpFailureMessage({ ok: false, reason: 'unknown' }, t));
    } finally {
      setLoadingPath(null);
    }
  };

  const openCandidateOtp = async () => {
    setError(null);
    setLoadingPath('/otp');
    try {
      const response = await authRepository.requestOtp(CANDIDATE_OTP.phone);
      const query = new URLSearchParams({ phone: CANDIDATE_OTP.phone, intent: 'job_seeker' });
      if (response.debug_otp_code) query.set('debug_code', response.debug_otp_code);
      router.push(`/otp?${query.toString()}`);
    } catch {
      setError('Impossible de préparer le code candidat. Réessayez après le délai indiqué.');
    } finally {
      setLoadingPath(null);
    }
  };

  return (
    <aside className="fade-in-entry mx-6 mb-4 rounded-pillar border border-dashed border-outline-variant bg-surface-container-low p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-onSurface-variant">Outils de développement — opt-in</p>
      <div className="space-y-1.5">
        {REAL_OTP_ACCOUNTS.map((account) => <Button key={account.path} variant="outline" size="sm" fullWidth className="justify-start" onClick={() => signIn(account)} disabled={loadingPath !== null} isLoading={loadingPath === account.path}>{account.label}</Button>)}
      </div>

      <Button variant="outline" size="sm" fullWidth className="mt-3 justify-start" onClick={openCandidateOtp} isLoading={loadingPath === '/otp'}>{CANDIDATE_OTP.label}</Button>

      <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-onSurface-variant">Prototypes marketing</p>
      <div className="space-y-1.5">
        {MARKETING_LINKS.map((item) => <Link key={item.path} href={item.path} className="flex h-10 items-center rounded-pillar border border-outline px-4 text-xs font-bold text-primary hover:bg-primary/5">{item.label}</Link>)}
      </div>

      <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-onSurface-variant">Pages réelles</p>
      <LinkGroups expanded={expanded} onToggle={(key) => setExpanded((current) => current === key ? null : key)} />
      {error && <p role="alert" className="mt-3 text-xs font-medium text-error">{error}</p>}
    </aside>
  );
}
