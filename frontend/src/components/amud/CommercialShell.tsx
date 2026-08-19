'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { InertNavItem, NavItem, isNavActive } from '@/components/amud/ui';

/**
 * Coquille des 3 pages `/amud/commercial/*` — espace self-service d'un
 * commercial (doc19 espace_de_travail_quotidien_commercial.html,
 * doc8 mes_rendez_vous_crm_commercial_annotated.html, et la fusion
 * doc10/doc16 pour les contacts). Nav alignée sur doc8, la seule maquette
 * du lot construite explicitement pour le self-service (Overview/Calendar/
 * Companies/Contacts/Tasks) plutôt que sur le sidebar générique "Commercial
 * Agents" recopié par erreur dans doc19/doc10/doc16.
 */
const NAV = [
  { href: '/amud/commercial', icon: 'dashboard', label: 'Vue d’ensemble' },
  { href: '/amud/commercial/rendez-vous', icon: 'calendar_month', label: 'Calendrier' },
  { href: '/amud/commercial/contacts', icon: 'group', label: 'Contacts' },
];
const INERT = [
  { icon: 'domain', label: 'Entreprises' },
  { icon: 'assignment', label: 'Tâches' },
];

export function CommercialShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-amud-background text-amud-on-background">
      {navOpen ? (
        <div
          className="fixed inset-0 z-30 bg-amud-on-surface/40 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col gap-base border-r border-amud-outline-variant bg-amud-surface-container p-md py-lg transition-transform duration-200 ease-in-out md:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-xl flex items-center gap-md px-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amud-primary font-title-lg font-bold text-white">A</div>
          <div>
            <h1 className="text-title-lg font-black text-amud-primary">Amud Skills</h1>
            <p className="text-label-sm text-amud-on-surface-variant">Espace Commercial</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-sm overflow-y-auto">
          {NAV.map((item) => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isNavActive(pathname, item.href, item.href === '/amud/commercial')} />
          ))}
          {INERT.map((item) => (
            <InertNavItem key={item.label} icon={item.icon} label={item.label} />
          ))}
        </div>

        <div className="flex flex-col gap-sm border-t border-amud-outline-variant pt-4">
          <Link
            href="/amud"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-label-md text-amud-on-surface-variant transition-colors hover:bg-amud-surface-variant"
          >
            <span className="material-symbols-outlined">apps</span>
            Changer d&apos;espace
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-amud-outline-variant bg-amud-surface px-md md:px-lg">
          <button
            onClick={() => setNavOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:hidden"
            aria-label="Ouvrir le menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="relative hidden w-64 md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
            <input
              className="w-full rounded-lg border-none bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Rechercher…"
              aria-label="Rechercher"
              type="text"
            />
          </div>
          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <button className="relative rounded-full p-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amud-error" />
            </button>
            <button className="hidden rounded-full p-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary sm:block">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-amud-outline-variant bg-amud-primary-container flex items-center justify-center font-bold text-white text-sm">
              C
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 p-md md:p-lg lg:p-margin-desktop">{children}</main>
      </div>
    </div>
  );
}
