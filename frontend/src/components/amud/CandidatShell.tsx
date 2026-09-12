'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { DropdownMenu, NavItem, isNavActive } from '@/components/amud/ui';
import { InlineLanguageThemeControls } from '@/components/amud/HeaderLanguageThemeControls';
import { ToastProvider } from '@/components/amud/Toast';
import { GlobalSearch, useGlobalSearchShortcut, type GlobalSearchResult } from '@/components/amud/GlobalSearch';
import { NotificationCenter } from '@/components/amud/NotificationCenter';
import { RoleBottomNav } from '@/components/amud/RoleBottomNav';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { loadLocalOffres } from '@/lib/amud/localOffres';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { useCollection } from '@/lib/amud/storage/useCollection';

type NavEntry = {
  href: string;
  icon: string;
  label: string;
  group: string;
  inBottomNav?: boolean;
  bottomIcon?: string;
  bottomLabel?: string;
};

/**
 * Config de navigation unique pour la sidebar desktop, la barre du bas
 * mobile et le tiroir "Plus" (cahier des charges §5) — même pattern que
 * `CompanyShell`. La barre du bas ne garde que les 5 entrées demandées :
 * Accueil, Offres, Candidatures, Messages, Profil.
 */
const NAV: NavEntry[] = [
  { href: '/amud/candidat', icon: 'dashboard', label: 'Accueil', group: '', inBottomNav: true },
  { href: '/amud/candidat/parcours', icon: 'route', label: 'Mon parcours', group: 'Mon parcours' },
  { href: '/amud/candidat/opportunites', icon: 'work', label: 'Opportunités', group: 'Candidature', inBottomNav: true, bottomLabel: 'Offres' },
  { href: '/amud/candidat/candidatures', icon: 'assignment', label: 'Mes candidatures', group: 'Candidature', inBottomNav: true, bottomLabel: 'Candidatures' },
  { href: '/amud/candidat/entretiens', icon: 'event', label: 'Mes entretiens', group: 'Candidature' },
  { href: '/amud/candidat/messages', icon: 'mail', label: 'Messages', group: 'Communication', inBottomNav: true },
  { href: '/amud/candidat/profil', icon: 'person', label: 'Mon profil', group: 'Compte', inBottomNav: true },
  { href: '/amud/candidat/documents', icon: 'description', label: 'Documents', group: 'Compte' },
  { href: '/amud/candidat/favoris', icon: 'star', label: 'Favoris', group: 'Compte' },
  { href: '/amud/candidat/notifications', icon: 'notifications', label: 'Notifications', group: 'Compte' },
  { href: '/amud/candidat/parametres', icon: 'settings', label: 'Paramètres', group: 'Compte' },
];

const GROUP_LABELS = ['', 'Mon parcours', 'Candidature', 'Communication', 'Compte'];

/** Routes accessibles sans session candidat — landing (page d'accueil du module), inscription, onboarding. */
const PUBLIC_ROUTES = ['/amud/candidat', '/amud/candidat/inscription', '/amud/candidat/onboarding'];

function useCandidateSearchResults(query: string, candidateId?: string): GlobalSearchResult[] {
  const [applications] = useCollection(applicationsCollection, []);
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !candidateId) return [];
    const results: GlobalSearchResult[] = [];

    for (const a of applications.filter((a) => a.candidateId === candidateId)) {
      if (results.filter((r) => r.icon === 'assignment').length >= 4) break;
      if (a.offerTitre.toLowerCase().includes(q) || a.entrepriseNom.toLowerCase().includes(q)) {
        results.push({ id: `app-${a.id}`, label: a.offerTitre, sub: `Candidature · ${a.entrepriseNom}`, href: `/amud/candidat/candidatures/${a.id}`, icon: 'assignment' });
      }
    }

    for (const o of loadLocalOffres()) {
      if (results.filter((r) => r.icon === 'work').length >= 4) break;
      if (o.titre.toLowerCase().includes(q) || o.entreprise.toLowerCase().includes(q)) {
        results.push({ id: `off-${o.id}`, label: o.titre, sub: `Offre · ${o.entreprise}`, href: `/amud/candidat/opportunites/${o.id}`, icon: 'work' });
      }
    }

    return results.slice(0, 8);
  }, [applications, query, candidateId]);
}

export function CandidatShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { candidate, loading } = useCurrentCandidate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const results = useCandidateSearchResults(query, candidate?.id);
  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useGlobalSearchShortcut(() => {
    setSearchOpen(true);
    searchInputRef.current?.focus();
  });

  useEffect(() => {
    setMobileSearchOpen(false);
    setSearchOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!loading && !candidate && !isPublicRoute) {
      router.replace('/amud/candidat');
    }
  }, [loading, candidate, isPublicRoute, router, pathname]);

  function goToResult(href: string) {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setQuery('');
    router.push(href);
  }

  // Pas de session (landing, inscription, onboarding) : pas de coquille applicative, juste le contenu + toasts.
  if (!candidate) {
    if (!loading && !isPublicRoute) return null;
    return <ToastProvider>{children}</ToastProvider>;
  }

  const candidateInitial = candidate.prenom.charAt(0).toUpperCase() || 'C';

  return (
    <ToastProvider>
      <div className="amud-ops-scale flex min-h-screen bg-amud-background text-amud-on-surface">
        <aside
          className={`group fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-amud-outline-variant bg-amud-surface-container-lowest transition-[width] duration-200 ease-in-out md:flex ${
            collapsed ? 'md:w-20 md:hover:w-64' : 'md:w-64'
          }`}
        >
          <div className={`flex items-center gap-sm border-b border-amud-outline-variant px-lg py-2.5 ${collapsed ? 'md:px-md' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-amud-primary-container">
              <span className="material-symbols-outlined text-white">person</span>
            </div>
            <div className={hiddenWhenCollapsed}>
              <h1 className="truncate text-title-lg font-bold text-amud-primary">Amud Skills</h1>
              <p className="text-label-sm text-amud-on-surface-variant">Espace candidat</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md">
            {GROUP_LABELS.map((label) => {
              const items = NAV.filter((item) => item.group === label);
              if (items.length === 0) return null;
              return (
                <div key={label || 'root'} className={label ? 'mt-4' : ''}>
                  {label ? (
                    <div className={`px-md py-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline ${hiddenWhenCollapsed}`}>{label}</div>
                  ) : null}
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        active={isNavActive(pathname, item.href, item.href === '/amud/candidat')}
                        collapsed={collapsed}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className={`border-t border-amud-outline-variant p-md ${collapsed ? 'md:px-sm' : ''}`} style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <div className={`flex items-center gap-3 rounded-lg p-2 ${collapsed ? 'md:justify-center' : ''}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">{candidateInitial}</div>
              <div className={`min-w-0 ${hiddenWhenCollapsed}`}>
                <div className="truncate text-label-md font-bold text-amud-on-surface">{candidate.prenom} {candidate.nom}</div>
                <div className="truncate text-label-sm text-amud-on-surface-variant">{candidate.email}</div>
              </div>
            </div>
            <Link
              href="/amud"
              className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-amud-outline-variant px-3 py-2 text-label-sm font-medium text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
              title={collapsed ? "Changer d'espace" : undefined}
            >
              <span className="material-symbols-outlined text-[18px]">apps</span>
              <span className={collapsed ? 'md:hidden md:group-hover:inline' : ''}>Changer d&apos;espace</span>
            </Link>
          </div>
        </aside>

        <div className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-sm border-b border-amud-outline-variant/40 bg-amud-surface/90 px-margin-mobile backdrop-blur-md md:px-gutter">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:flex"
              aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
              aria-pressed={collapsed}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="flex min-w-0 items-center gap-sm md:hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-amud-primary-container">
                <span className="material-symbols-outlined text-white text-[20px]">person</span>
              </div>
              <span className="truncate text-title-lg font-bold text-amud-on-surface">Amud Skills</span>
            </div>

            <GlobalSearch
              query={query}
              onQueryChange={setQuery}
              results={results}
              onSelect={goToResult}
              open={searchOpen}
              onOpenChange={setSearchOpen}
              inputRef={searchInputRef}
              placeholder="Rechercher une offre, une candidature…"
              className="relative hidden max-w-md flex-1 md:block"
            />

            <div className="ml-auto flex items-center gap-1 md:gap-sm">
              <button
                onClick={() => setMobileSearchOpen((v) => !v)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low md:hidden"
                aria-label="Rechercher"
                aria-expanded={mobileSearchOpen}
              >
                <span className="material-symbols-outlined">search</span>
              </button>

              <Link
                href="/amud/candidat/opportunites"
                className="hidden items-center gap-xs whitespace-nowrap rounded-lg bg-amud-primary px-md py-2 text-label-md font-medium text-white shadow-sm transition-all hover:brightness-110 active:scale-95 lg:flex"
              >
                <span className="material-symbols-outlined text-[18px] text-white">search</span>
                Découvrir les opportunités
              </Link>

              <NotificationCenter key={`notif-${pathname}`} scope="candidate" targetId={candidate.id} viewAllHref="/amud/candidat/notifications" />

              <DropdownMenu
                key={`profile-${pathname}`}
                header={
                  <div>
                    <div className="text-label-md font-semibold text-amud-on-surface">{candidate.prenom} {candidate.nom}</div>
                    <div className="text-label-sm text-amud-on-surface-variant">{candidate.email}</div>
                  </div>
                }
                body={<InlineLanguageThemeControls />}
                trigger={({ open, toggle }) => (
                  <button
                    onClick={toggle}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-amud-primary text-sm font-bold text-white transition-opacity hover:opacity-90"
                    aria-label="Menu du compte"
                    aria-haspopup="menu"
                    aria-expanded={open}
                  >
                    {candidateInitial}
                  </button>
                )}
                items={[
                  { label: 'Mon profil', icon: 'person', href: '/amud/candidat/profil' },
                  { label: 'Paramètres', icon: 'settings', href: '/amud/candidat/parametres' },
                  { label: 'Aide', icon: 'help' },
                  { label: "Changer d'espace", icon: 'apps', href: '/amud' },
                  { label: 'Déconnexion', icon: 'logout', href: '/amud/candidat/parametres', danger: true },
                ]}
              />
            </div>
          </header>

          {mobileSearchOpen ? (
            <div className="border-b border-amud-outline-variant bg-amud-surface p-md md:hidden">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                  placeholder="Rechercher une offre, une candidature…"
                  aria-label="Rechercher une offre, une candidature"
                  type="text"
                />
              </div>
              {query.trim().length >= 2 ? (
                <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-amud-outline-variant bg-amud-surface">
                  {results.length === 0 ? (
                    <p className="p-md text-label-sm text-amud-on-surface-variant">Aucun résultat pour « {query} ».</p>
                  ) : (
                    results.map((r) => (
                      <button key={r.id} onClick={() => goToResult(r.href)} className="flex w-full items-center gap-sm px-md py-sm text-left transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-amud-primary">{r.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-label-md text-amud-on-surface">{r.label}</span>
                          <span className="block truncate text-label-sm text-amud-on-surface-variant">{r.sub}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <main key={pathname} className="min-w-0 flex-1 animate-amud-rise-in space-y-xl p-margin-mobile pb-24 md:p-margin-desktop md:pb-margin-desktop">
            {children}
          </main>
        </div>

        <RoleBottomNav items={NAV} />
      </div>
    </ToastProvider>
  );
}
