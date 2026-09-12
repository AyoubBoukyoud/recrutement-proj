'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { DropdownMenu, NavItem, Toggle, isNavActive } from '@/components/amud/ui';
import { InlineLanguageThemeControls } from '@/components/amud/HeaderLanguageThemeControls';
import { ToastProvider } from '@/components/amud/Toast';
import { DemoBanner } from '@/components/amud/DemoBanner';
import { GlobalSearch, useGlobalSearchShortcut, type GlobalSearchResult } from '@/components/amud/GlobalSearch';
import { NotificationCenter } from '@/components/amud/NotificationCenter';
import { RoleBottomNav, type RoleNavItem } from '@/components/amud/RoleBottomNav';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { loadLocalEntreprises } from '@/lib/amud/localEntreprises';
import { loadLocalMesContacts } from '@/lib/amud/localMesContacts';
import { loadLocalTaches } from '@/lib/amud/localCommercialTaches';
import { loadLocalCentres } from '@/lib/amud/localCentres';
import { getCandidatesForCommercial } from '@/data/amud/candidates';
import { loadLocalCandidates } from '@/lib/amud/localCandidates';

/**
 * Coquille des pages `/amud/commercial/*` — espace self-service d'un
 * commercial (doc19 espace_de_travail_quotidien_commercial.html,
 * doc8 mes_rendez_vous_crm_commercial_annotated.html, et la fusion
 * doc10/doc16 pour les contacts). Nav alignée sur doc8, la seule maquette
 * du lot construite explicitement pour le self-service (Overview/Calendar/
 * Companies/Contacts/Tasks) plutôt que sur le sidebar générique "Commercial
 * Agents" recopié par erreur dans doc19/doc10/doc16.
 *
 * Candidats/Performance/Notifications/Profil sont passées de `InertNavItem`
 * (pas encore livrées) à de vrais liens une fois ce dernier lot de pages
 * construit — plus aucune entrée inerte dans cet espace.
 */
const NAV: RoleNavItem[] = [
  { href: '/amud/commercial', icon: 'dashboard', label: 'Vue d’ensemble', inBottomNav: true, bottomLabel: 'Accueil' },
  { href: '/amud/commercial/entreprises', icon: 'domain', label: 'Entreprises', inBottomNav: true },
  { href: '/amud/commercial/candidats', icon: 'person', label: 'Candidats', inBottomNav: true },
  { href: '/amud/commercial/activites', icon: 'history', label: 'Activités', group: 'Suivi' },
  { href: '/amud/commercial/taches', icon: 'assignment', label: 'Tâches', group: 'Suivi' },
  { href: '/amud/commercial/rendez-vous', icon: 'calendar_month', label: 'Rendez-vous', inBottomNav: true, bottomLabel: 'RDV' },
  { href: '/amud/commercial/centres', icon: 'school', label: 'Centres partenaires', group: 'Suivi' },
  { href: '/amud/commercial/contacts', icon: 'group', label: 'Contacts', group: 'Suivi' },
  { href: '/amud/commercial/performance', icon: 'trending_up', label: 'Performance', group: 'Mon espace' },
  { href: '/amud/commercial/notifications', icon: 'notifications', label: 'Notifications', group: 'Mon espace' },
  { href: '/amud/commercial/profile', icon: 'account_circle', label: 'Profil', group: 'Mon espace' },
];

/** Recherche header réelle (façon `useGlobalSearchResults` d'AdminShell), bornée aux entreprises/contacts/tâches du commercial connecté. */
function useCommercialSearchResults(query: string): GlobalSearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: GlobalSearchResult[] = [];

    for (const e of loadLocalEntreprises()) {
      if (results.filter((r) => r.sub === 'Entreprise').length >= 3) break;
      if (e.nom.toLowerCase().includes(q)) {
        results.push({ id: `ent-${e.id}`, label: e.nom, sub: 'Entreprise', href: `/amud/commercial/entreprises/${e.id}`, icon: 'domain' });
      }
    }
    for (const c of loadLocalMesContacts()) {
      if (results.filter((r) => r.sub === 'Contact').length >= 3) break;
      if (c.nom.toLowerCase().includes(q) || c.poste.toLowerCase().includes(q)) {
        results.push({ id: `con-${c.id}`, label: c.nom, sub: 'Contact', href: `/amud/commercial/contacts?q=${encodeURIComponent(c.nom)}`, icon: 'group' });
      }
    }
    for (const t of loadLocalTaches().filter((t) => t.commercialId === CURRENT_COMMERCIAL.id)) {
      if (results.filter((r) => r.sub === 'Tâche').length >= 3) break;
      if (t.titre.toLowerCase().includes(q)) {
        results.push({ id: `tac-${t.id}`, label: t.titre, sub: 'Tâche', href: `/amud/commercial/taches?open=${t.id}`, icon: 'assignment' });
      }
    }
    for (const c of loadLocalCentres()) {
      if (results.filter((r) => r.sub === 'Centre de formation').length >= 3) break;
      if (c.nom.toLowerCase().includes(q) || c.ville.toLowerCase().includes(q)) {
        results.push({ id: `centre-${c.id}`, label: c.nom, sub: 'Centre de formation', href: `/amud/commercial/centres/${c.id}`, icon: 'school' });
      }
    }
    for (const cand of getCandidatesForCommercial(CURRENT_COMMERCIAL.nom, loadLocalCandidates())) {
      if (results.filter((r) => r.sub === 'Candidat').length >= 3) break;
      if (cand.nom.toLowerCase().includes(q) || cand.posteRecherche.toLowerCase().includes(q) || cand.ville.toLowerCase().includes(q)) {
        results.push({ id: `cand-${cand.id}`, label: cand.nom, sub: 'Candidat', href: `/amud/commercial/candidats/${cand.id}`, icon: 'person' });
      }
    }

    return results.slice(0, 8);
  }, [query]);
}

export function CommercialShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  const results = useCommercialSearchResults(query);

  useGlobalSearchShortcut(() => {
    setSearchOpen(true);
    searchInputRef.current?.focus();
  });

  useEffect(() => {
    setSearchOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function goToResult(href: string) {
    setSearchOpen(false);
    setQuery('');
    router.push(href);
  }

  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';

  return (
    <ToastProvider>
    <div className="amud-ops-scale flex min-h-screen bg-amud-background text-amud-on-background">
      <aside
        className={`group fixed left-0 top-0 z-40 hidden h-screen flex-col gap-base border-r border-amud-outline-variant bg-amud-surface-container px-md py-lg transition-[width] duration-200 ease-in-out md:flex ${
          collapsed ? 'md:w-20 md:px-2 md:hover:w-64 md:hover:px-md' : 'md:w-64'
        }`}
      >
        <div className="mb-xl flex h-16 items-center gap-md px-sm">
          <img src="/assets/images/logo.png" alt="" className="h-10 w-10 shrink-0 object-contain" />
          <div className={hiddenWhenCollapsed}>
            <h1 className="text-title-lg font-black text-amud-primary">Amud Skills</h1>
            <p className="text-label-sm text-amud-on-surface-variant">Espace Commercial</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-sm overflow-y-auto">
          {NAV.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isNavActive(pathname, item.href, item.href === '/amud/commercial')}
              collapsed={collapsed}
            />
          ))}
        </div>

        <div className="flex flex-col gap-sm border-t border-amud-outline-variant pt-4">
          <Link
            href="/amud"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-label-md text-amud-on-surface-variant transition-colors hover:bg-amud-surface-variant"
            title={collapsed ? "Changer d'espace" : undefined}
          >
            <span className="material-symbols-outlined shrink-0">apps</span>
            <span className={collapsed ? 'md:hidden md:group-hover:inline' : ''}>Changer d&apos;espace</span>
          </Link>
        </div>
      </aside>

      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-amud-outline-variant/40 bg-amud-surface/90 px-md backdrop-blur-md md:px-lg">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:flex"
              aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
              aria-pressed={collapsed}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex min-w-0 items-center gap-sm md:hidden">
              <img src="/assets/images/logo.png" alt="" className="h-8 w-8 shrink-0 object-contain" />
              <span className="truncate text-title-lg font-black text-amud-primary">Amud Skills</span>
            </div>
          </div>
          <GlobalSearch
            query={query}
            onQueryChange={setQuery}
            results={results}
            onSelect={goToResult}
            open={searchOpen}
            onOpenChange={setSearchOpen}
            inputRef={searchInputRef}
            placeholder="Rechercher…"
            className="relative hidden w-64 md:block"
          />
          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <NotificationCenter
              key={`notif-${pathname}`}
              scope="commercial"
              buttonClassName="relative rounded-full p-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
              viewAllHref="/amud/commercial/notifications"
            />
            <DropdownMenu
              key={`profile-${pathname}`}
              header={
                <div>
                  <div className="text-label-md font-semibold text-amud-on-surface">{CURRENT_COMMERCIAL.nom}</div>
                  <div className="text-label-sm text-amud-on-surface-variant">Espace Commercial</div>
                </div>
              }
              body={
                <div className="flex flex-col">
                  <InlineLanguageThemeControls />
                  <div className="flex flex-col gap-sm border-t border-amud-outline-variant p-md">
                    <div className="text-label-sm text-amud-on-surface-variant">Notifications</div>
                    <div className="flex items-center justify-between">
                      <span className="text-label-md text-amud-on-surface">Par email</span>
                      <Toggle checked={emailNotif} onChange={setEmailNotif} size="sm" label="Notifications par email" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-label-md text-amud-on-surface">Push</span>
                      <Toggle checked={pushNotif} onChange={setPushNotif} size="sm" label="Notifications push" />
                    </div>
                  </div>
                </div>
              }
              trigger={({ open, toggle }) => (
                <button
                  onClick={toggle}
                  className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-amud-outline-variant bg-amud-primary-container text-sm font-bold text-white transition-opacity hover:opacity-90"
                  aria-label="Menu du compte"
                  aria-haspopup="menu"
                  aria-expanded={open}
                >
                  {CURRENT_COMMERCIAL.initiales}
                </button>
              )}
              items={[
                { label: 'Voir mon profil', icon: 'account_circle', href: '/amud/commercial/profile' },
                { label: 'Aide', icon: 'help' },
                { label: "Changer d'espace", icon: 'apps', href: '/amud' },
                { label: 'Déconnexion', icon: 'logout', href: '/amud', danger: true },
              ]}
            />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 p-md pb-24 md:p-lg md:pb-lg lg:p-margin-desktop">
          <DemoBanner />
          {children}
        </main>
      </div>

      <RoleBottomNav items={NAV} />
    </div>
    </ToastProvider>
  );
}
