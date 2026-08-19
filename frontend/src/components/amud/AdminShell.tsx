'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { InertNavItem, NavItem, isNavActive } from '@/components/amud/ui';

/**
 * Coquille commune aux 13 pages admin du module `/amud` (portées depuis les
 * maquettes Amud Skills — tableau de bord, utilisateurs, entreprises,
 * offres, candidatures, commerciaux, objectifs, activités, rôles &
 * permissions, journal, paramètres). Le pathname pilote l'état actif du
 * menu, comme le fait déjà `src/app/admin/layout.tsx` pour la console
 * existante — dont ce module reste indépendant.
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

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-amud-background text-amud-on-surface">
      {navOpen ? (
        <div
          className="fixed inset-0 z-30 bg-amud-on-surface/40 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-amud-outline-variant bg-amud-surface-container-lowest transition-transform duration-200 ease-in-out md:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-sm border-b border-amud-outline-variant p-lg">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-amud-primary-container">
            <img src="/assets/images/logo-mark.png" alt="Amud Skills" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-title-lg font-bold text-amud-primary">Amud Skills</h1>
            <p className="text-label-sm text-amud-on-surface-variant">Enterprise Admin</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-sm py-md">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.label ? (
                <div className="px-md py-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline">{group.label}</div>
              ) : null}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item, ii) =>
                  item.href ? (
                    <NavItem key={ii} href={item.href} icon={item.icon} label={item.label} active={isNavActive(pathname, item.href, item.href === '/amud/admin')} />
                  ) : (
                    <InertNavItem key={ii} icon={item.icon} label={item.label} />
                  ),
                )}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-amud-outline-variant p-md" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">A</div>
            <div className="min-w-0">
              <div className="truncate text-label-md font-bold text-amud-on-surface">Admin Pillar</div>
              <div className="truncate text-label-sm text-amud-on-surface-variant">Gestionnaire Principal</div>
            </div>
          </div>
          <Link
            href="/amud"
            className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-amud-outline-variant px-3 py-2 text-label-sm font-medium text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
          >
            <span className="material-symbols-outlined text-[18px]">apps</span>
            Changer d&apos;espace
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-amud-outline-variant bg-amud-surface px-gutter">
          <button
            onClick={() => setNavOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:hidden"
            aria-label="Ouvrir le menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="relative hidden w-72 md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-amud-primary"
              placeholder="Rechercher…"
              type="text"
            />
          </div>
          <div className="ml-auto flex items-center gap-sm">
            <button className="rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary">
              <span className="material-symbols-outlined">help</span>
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">A</div>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-margin-mobile md:p-margin-desktop">{children}</main>
      </div>
    </div>
  );
}
