'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { DropdownMenu, NavItem, Toggle, isNavActive, useDropdown } from '@/components/amud/ui';
import { HeaderLanguageThemeControls } from '@/components/amud/HeaderLanguageThemeControls';
import { ToastProvider } from '@/components/amud/Toast';
import { DemoBanner } from '@/components/amud/DemoBanner';
import { GlobalSearch, useGlobalSearchShortcut, type GlobalSearchResult } from '@/components/amud/GlobalSearch';
import { NotificationCenter } from '@/components/amud/NotificationCenter';
import { RoleBottomNav } from '@/components/amud/RoleBottomNav';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { loadLocalApplications } from '@/lib/amud/localApplications';
import { loadLocalOffres } from '@/lib/amud/localOffres';

/** Coquille de `/amud/employer` (doc3: tableau_de_bord_employeur_desktop_restored.html). */
const NAV = [{ href: '/amud/employer', icon: 'dashboard', label: 'Dashboard', inBottomNav: true }];

/** Recherche header réelle (façon `useGlobalSearchResults` d'AdminShell), bornée aux candidatures/offres de l'entreprise connectée. */
function useEmployerSearchResults(query: string): GlobalSearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: GlobalSearchResult[] = [];

    const applications = loadLocalApplications().filter((a) => a.entrepriseId === CURRENT_EMPLOYER.entrepriseId);
    for (const a of applications) {
      if (results.filter((r) => r.icon === 'person').length >= 4) break;
      if (a.candidateNom.toLowerCase().includes(q) || a.offerTitre.toLowerCase().includes(q)) {
        results.push({ id: `app-${a.id}`, label: a.candidateNom, sub: `Candidature · ${a.offerTitre}`, href: `/amud/employer?q=${encodeURIComponent(a.candidateNom)}`, icon: 'person' });
      }
    }

    const offres = loadLocalOffres().filter((o) => o.entrepriseId === CURRENT_EMPLOYER.entrepriseId);
    for (const o of offres) {
      if (results.filter((r) => r.icon === 'work').length >= 3) break;
      if (o.titre.toLowerCase().includes(q)) {
        results.push({ id: `off-${o.id}`, label: o.titre, sub: `Offre · ${o.statut}`, href: '/amud/employer', icon: 'work' });
      }
    }

    return results.slice(0, 8);
  }, [query]);
}

export function EmployerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const settingsMenu = useDropdown<HTMLDivElement>();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  const results = useEmployerSearchResults(query);

  useGlobalSearchShortcut(() => {
    setSearchOpen(true);
    searchInputRef.current?.focus();
  });

  useEffect(() => {
    settingsMenu.setOpen(false);
    setSearchOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function goToResult(href: string) {
    setSearchOpen(false);
    setQuery('');
    router.push(href);
  }

  return (
    <ToastProvider>
    <div className="min-h-screen overflow-x-hidden bg-amud-background text-amud-on-surface">
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-72 flex-col space-y-sm overflow-y-auto border-r border-amud-outline-variant bg-amud-surface-container-lowest p-md md:flex">
        <div className="flex items-center gap-md px-sm py-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amud-primary">
            <span className="material-symbols-outlined text-white">language</span>
          </div>
          <div>
            <h1 className="text-headline-md font-black tracking-tight text-amud-on-surface">Amud Skills</h1>
            <p className="text-label-sm text-amud-on-surface-variant">B2B Recruitment Portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <div className="mt-md px-sm py-xs text-[11px] font-bold uppercase tracking-wider text-amud-on-surface-variant">Main Navigation</div>
          {NAV.map((item) => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isNavActive(pathname, item.href, true)} />
          ))}
        </nav>
        <div className="border-t border-amud-outline-variant pt-md" style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-md">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-amud-surface-container-highest">
              <img
                className="h-full w-full object-cover"
                alt="Morocco-Germany Bridge"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuClLfIbrZoVx9Z8EJzQ_k_Jc6590oQ0YlFQZOGb1RvjQlVIxiyq0JuP5djxV8LAHgfdUjCDYm4XHku-Or4ZkzBvcsHJ5YRbZ4q8vNtK0LOvf6sZuGucTYIjShWPbcE5wrFZh4--rUOkV43nGiarLRMMbIjO8zPWcJwrnxyEGIOtlwP2D9jiWLpn2eiiE5Xjs6Uxl3-LuMdaOp6or5YrADUOTpnwKdycfNAyIWwSQRYtTPaJOoYftWOi"
              />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-label-md font-bold text-amud-on-surface">Morocco-Germany Bridge</p>
              <p className="truncate text-[12px] text-amud-on-surface-variant">Elite Recruiting Partner</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen md:ml-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-sm bg-amud-surface-container-lowest px-margin-mobile shadow-sm md:px-margin-desktop">
          <div className="flex min-w-0 items-center gap-sm md:hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amud-primary">
              <span className="material-symbols-outlined text-[20px] text-white">language</span>
            </div>
            <span className="truncate text-title-lg font-bold text-amud-on-surface">Amud Skills</span>
          </div>
          <div className="hidden max-w-xl flex-1 items-center md:flex">
            <GlobalSearch
              query={query}
              onQueryChange={setQuery}
              results={results}
              onSelect={goToResult}
              open={searchOpen}
              onOpenChange={setSearchOpen}
              inputRef={searchInputRef}
              placeholder="Quick search for candidates or jobs…"
              className="relative w-full"
            />
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high md:hidden"
            aria-label="Rechercher"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <div className="ml-auto flex items-center gap-sm md:gap-lg">
            <NotificationCenter
              key={pathname}
              scope="employer"
              buttonClassName="relative rounded-full p-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high"
            />
            <div ref={settingsMenu.ref} className="relative hidden sm:block">
              <button
                onClick={() => settingsMenu.setOpen((v) => !v)}
                className="rounded-full p-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high"
                aria-label="Réglages"
                aria-haspopup="menu"
                aria-expanded={settingsMenu.open}
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
              {settingsMenu.open ? (
                <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                  <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md font-semibold text-amud-on-surface">
                    Réglages rapides
                  </div>
                  <div className="flex flex-col gap-sm p-md">
                    <div className="flex items-center justify-between">
                      <span className="text-label-md text-amud-on-surface">Notifications par email</span>
                      <Toggle checked={emailNotif} onChange={setEmailNotif} size="sm" label="Notifications par email" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-label-md text-amud-on-surface">Notifications push</span>
                      <Toggle checked={pushNotif} onChange={setPushNotif} size="sm" label="Notifications push" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <HeaderLanguageThemeControls iconButtonClassName="rounded-full p-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high" />
            <div className="hidden h-8 w-[1px] bg-amud-outline-variant sm:block" />
            <DropdownMenu
              key={pathname}
              header={
                <div>
                  <div className="text-label-md font-semibold text-amud-on-surface">Morocco-Germany Bridge</div>
                  <div className="text-label-sm text-amud-on-surface-variant">Elite Recruiting Partner</div>
                </div>
              }
              trigger={({ open, toggle }) => (
                <button
                  onClick={toggle}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-amud-primary text-sm font-bold text-white transition-opacity hover:opacity-90"
                  aria-label="Menu du compte"
                  aria-haspopup="menu"
                  aria-expanded={open}
                >
                  M
                </button>
              )}
              items={[
                { label: "Changer d'espace", icon: 'apps', href: '/amud' },
                { label: 'Déconnexion', icon: 'logout', href: '/amud', danger: true },
              ]}
            />
            <button className="flex items-center gap-xs whitespace-nowrap rounded-lg bg-amud-primary px-sm py-sm font-label-md text-white shadow-sm transition-all hover:brightness-110 active:scale-95 sm:px-md">
              <span className="material-symbols-outlined text-[18px] text-white">add</span>
              <span className="hidden sm:inline">New Job</span>
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-7xl space-y-xl p-margin-mobile pb-24 md:p-margin-desktop">
          <DemoBanner />
          {children}
        </div>
      </main>

      <RoleBottomNav items={NAV} />
    </div>
    </ToastProvider>
  );
}
