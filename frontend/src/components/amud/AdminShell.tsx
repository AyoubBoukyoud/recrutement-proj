'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { DropdownMenu, NavItem, isNavActive } from '@/components/amud/ui';
import { InlineLanguageThemeControls } from '@/components/amud/HeaderLanguageThemeControls';
import { ToastProvider } from '@/components/amud/Toast';
import { DemoBanner } from '@/components/amud/DemoBanner';
import { GlobalSearch, useGlobalSearchShortcut, type GlobalSearchResult } from '@/components/amud/GlobalSearch';
import { NotificationCenter } from '@/components/amud/NotificationCenter';
import { RoleBottomNav, type RoleNavItem } from '@/components/amud/RoleBottomNav';
import { loadLocalCommerciaux } from '@/lib/amud/localCommerciaux';
import { loadLocalApplications } from '@/lib/amud/localApplications';
import { loadLocalEntreprises } from '@/lib/amud/localEntreprises';
import { loadLocalOffres } from '@/lib/amud/localOffres';
import { loadLocalUtilisateurs } from '@/lib/amud/localUtilisateurs';
import { loadLocalCentres } from '@/lib/amud/localCentres';

/**
 * Coquille commune aux 13 pages admin du module `/amud` (portées depuis les
 * maquettes Amud Skills — tableau de bord, utilisateurs, entreprises,
 * offres, candidatures, commerciaux, objectifs, activités, rôles &
 * permissions, journal, paramètres). Le pathname pilote l'état actif du
 * menu, comme le fait déjà `src/app/admin/layout.tsx` pour la console
 * existante — dont ce module reste indépendant.
 *
 * Porte aussi le `ToastProvider` (notifications) et la cloche/recherche du
 * header, tous deux décoratifs à l'origine.
 */
/**
 * Source unique des entrées admin : sidebar desktop, barre basse mobile et
 * tiroir « Plus » sont dérivés du même tableau (`RoleBottomNav`), comme le
 * font déjà `CentreShell`/`StudentShell`/`TeacherShell`/`CompanyShell` — pour
 * que la navigation mobile ne soit plus un tiroir plein écran différent ici.
 */
const NAV: RoleNavItem[] = [
  { href: '/amud/admin', icon: 'dashboard', label: 'Tableau de bord', group: '', inBottomNav: true, bottomLabel: 'Accueil' },
  { href: '/amud/admin/analytics', icon: 'analytics', label: 'Analytique', group: '' },
  { href: '/amud/admin/candidats', icon: 'person', label: 'Candidats', group: 'Utilisateurs' },
  { href: '/amud/admin/recruteurs', icon: 'badge', label: 'Recruteurs', group: 'Utilisateurs' },
  { href: '/amud/admin/commerciaux', icon: 'support_agent', label: 'Commerciaux', group: 'Utilisateurs' },
  { href: '/amud/admin/offres', icon: 'work', label: 'Offres', group: 'Recrutement', inBottomNav: true },
  { href: '/amud/admin/candidatures', icon: 'assignment', label: 'Candidatures', group: 'Recrutement', inBottomNav: true },
  { href: '/amud/admin/entreprises', icon: 'domain', label: 'Entreprises', group: 'Recrutement', inBottomNav: true },
  { href: '/amud/admin/objectifs', icon: 'target', label: 'Objectifs', group: 'Commercial' },
  { href: '/amud/admin/activites', icon: 'call', label: 'Activités', group: 'Commercial' },
  { href: '/amud/admin/centres', icon: 'school', label: 'Centres de formation', group: 'Centres de formation' },
  { href: '/amud/admin/roles-permissions', icon: 'admin_panel_settings', label: 'Rôles & permissions', group: 'Sécurité' },
  { href: '/amud/admin/journal-activite', icon: 'history', label: 'Journal système', group: 'Sécurité' },
  { href: '/amud/admin/parametres', icon: 'settings', label: 'Paramètres généraux', group: 'Configuration' },
];

const GROUP_LABELS = ['Utilisateurs', 'Recrutement', 'Commercial', 'Centres de formation', 'Sécurité', 'Configuration'];
const SIDEBAR_GROUPS = [{ label: '', items: NAV.filter((i) => i.group === '') }].concat(
  GROUP_LABELS.map((label) => ({ label, items: NAV.filter((i) => i.group === label) })),
);

function useGlobalSearchResults(query: string): GlobalSearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: GlobalSearchResult[] = [];

    for (const c of loadLocalCommerciaux()) {
      if (results.filter((r) => r.sub === 'Commercial').length >= 3) break;
      const nom = `${c.prenom} ${c.nom}`;
      if (nom.toLowerCase().includes(q)) {
        results.push({ id: `com-${c.id}`, label: nom, sub: 'Commercial', href: `/amud/admin/commerciaux/${c.id}`, icon: 'support_agent' });
      }
    }
    for (const app of loadLocalApplications()) {
      if (results.filter((r) => r.sub === 'Candidature').length >= 3) break;
      if (app.candidateNom.toLowerCase().includes(q) || app.offerTitre.toLowerCase().includes(q)) {
        results.push({ id: `cand-${app.id}`, label: app.candidateNom, sub: `Candidature · ${app.offerTitre}`, href: `/amud/admin/candidatures?q=${encodeURIComponent(app.candidateNom)}`, icon: 'person' });
      }
    }
    for (const o of loadLocalOffres()) {
      if (results.filter((r) => r.sub === 'Offre').length >= 3) break;
      if (o.titre.toLowerCase().includes(q) || o.entreprise.toLowerCase().includes(q)) {
        results.push({ id: `off-${o.id}`, label: o.titre, sub: `Offre · ${o.entreprise}`, href: '/amud/admin/offres', icon: 'work' });
      }
    }
    for (const e of loadLocalEntreprises()) {
      if (results.filter((r) => r.sub === 'Entreprise').length >= 3) break;
      if (e.nom.toLowerCase().includes(q)) {
        results.push({ id: `ent-${e.id}`, label: e.nom, sub: 'Entreprise', href: `/amud/admin/entreprises?q=${encodeURIComponent(e.nom)}`, icon: 'domain' });
      }
    }
    for (const u of loadLocalUtilisateurs()) {
      if (results.filter((r) => r.sub === 'Utilisateur').length >= 3) break;
      if (u.nom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
        results.push({ id: `usr-${u.id}`, label: u.nom, sub: `Utilisateur · ${u.role}`, href: `/amud/admin/utilisateurs?q=${encodeURIComponent(u.nom)}`, icon: 'group' });
      }
    }
    for (const c of loadLocalCentres()) {
      if (results.filter((r) => r.sub === 'Centre de formation').length >= 3) break;
      if (c.nom.toLowerCase().includes(q) || c.ville.toLowerCase().includes(q) || c.telephone.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.contactNom.toLowerCase().includes(q) || c.assignedCommercialNom.toLowerCase().includes(q)) {
        results.push({ id: `centre-${c.id}`, label: c.nom, sub: 'Centre de formation', href: `/amud/admin/centres/${c.id}`, icon: 'school' });
      }
    }
    return results.slice(0, 8);
  }, [query]);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const results = useGlobalSearchResults(query);
  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';

  useGlobalSearchShortcut(() => {
    setSearchOpen(true);
    searchInputRef.current?.focus();
  });

  useEffect(() => {
    setSearchOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function goTo(href: string) {
    setSearchOpen(false);
    setQuery('');
    router.push(href);
  }

  return (
    <ToastProvider>
      <div className="amud-ops-scale flex min-h-screen bg-amud-background text-amud-on-surface">
        <aside
          className={`group fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-amud-outline-variant bg-amud-surface-container-lowest transition-[width] duration-200 ease-in-out md:flex ${
            collapsed ? 'md:w-20 md:hover:w-64' : 'md:w-64'
          }`}
        >
          <div className={`flex items-center gap-sm border-b border-amud-outline-variant px-lg py-2.5 ${collapsed ? 'md:px-md' : ''}`}>
            <img src="/assets/images/logo.png" alt="" className="h-10 w-10 shrink-0 object-contain" />
            <div className={hiddenWhenCollapsed}>
              <h1 className="text-title-lg font-bold text-amud-primary">Amud Skills</h1>
              <p className="text-label-sm text-amud-on-surface-variant">Enterprise Admin</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md">
            {SIDEBAR_GROUPS.map((group, gi) => (
              <div key={group.label || 'root'} className={gi > 0 ? 'mt-4' : ''}>
                {group.label ? (
                  <div className={`px-md py-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline ${hiddenWhenCollapsed}`}>
                    {group.label}
                  </div>
                ) : null}
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      active={isNavActive(pathname, item.href, item.href === '/amud/admin')}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div
            className={`border-t border-amud-outline-variant p-md ${collapsed ? 'md:px-sm' : ''}`}
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
          >
            <div className={`flex items-center gap-3 rounded-lg p-2 ${collapsed ? 'md:justify-center' : ''}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">A</div>
              <div className={`min-w-0 ${hiddenWhenCollapsed}`}>
                <div className="truncate text-label-md font-bold text-amud-on-surface">Admin Pillar</div>
                <div className="truncate text-label-sm text-amud-on-surface-variant">Gestionnaire Principal</div>
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

        <div
          className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out ${
            collapsed ? 'md:ml-20' : 'md:ml-64'
          }`}
        >
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-amud-outline-variant/40 bg-amud-surface/90 px-gutter backdrop-blur-md">
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
                <span className="truncate text-title-lg font-bold text-amud-primary">Amud Skills</span>
              </div>
            </div>
            <GlobalSearch
              query={query}
              onQueryChange={setQuery}
              results={results}
              onSelect={goTo}
              open={searchOpen}
              onOpenChange={setSearchOpen}
              inputRef={searchInputRef}
              placeholder="Rechercher un candidat, une offre, une entreprise…"
            />
            <div className="ml-auto flex items-center gap-sm">
              <NotificationCenter key={`notif-${pathname}`} scope="admin" />
              <DropdownMenu
                key={`profile-${pathname}`}
                header={
                  <div>
                    <div className="text-label-md font-semibold text-amud-on-surface">Admin Pillar</div>
                    <div className="text-label-sm text-amud-on-surface-variant">Gestionnaire Principal</div>
                  </div>
                }
                body={<InlineLanguageThemeControls />}
                trigger={({ open, toggle }) => (
                  <button
                    onClick={toggle}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white transition-opacity hover:opacity-90"
                    aria-label="Menu du compte"
                    aria-haspopup="menu"
                    aria-expanded={open}
                  >
                    A
                  </button>
                )}
                items={[
                  { label: 'Paramètres', icon: 'settings', href: '/amud/admin/parametres' },
                  { label: 'Aide', icon: 'help' },
                  { label: "Changer d'espace", icon: 'apps', href: '/amud' },
                  { label: 'Déconnexion', icon: 'logout', href: '/amud', danger: true },
                ]}
              />
            </div>
          </header>
          <main key={pathname} className="min-w-0 flex-1 animate-amud-rise-in p-margin-mobile pb-24 md:p-margin-desktop">
            <DemoBanner />
            {children}
          </main>
        </div>

        <RoleBottomNav items={NAV} />
      </div>
    </ToastProvider>
  );
}
