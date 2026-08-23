'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { InertNavItem, NavItem, isNavActive, useDropdown } from '@/components/amud/ui';
import { ToastProvider } from '@/components/amud/Toast';
import { useCurrentCenter } from '@/lib/amud/currentCentre';
import { CENTER_ROLES, CENTER_ROLE_LABELS } from '@/data/amud/centerTypes';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { notificationsSeed } from '@/data/amud/notifications';
import { notifications as notificationsCollection, markNotificationRead, markAllNotificationsRead } from '@/lib/amud/storage/notify';
import { useCollection } from '@/lib/amud/storage/useCollection';

const NAV = [
  { href: '/amud/centre/dashboard', icon: 'dashboard', label: 'Tableau de bord' },
  { href: '/amud/centre/profil', icon: 'storefront', label: 'Profil du centre' },
  { href: '/amud/centre/formations', icon: 'menu_book', label: 'Formations' },
  { href: '/amud/centre/etudiants', icon: 'group', label: 'Étudiants' },
  { href: '/amud/centre/enseignants', icon: 'cast_for_education', label: 'Enseignants' },
  { href: '/amud/centre/groupes', icon: 'diversity_3', label: 'Groupes' },
  { href: '/amud/centre/planning', icon: 'calendar_month', label: 'Planning' },
  { href: '/amud/centre/presences', icon: 'fact_check', label: 'Présences' },
  { href: '/amud/centre/paiements-etudiants', icon: 'payments', label: 'Paiements étudiants' },
  { href: '/amud/centre/remuneration', icon: 'account_balance_wallet', label: 'Rémunération' },
  { href: '/amud/centre/tarifs', icon: 'sell', label: 'Tarifs' },
  { href: '/amud/centre/leads', icon: 'person_add', label: 'Leads' },
  { href: '/amud/centre/site', icon: 'language', label: 'Site public' },
];
const INERT = [{ icon: 'bar_chart', label: 'Statistiques' }, { icon: 'settings', label: 'Paramètres' }];

/**
 * Coquille de l'espace self-service `/amud/centre/*` (cahier des charges
 * §25-42), même architecture que `AdminShell`/`CommercialShell` : nav fixe,
 * header avec cloche (`scope:'centre'`), `ToastProvider`. Comme le reste du
 * module `/amud` n'a pas de vraie authentification, le sélecteur "Centre" +
 * "Rôle" dans le menu profil simule "je suis connecté à ce centre, avec ce
 * rôle" (`useCurrentCenter`) — indispensable ici puisque toutes les pages
 * ont besoin de savoir "mon" `centerId`, contrairement à Admin/Commercial
 * qui voient plusieurs centres à la fois.
 */
export function CentreShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const notifMenu = useDropdown<HTMLDivElement>();
  const profileMenu = useDropdown<HTMLDivElement>();

  const { centerId, role, setCenterId, setRole } = useCurrentCenter();
  const [centres] = useCollection(centresCollection, centresSeed);
  const currentCentre = useMemo(() => centres.find((c) => c.id === centerId), [centres, centerId]);

  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);
  const centreNotifications = useMemo(
    () => allNotifications.filter((n) => n.scope === 'centre').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allNotifications],
  );
  const totalAlerts = centreNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    setNavOpen(false);
    notifMenu.setOpen(false);
    profileMenu.setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';

  return (
    <ToastProvider>
      <div className="amud-ops-scale flex min-h-screen bg-amud-background text-amud-on-surface">
        {navOpen ? <div className="fixed inset-0 z-30 bg-amud-on-surface/40 md:hidden" onClick={() => setNavOpen(false)} aria-hidden="true" /> : null}
        <aside
          className={`group fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-amud-outline-variant bg-amud-surface-container-lowest transition-[width,transform] duration-200 ease-in-out md:translate-x-0 ${
            navOpen ? 'translate-x-0' : '-translate-x-full'
          } ${collapsed ? 'md:w-20 md:hover:w-64' : 'md:w-64'}`}
        >
          <div className={`flex items-center gap-sm border-b border-amud-outline-variant p-lg ${collapsed ? 'md:px-md' : ''}`}>
            <img src="/assets/images/logo.png" alt="" className="h-10 w-10 shrink-0 object-contain" />
            <div className={hiddenWhenCollapsed}>
              <h1 className="text-title-lg font-bold text-amud-primary">Amud Skills</h1>
              <p className="truncate text-label-sm text-amud-on-surface-variant">{currentCentre?.nom ?? 'Espace Centre'}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md">
            <div className="flex flex-col gap-0.5">
              {NAV.map((item) => (
                <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isNavActive(pathname, item.href)} collapsed={collapsed} />
              ))}
              {INERT.map((item) => (
                <InertNavItem key={item.label} icon={item.icon} label={item.label} collapsed={collapsed} />
              ))}
            </div>
          </nav>

          <div className={`border-t border-amud-outline-variant p-md ${collapsed ? 'md:px-sm' : ''}`} style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <Link
              href="/amud"
              className="flex items-center justify-center gap-2 rounded-lg border border-amud-outline-variant px-3 py-2 text-label-sm font-medium text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
              title={collapsed ? "Changer d'espace" : undefined}
            >
              <span className="material-symbols-outlined text-[18px]">apps</span>
              <span className={collapsed ? 'md:hidden md:group-hover:inline' : ''}>Changer d&apos;espace</span>
            </Link>
          </div>
        </aside>

        <div className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-amud-outline-variant bg-amud-surface px-gutter">
            <div className="flex items-center gap-1">
              <button onClick={() => setNavOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:hidden" aria-label="Ouvrir le menu">
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
            <div className="ml-auto flex items-center gap-sm">
              <div className="relative">
                <button onClick={() => notifMenu.setOpen((v) => !v)} className="relative rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary" aria-label="Notifications" ref={notifMenu.ref as never}>
                  <span className="material-symbols-outlined">notifications</span>
                  {totalAlerts > 0 ? <span className="absolute right-1 top-1 flex h-4 min-w-[16px] animate-pulse items-center justify-center rounded-full bg-amud-secondary px-1 text-[10px] font-bold text-white">{totalAlerts}</span> : null}
                </button>
                {notifMenu.open ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                    <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md font-semibold text-amud-on-surface">
                      <span>Notifications</span>
                      {totalAlerts > 0 ? (
                        <button onClick={() => markAllNotificationsRead('centre')} className="text-label-sm font-normal text-amud-primary hover:underline">
                          Tout marquer comme lu
                        </button>
                      ) : null}
                    </div>
                    <div className="flex max-h-96 flex-col overflow-y-auto">
                      {centreNotifications.length === 0 ? (
                        <p className="px-md py-lg text-center text-label-sm text-amud-on-surface-variant">Aucune notification.</p>
                      ) : (
                        centreNotifications.slice(0, 10).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              notifMenu.setOpen(false);
                              if (n.href) router.push(n.href);
                            }}
                            className={`flex w-full items-start gap-sm px-md py-sm text-left transition-colors hover:bg-amud-surface-container-low ${n.read ? 'opacity-60' : ''}`}
                          >
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-amud-outline-variant' : 'bg-amud-secondary'}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-body-md text-amud-on-surface">{n.title}</span>
                              <span className="block text-label-sm text-amud-on-surface-variant">{n.category}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <div ref={profileMenu.ref} className="relative">
                <button onClick={() => profileMenu.setOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white transition-opacity hover:opacity-90" aria-label="Menu du compte" aria-haspopup="menu" aria-expanded={profileMenu.open}>
                  {(currentCentre?.nom ?? 'C').charAt(0)}
                </button>
                {profileMenu.open ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                    <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm">
                      <div className="text-label-md font-semibold text-amud-on-surface">{currentCentre?.nom ?? 'Espace Centre'}</div>
                      <div className="text-label-sm text-amud-on-surface-variant">Simulation — aucune vraie authentification</div>
                    </div>
                    <div className="flex flex-col gap-sm p-md">
                      <label className="text-label-sm text-amud-on-surface-variant">
                        Centre actif
                        <select value={centerId} onChange={(e) => setCenterId(e.target.value)} className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                          {centres.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nom}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-label-sm text-amud-on-surface-variant">
                        Rôle simulé
                        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                          {CENTER_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {CENTER_ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="flex flex-col border-t border-amud-outline-variant py-1">
                      <Link href="/amud" onClick={() => profileMenu.setOpen(false)} className="flex items-center gap-sm px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">apps</span> Changer d&apos;espace
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <main key={pathname} className="min-w-0 flex-1 animate-amud-rise-in p-margin-mobile md:p-margin-desktop">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
