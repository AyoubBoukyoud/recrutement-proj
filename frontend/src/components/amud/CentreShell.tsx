'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { NavItem, isNavActive, useDropdown } from '@/components/amud/ui';
import { TrainingDemoToggle } from './TrainingDemoToggle';
import { DemoBanner } from './DemoBanner';
import { HeaderPreferences } from '@/components/shared/HeaderPreferences';
import { ToastProvider } from '@/components/amud/Toast';
import { RoleBottomNav } from '@/components/amud/RoleBottomNav';
import { useAuth } from '@/context/AuthContext';
import { isConnectedPath, UPCOMING_CENTRE_BASE, upcomingCentrePage } from '@/lib/amud/timetable/paths';
import { usePresentationAccess } from '@/lib/amud/useTrainingDemo';
import { useTimetableScope } from '@/lib/amud/timetable/useTimetable';

type CentreNavItem = {
  href: string;
  icon: string;
  label: string;
  group: string;
  /** Présent dans la barre de navigation basse mobile (les autres vont dans « Plus »). */
  inBottomNav?: boolean;
  bottomIcon?: string;
  bottomLabel?: string;
};

/**
 * Source unique des 15 entrées de l'espace Centre : sidebar desktop, barre
 * basse mobile et tiroir « Plus » sont dérivés du même tableau — exactement
 * comme `CompanyShell` le fait pour l'espace Entreprise, pour que passer
 * d'un espace à l'autre ne change ni la structure ni les gestes.
 */
const NAV: CentreNavItem[] = [
  { href: '/amud/centre/dashboard', icon: 'dashboard', label: 'Tableau de bord', group: '', inBottomNav: true, bottomLabel: 'Accueil' },
  { href: '/amud/centre/etudiants', icon: 'group', label: 'Étudiants', group: 'Pédagogie', inBottomNav: true },
  { href: '/amud/centre/groupes', icon: 'diversity_3', label: 'Groupes', group: 'Pédagogie' },
  { href: '/amud/centre/formations', icon: 'menu_book', label: 'Formations', group: 'Pédagogie' },
  { href: '/amud/centre/enseignants', icon: 'cast_for_education', label: 'Enseignants', group: 'Pédagogie' },
  { href: '/amud/centre/planning', icon: 'calendar_month', label: 'Planning', group: 'Pédagogie', inBottomNav: true },
  { href: '/amud/centre/salles', icon: 'meeting_room', label: 'Salles', group: 'Pédagogie' },
  { href: '/amud/centre/paiements-etudiants', icon: 'payments', label: 'Paiements étudiants', group: 'Finances', inBottomNav: true, bottomLabel: 'Paiements' },
  { href: '/amud/centre/presences', icon: 'fact_check', label: 'Présences', group: 'Pédagogie' },
  { href: '/amud/centre/remuneration', icon: 'account_balance_wallet', label: 'Rémunération', group: 'Finances' },
  { href: '/amud/centre/tarifs', icon: 'sell', label: 'Tarifs', group: 'Finances' },
  { href: '/amud/centre/leads', icon: 'person_add', label: 'Leads', group: 'Développement' },
  { href: '/amud/centre/site', icon: 'language', label: 'Site public', group: 'Développement' },
  { href: '/amud/centre/statistiques', icon: 'bar_chart', label: 'Statistiques', group: 'Développement' },
  { href: '/amud/centre/profil', icon: 'storefront', label: 'Profil du centre', group: 'Centre' },
  { href: '/amud/centre/parametres', icon: 'settings', label: 'Paramètres', group: 'Centre' },
];

const PREVIEW_GROUP = 'Aperçus · données fictives';
const UPCOMING_GROUP = 'Bientôt disponible';
const GROUP_LABELS = ['Pédagogie', 'Finances', 'Développement', 'Centre', PREVIEW_GROUP, UPCOMING_GROUP];

/** Outside the browser demo, pages not yet backed by the API are grouped apart so they are not mistaken for live data. */
function sidebarGroups(items: CentreNavItem[]) {
  return [{ label: '', items: items.filter((i) => i.group === '') }].concat(
    GROUP_LABELS.map((label) => ({ label, items: items.filter((i) => i.group === label) })),
  ).filter((group) => group.items.length);
}

const CentrePrototypeShell = dynamic(() => import('./CentrePrototypeShell').then((module) => module.CentrePrototypeShell));

export function CentreShell({ children }: { children: ReactNode }) {
  const { enabled } = useTimetableScope();
  return enabled ? <CentreShellFrame>{children}</CentreShellFrame> : <CentrePrototypeShell>{children}</CentrePrototypeShell>;
}

/** Shared navigation, without importing any localStorage demo data. */
export function CentreShellFrame({ children, centerName, search, notifications, profileControls }: {
  children: ReactNode;
  centerName?: string;
  search?: ReactNode;
  notifications?: ReactNode;
  profileControls?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const timetable = useTimetableScope();
  const displayedCenterName = (timetable.enabled ? timetable.center?.name : centerName) ?? (timetable.enabled ? 'Emploi du temps' : 'Espace Centre');
  const [collapsed, setCollapsed] = useState(false);
  const profileMenu = useDropdown<HTMLDivElement>();
  useEffect(() => {
    profileMenu.setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const presentation = usePresentationAccess();
  // Without a presentation grant, unfinished modules open their "Bientôt disponible" page (the server enforces the same).
  const nav = timetable.demo ? NAV : NAV.map((item) => {
    if (isConnectedPath(item.href, false)) return item;
    if (presentation) return { ...item, group: PREVIEW_GROUP };
    const upcoming = upcomingCentrePage(item.href);
    return { ...item, group: UPCOMING_GROUP, href: upcoming ? `${UPCOMING_CENTRE_BASE}/${upcoming.slug}` : item.href };
  });
  const navItems = timetable.enabled ? nav.map((item) => ({ ...item, prefetch: isConnectedPath(item.href, timetable.demo) ? undefined : false })) : nav;
  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';

  return (
    <ToastProvider>
      <div className="amud-ops-scale flex min-h-screen bg-amud-background text-amud-on-surface">
        <aside
          className={`group fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-amud-outline-variant bg-amud-surface-container-lowest transition-[width] duration-200 ease-in-out md:flex ${
            collapsed ? 'md:w-20 md:hover:w-64' : 'md:w-64'
          }`}
        >
          <div className={`flex items-center gap-sm border-b border-amud-outline-variant px-lg py-2.5 ${collapsed ? 'md:px-md' : ''}`}>
            <Image src="/assets/images/logo-mark.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />
            <div className={hiddenWhenCollapsed}>
              <h1 className="text-title-lg font-bold text-amud-primary">Amud Skills</h1>
              <p className="truncate text-label-sm text-amud-on-surface-variant">{displayedCenterName}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md" aria-label="Navigation de l’espace Centre">
            <div className="flex flex-col gap-md">
              {sidebarGroups(nav).map((group) => (
                <div key={group.label || 'root'}>
                  {group.label ? (
                    <div className={`px-4 pb-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline ${hiddenWhenCollapsed}`}>{group.label}</div>
                  ) : null}
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        prefetch={timetable.enabled && !isConnectedPath(item.href, timetable.demo) ? false : undefined}
                        icon={item.icon}
                        label={item.label}
                        active={isNavActive(pathname, item.href, item.href === '/amud/centre/dashboard')}
                        collapsed={collapsed}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className={`border-t border-amud-outline-variant p-md ${collapsed ? 'md:px-sm' : ''}`} style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <Link
              href="/amud" prefetch={false}
              className="flex items-center justify-center gap-2 rounded-lg border border-amud-outline-variant px-3 py-2 text-label-sm font-medium text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
              title={collapsed ? "Changer d'espace" : undefined}
            >
              <span className="material-symbols-outlined text-[18px]">apps</span>
              <span className={collapsed ? 'md:hidden md:group-hover:inline' : ''}>Changer d&apos;espace</span>
            </Link>
          </div>
        </aside>

        <div className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
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
            </div>
            {search}
            <div className="ml-auto flex items-center gap-sm">
              <TrainingDemoToggle />
              <HeaderPreferences />
              {notifications}
              <div ref={profileMenu.ref} className="relative">
                <button onClick={() => profileMenu.setOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white transition-opacity hover:opacity-90" aria-label="Menu du compte" aria-haspopup="menu" aria-expanded={profileMenu.open}>
                  {displayedCenterName.charAt(0)}
                </button>
                {profileMenu.open ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                    <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm">
                      <div className="text-label-md font-semibold text-amud-on-surface">{displayedCenterName}</div>
                      <div className="text-label-sm text-amud-on-surface-variant">{timetable.demo ? 'Démonstration · données fictives' : timetable.enabled ? "Planning connecté · accès vérifié par le serveur" : "Simulation — aucune vraie authentification"}</div>
                    </div>
                    {profileControls}
                    <div className="flex flex-col border-t border-amud-outline-variant py-1">
                      <Link href="/amud/centre/parametres" prefetch={false} onClick={() => profileMenu.setOpen(false)} className="flex items-center gap-sm px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">settings</span> Paramètres
                      </Link>
                      <button type="button" className="flex items-center gap-sm px-md py-sm text-left text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">help</span> Aide
                      </button>
                      <Link href="/amud" prefetch={false} onClick={() => profileMenu.setOpen(false)} className="flex items-center gap-sm px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">apps</span> Changer d&apos;espace
                      </Link>
                      {user?.role === 'centre' && <button type="button" onClick={() => { logout(); router.replace('/auth-phone?intent=training_center'); }} className="flex items-center gap-sm px-md py-sm text-left text-label-md text-amud-error transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">logout</span> Déconnexion
                      </button>}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <main key={pathname} className="min-w-0 flex-1 animate-amud-rise-in p-margin-mobile pb-24 md:p-margin-desktop md:pb-margin-desktop">
            {timetable.enabled && timetable.demo && <DemoBanner />}
            {children}
          </main>
        </div>

        <RoleBottomNav items={navItems} />
      </div>
    </ToastProvider>
  );
}
