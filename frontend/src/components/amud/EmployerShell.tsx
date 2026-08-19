'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { InertNavItem, NavItem, isNavActive } from '@/components/amud/ui';

/** Coquille de `/amud/employer` (doc3: tableau_de_bord_employeur_desktop_restored.html). */
const NAV = [{ href: '/amud/employer', icon: 'dashboard', label: 'Dashboard' }];
const INERT: { icon: string; label: string; badge?: number }[] = [
  { icon: 'search', label: 'Search' },
  { icon: 'business_center', label: 'Jobs' },
  { icon: 'star', label: 'Shortlist' },
  { icon: 'group', label: 'Recruitment' },
  { icon: 'mail', label: 'Messages', badge: 3 },
];

export function EmployerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-amud-background text-amud-on-surface">
      {navOpen ? (
        <div
          className="fixed inset-0 z-30 bg-amud-on-surface/40 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col space-y-sm overflow-y-auto border-r border-amud-outline-variant bg-amud-surface-container-lowest p-md transition-transform duration-200 ease-in-out md:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
          {INERT.map((item) => (
            <InertNavItem key={item.label} icon={item.icon} label={item.label} badge={item.badge} />
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
          <button
            onClick={() => setNavOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high hover:text-amud-primary md:hidden"
            aria-label="Ouvrir le menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="hidden max-w-xl flex-1 items-center md:flex">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-[20px] text-amud-on-surface-variant">search</span>
              <input
                className="w-full rounded-full border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-xl pr-md text-label-md text-amud-on-surface outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
                placeholder="Quick search for candidates or jobs…"
                aria-label="Quick search for candidates or jobs"
                type="text"
              />
            </div>
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high md:hidden"
            aria-label="Rechercher"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <div className="ml-auto flex items-center gap-sm md:gap-lg">
            <button className="relative rounded-full p-sm transition-colors hover:bg-amud-surface-container-high">
              <span className="material-symbols-outlined text-amud-on-surface-variant">notifications</span>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amud-secondary" />
            </button>
            <div className="hidden h-8 w-[1px] bg-amud-outline-variant sm:block" />
            <button className="flex items-center gap-xs whitespace-nowrap rounded-lg bg-amud-primary px-sm py-sm font-label-md text-white shadow-sm transition-all hover:brightness-110 active:scale-95 sm:px-md">
              <span className="material-symbols-outlined text-[18px] text-white">add</span>
              <span className="hidden sm:inline">New Job</span>
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-7xl space-y-xl p-margin-mobile md:p-margin-desktop">{children}</div>
      </main>
    </div>
  );
}
