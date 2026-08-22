'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { InertNavItem, NavItem, isNavActive } from '@/components/amud/ui';
import { ToastProvider } from '@/components/amud/Toast';
import { DemoBanner } from '@/components/amud/DemoBanner';
import { ADMIN_ALERTS } from '@/data/amud/alerts';
import { commerciaux as commerciauxSeed } from '@/data/amud/commerciaux';
import { candidaturesSeed } from '@/data/amud/candidatures';
import { entreprisesSeed } from '@/data/amud/entreprises';
import { offresSeed } from '@/data/amud/offres';
import { utilisateursSeed } from '@/data/amud/utilisateurs';
import { loadLocalCommerciaux } from '@/lib/amud/localCommerciaux';
import { loadLocalCandidats } from '@/lib/amud/localCandidatures';
import { loadLocalEntreprises } from '@/lib/amud/localEntreprises';
import { loadLocalOffres } from '@/lib/amud/localOffres';
import { loadLocalUtilisateurs } from '@/lib/amud/localUtilisateurs';

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
const NAV_GROUPS: {
  label: string;
  items: { href?: string; icon: string; label: string }[];
}[] = [
  { label: '', items: [{ href: '/amud/admin', icon: 'dashboard', label: 'Tableau de bord' }] },
  {
    label: 'Utilisateurs',
    items: [
      { icon: 'person', label: 'Candidats' },
      { icon: 'badge', label: 'Recruteurs' },
      { href: '/amud/admin/commerciaux', icon: 'support_agent', label: 'Commerciaux' },
    ],
  },
  {
    label: 'Recrutement',
    items: [
      { href: '/amud/admin/offres', icon: 'work', label: 'Offres' },
      { href: '/amud/admin/candidatures', icon: 'assignment', label: 'Candidatures' },
      { href: '/amud/admin/entreprises', icon: 'domain', label: 'Entreprises' },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { href: '/amud/admin/objectifs', icon: 'target', label: 'Objectifs' },
      { href: '/amud/admin/activites', icon: 'call', label: 'Activités' },
    ],
  },
  {
    label: 'Sécurité',
    items: [
      { href: '/amud/admin/roles-permissions', icon: 'admin_panel_settings', label: 'Rôles & permissions' },
      { href: '/amud/admin/journal-activite', icon: 'history', label: 'Journal système' },
    ],
  },
  {
    label: 'Configuration',
    items: [{ href: '/amud/admin/parametres', icon: 'settings', label: 'Paramètres généraux' }],
  },
];

type SearchResult = { id: string; label: string; sub: string; href: string; icon: string };

function useGlobalSearchResults(query: string): SearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: SearchResult[] = [];

    for (const c of [...commerciauxSeed, ...loadLocalCommerciaux()]) {
      if (results.filter((r) => r.sub === 'Commercial').length >= 3) break;
      const nom = `${c.prenom} ${c.nom}`;
      if (nom.toLowerCase().includes(q)) {
        results.push({ id: `com-${c.id}`, label: nom, sub: 'Commercial', href: `/amud/admin/commerciaux/${c.id}`, icon: 'support_agent' });
      }
    }
    for (const cand of [...Object.values(candidaturesSeed).flat(), ...loadLocalCandidats()]) {
      if (results.filter((r) => r.sub === 'Candidat').length >= 3) break;
      if (cand.nom.toLowerCase().includes(q) || cand.poste.toLowerCase().includes(q)) {
        results.push({ id: `cand-${cand.id}`, label: cand.nom, sub: `Candidat · ${cand.poste}`, href: `/amud/admin/candidatures?q=${encodeURIComponent(cand.nom)}`, icon: 'person' });
      }
    }
    for (const o of [...offresSeed, ...loadLocalOffres()]) {
      if (results.filter((r) => r.sub === 'Offre').length >= 3) break;
      if (o.titre.toLowerCase().includes(q) || o.entreprise.toLowerCase().includes(q)) {
        results.push({ id: `off-${o.id}`, label: o.titre, sub: `Offre · ${o.entreprise}`, href: '/amud/admin/offres', icon: 'work' });
      }
    }
    for (const e of [...entreprisesSeed, ...loadLocalEntreprises()]) {
      if (results.filter((r) => r.sub === 'Entreprise').length >= 3) break;
      if (e.nom.toLowerCase().includes(q)) {
        results.push({ id: `ent-${e.id}`, label: e.nom, sub: 'Entreprise', href: `/amud/admin/entreprises?q=${encodeURIComponent(e.nom)}`, icon: 'domain' });
      }
    }
    for (const u of [...utilisateursSeed, ...loadLocalUtilisateurs()]) {
      if (results.filter((r) => r.sub === 'Utilisateur').length >= 3) break;
      if (u.nom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
        results.push({ id: `usr-${u.id}`, label: u.nom, sub: `Utilisateur · ${u.role}`, href: `/amud/admin/utilisateurs?q=${encodeURIComponent(u.nom)}`, icon: 'group' });
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
  const [navOpen, setNavOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  // Rail réduite (icônes seules) sur desktop, dépliée au survol — indépendante
  // du tiroir mobile `navOpen` ci-dessus, qui reste un panneau plein écran.
  const [collapsed, setCollapsed] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const results = useGlobalSearchResults(query);
  const totalAlerts = ADMIN_ALERTS.reduce((s, a) => s + a.count, 0);
  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';

  useEffect(() => {
    setNavOpen(false);
    setBellOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function goTo(href: string) {
    setSearchOpen(false);
    setQuery('');
    router.push(href);
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-amud-background text-amud-on-surface">
        {navOpen ? (
          <div
            className="fixed inset-0 z-30 bg-amud-on-surface/40 md:hidden"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
        ) : null}
        <aside
          className={`group fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-amud-outline-variant bg-amud-surface-container-lowest transition-[width,transform] duration-200 ease-in-out md:translate-x-0 ${
            navOpen ? 'translate-x-0' : '-translate-x-full'
          } ${collapsed ? 'md:w-20 md:hover:w-64' : 'md:w-64'}`}
        >
          <div className={`flex items-center gap-sm border-b border-amud-outline-variant p-lg ${collapsed ? 'md:px-md' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-amud-primary-container">
              <img src="/assets/images/logo-mark.png" alt="Amud Skills" className="h-full w-full object-cover" />
            </div>
            <div className={hiddenWhenCollapsed}>
              <h1 className="text-title-lg font-bold text-amud-primary">Amud Skills</h1>
              <p className="text-label-sm text-amud-on-surface-variant">Enterprise Admin</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md">
            {NAV_GROUPS.map((group, gi) => (
              <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
                {group.label ? (
                  <div className={`px-md py-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline ${hiddenWhenCollapsed}`}>
                    {group.label}
                  </div>
                ) : null}
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item, ii) =>
                    item.href ? (
                      <NavItem
                        key={ii}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        active={isNavActive(pathname, item.href, item.href === '/amud/admin')}
                        collapsed={collapsed}
                      />
                    ) : (
                      <InertNavItem key={ii} icon={item.icon} label={item.label} collapsed={collapsed} />
                    ),
                  )}
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
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-amud-outline-variant bg-amud-surface px-gutter">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNavOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:hidden"
                aria-label="Ouvrir le menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:flex"
                aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
                aria-pressed={collapsed}
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
            <div ref={searchRef} className="relative hidden w-72 md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                placeholder="Rechercher un candidat, une offre, une entreprise…"
                type="text"
              />
              {searchOpen && query.trim().length >= 2 ? (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                  {results.length === 0 ? (
                    <p className="p-md text-label-sm text-amud-on-surface-variant">Aucun résultat pour « {query} ».</p>
                  ) : (
                    results.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => goTo(r.href)}
                        className="flex w-full items-center gap-sm px-md py-sm text-left transition-colors hover:bg-amud-surface-container-low"
                      >
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
            <div className="ml-auto flex items-center gap-sm">
              <div ref={bellRef} className="relative">
                <button
                  onClick={() => setBellOpen((v) => !v)}
                  className="relative rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
                  aria-label="Notifications"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {totalAlerts > 0 ? (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] animate-pulse items-center justify-center rounded-full bg-amud-secondary px-1 text-[10px] font-bold text-white">
                      {totalAlerts}
                    </span>
                  ) : null}
                </button>
                {bellOpen ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                    <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md font-semibold text-amud-on-surface">Alertes requises</div>
                    <div className="flex flex-col">
                      {ADMIN_ALERTS.map((a) => (
                        <Link
                          key={a.id}
                          href={a.href}
                          onClick={() => setBellOpen(false)}
                          className="flex items-center justify-between px-md py-sm transition-colors hover:bg-amud-surface-container-low"
                        >
                          <span className="flex items-center gap-sm text-body-md text-amud-on-surface">
                            <span className={`h-2 w-2 rounded-full ${a.dot}`} />
                            {a.label}
                          </span>
                          <span className="rounded-full bg-amud-error-container px-2 py-1 text-label-sm text-amud-on-error-container">{a.count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <button className="rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary" aria-label="Aide">
                <span className="material-symbols-outlined">help</span>
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">A</div>
            </div>
          </header>
          <main key={pathname} className="min-w-0 flex-1 animate-amud-rise-in p-margin-mobile md:p-margin-desktop">
            <DemoBanner />
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
