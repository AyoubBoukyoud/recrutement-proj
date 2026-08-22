'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { InertNavItem, NavItem, isNavActive } from '@/components/amud/ui';
import { DemoBanner } from '@/components/amud/DemoBanner';

/** Coquille de `/amud/candidate` (doc4: tableau_de_bord_candidat_amud_skills.html). */
const NAV = [{ href: '/amud/candidate', icon: 'dashboard', label: 'Tableau de bord' }];
const INERT: { icon: string; label: string; badge?: number }[] = [
  { icon: 'person', label: 'Mon profil' },
  { icon: 'description', label: 'Mon CV' },
  { icon: 'bolt', label: 'Mes compétences' },
  { icon: 'work', label: "Offres d'emploi" },
  { icon: 'assignment_turned_in', label: 'Mes candidatures' },
  { icon: 'favorite', label: 'Mes favoris' },
  { icon: 'mail', label: 'Messages', badge: 3 },
  { icon: 'notifications', label: 'Notifications' },
];

export function CandidateShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-amud-surface text-amud-on-surface">
      <aside className="left-0 z-40 hidden h-full w-64 flex-col border-r border-amud-outline-variant bg-amud-surface-container-low md:flex">
        <div className="flex h-20 items-center border-b border-amud-outline-variant/50 px-lg">
          <span className="text-headline-md font-bold text-amud-primary">Pillar Talent</span>
        </div>
        <div className="flex flex-1 flex-col space-y-base overflow-y-auto px-md py-lg">
          <div className="mb-xl flex items-center gap-md px-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white shadow-sm">M</div>
            <div>
              <h2 className="text-title-lg text-amud-on-surface">Mohamed</h2>
              <p className="text-label-sm text-amud-on-surface-variant">Candidat Premium</p>
            </div>
          </div>
          <button className="mb-6 w-full rounded-lg bg-amud-primary px-4 py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-container">
            Compléter mon profil
          </button>
          <nav className="flex-1 space-y-1">
            {NAV.map((item) => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isNavActive(pathname, item.href, true)} />
            ))}
            {INERT.map((item) => (
              <InertNavItem key={item.label} icon={item.icon} label={item.label} badge={item.badge} />
            ))}
          </nav>
          <div className="mt-auto space-y-1 border-t border-amud-outline-variant/50 pt-4">
            <InertNavItem icon="help" label="Aide & Support" />
            <InertNavItem icon="logout" label="Déconnexion" />
          </div>
        </div>
      </aside>

      <main className="flex h-full flex-1 flex-col overflow-hidden bg-amud-background">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-amud-outline-variant/50 bg-amud-surface px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center gap-3 md:hidden">
            <span className="text-title-lg font-bold text-amud-primary">Pillar Talent</span>
          </div>
          <div className="hidden max-w-md flex-1 md:flex">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
              <input
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md text-amud-on-surface outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
                placeholder="Rechercher des offres, entreprises…"
                aria-label="Rechercher des offres, entreprises"
                type="text"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button className="relative p-2 text-amud-on-surface-variant transition-colors hover:text-amud-primary">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amud-secondary" />
            </button>
            <div className="hidden h-8 w-px bg-amud-outline-variant/50 md:block" />
            <button className="flex items-center gap-2">
              <div className="h-8 w-8 overflow-hidden rounded-full border border-amud-outline-variant bg-amud-primary-container flex items-center justify-center text-white text-xs font-bold">M</div>
              <span className="material-symbols-outlined hidden text-amud-on-surface-variant md:block">expand_more</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-margin-mobile pb-32 md:p-margin-desktop md:pb-margin-desktop">
          <div className="mx-auto max-w-[1200px] space-y-xl">
            <DemoBanner />
            {children}
          </div>
        </div>
      </main>

      <nav
        className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-amud-outline-variant/50 bg-amud-surface px-4 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {[
          { icon: 'home', label: 'Accueil', active: true },
          { icon: 'search', label: 'Emplois' },
          { icon: 'description', label: 'Candidatures' },
          { icon: 'chat', label: 'Messages' },
          { icon: 'person', label: 'Profil' },
        ].map((item) => (
          <span key={item.label} className={`flex flex-col items-center justify-center ${item.active ? 'font-bold text-amud-primary' : 'text-amud-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              {item.icon}
            </span>
            <span className="mt-1 text-[10px]">{item.label}</span>
          </span>
        ))}
      </nav>
    </div>
  );
}
