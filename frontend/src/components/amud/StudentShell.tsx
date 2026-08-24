'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Drawer, NavItem, isNavActive, useDropdown } from '@/components/amud/ui';
import { HeaderLanguageThemeControls } from '@/components/amud/HeaderLanguageThemeControls';
import { ToastProvider } from '@/components/amud/Toast';
import { useCurrentStudent, setCurrentStudentId } from '@/lib/amud/currentStudent';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { notifications as notificationsCollection, markNotificationRead, markAllNotificationsRead } from '@/lib/amud/storage/notify';
import { notificationsSeed } from '@/data/amud/notifications';
import { useCollection } from '@/lib/amud/storage/useCollection';

type StudentNavItem = {
  href: string;
  icon: string;
  label: string;
  group: string;
  inBottomNav?: boolean;
  bottomIcon?: string;
  bottomLabel?: string;
};

const NAV: StudentNavItem[] = [
  { href: '/amud/student/dashboard', icon: 'home', label: 'Accueil', group: '', inBottomNav: true },
  { href: '/amud/student/formation', icon: 'menu_book', label: 'Ma formation', group: 'Formation', inBottomNav: true },
  { href: '/amud/student/planning', icon: 'calendar_month', label: 'Mon planning', group: 'Formation', inBottomNav: true },
  { href: '/amud/student/presences', icon: 'fact_check', label: 'Mes présences', group: 'Formation', inBottomNav: true },
  { href: '/amud/student/payments', icon: 'payments', label: 'Mes paiements', group: 'Finances', inBottomNav: true, bottomLabel: 'Paiements' },
  { href: '/amud/student/group', icon: 'diversity_3', label: 'Mon groupe', group: 'Formation' },
  { href: '/amud/student/teachers', icon: 'cast_for_education', label: 'Mes enseignants', group: 'Formation' },
  { href: '/amud/student/results', icon: 'grade', label: 'Mes résultats', group: 'Formation' },
  { href: '/amud/student/notifications', icon: 'notifications', label: 'Notifications', group: 'Compte' },
  { href: '/amud/student/profile', icon: 'person', label: 'Mon profil', group: 'Compte' },
  { href: '/amud/student/settings', icon: 'settings', label: 'Paramètres', group: 'Compte' },
];

const GROUP_LABELS = ['Formation', 'Finances', 'Compte'];
const SIDEBAR_GROUPS = [{ label: '', items: NAV.filter((i) => i.group === '') }].concat(
  GROUP_LABELS.map((label) => ({ label, items: NAV.filter((i) => i.group === label) })),
);
const BOTTOM_ITEMS = NAV.filter((i) => i.inBottomNav);
const PLUS_GROUPS = GROUP_LABELS.map((label) => ({ label, items: NAV.filter((i) => i.group === label && !i.inBottomNav) })).filter((g) => g.items.length > 0);

/**
 * Coquille de l'espace self-service `/amud/student/*` — même architecture que
 * `CentreShell` : nav fixe, header avec cloche (`scope:'student'`), `ToastProvider`.
 * Comme les autres espaces `/amud`, il n'y a pas de vraie authentification ; le
 * sélecteur "Étudiant actif" dans le menu profil simule l'identité
 * (`useCurrentStudent`). Chaque page lit les mêmes clés localStorage que l'espace
 * Centre, garantissant la synchronisation en temps réel (§25 du cahier des charges).
 */
export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const notifMenu = useDropdown<HTMLDivElement>();
  const profileMenu = useDropdown<HTMLDivElement>();

  const { studentId } = useCurrentStudent();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const currentStudent = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);

  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);
  const studentNotifications = useMemo(
    () =>
      allNotifications
        .filter((n) => n.scope === 'student' && (!n.targetId || n.targetId === studentId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allNotifications, studentId],
  );
  const totalAlerts = studentNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    setNavOpen(false);
    setPlusOpen(false);
    notifMenu.setOpen(false);
    profileMenu.setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';
  const studentName = currentStudent ? `${currentStudent.prenom} ${currentStudent.nom}` : 'Étudiant';

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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amud-secondary-container text-amud-on-secondary-container">
              <span className="material-symbols-outlined text-[22px]">school</span>
            </div>
            <div className={hiddenWhenCollapsed}>
              <h1 className="text-title-lg font-bold text-amud-secondary">Espace Étudiant</h1>
              <p className="truncate text-label-sm text-amud-on-surface-variant">{studentName}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md" aria-label="Navigation de l'espace Étudiant">
            <div className="flex flex-col gap-md">
              {SIDEBAR_GROUPS.map((group) => (
                <div key={group.label || 'root'}>
                  {group.label ? (
                    <div className={`px-4 pb-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline ${hiddenWhenCollapsed}`}>{group.label}</div>
                  ) : null}
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        active={isNavActive(pathname, item.href, item.href === '/amud/student/dashboard')}
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
              {/* Cloche notifications */}
              <div className="relative">
                <button onClick={() => notifMenu.setOpen((v) => !v)} className="relative rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-secondary" aria-label="Notifications" ref={notifMenu.ref as never}>
                  <span className="material-symbols-outlined">notifications</span>
                  {totalAlerts > 0 ? <span className="absolute right-1 top-1 flex h-4 min-w-[16px] animate-pulse items-center justify-center rounded-full bg-amud-secondary px-1 text-[10px] font-bold text-white">{totalAlerts}</span> : null}
                </button>
                {notifMenu.open ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                    <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md font-semibold text-amud-on-surface">
                      <span>Notifications</span>
                      {totalAlerts > 0 ? (
                        <button onClick={() => markAllNotificationsRead('student')} className="text-label-sm font-normal text-amud-secondary hover:underline">
                          Tout marquer comme lu
                        </button>
                      ) : null}
                    </div>
                    <div className="flex max-h-96 flex-col overflow-y-auto">
                      {studentNotifications.length === 0 ? (
                        <p className="px-md py-lg text-center text-label-sm text-amud-on-surface-variant">Aucune notification.</p>
                      ) : (
                        studentNotifications.slice(0, 10).map((n) => (
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
              <HeaderLanguageThemeControls />
              {/* Menu profil avec sélecteur d'étudiant */}
              <div ref={profileMenu.ref} className="relative">
                <button onClick={() => profileMenu.setOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full bg-amud-secondary-container font-bold text-amud-on-secondary-container transition-opacity hover:opacity-90" aria-label="Menu du compte" aria-haspopup="menu" aria-expanded={profileMenu.open}>
                  {(currentStudent?.prenom ?? 'E').charAt(0)}
                </button>
                {profileMenu.open ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                    <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm">
                      <div className="text-label-md font-semibold text-amud-on-surface">{studentName}</div>
                      <div className="text-label-sm text-amud-on-surface-variant">Simulation — aucune vraie authentification</div>
                    </div>
                    <div className="flex flex-col gap-sm p-md">
                      <label className="text-label-sm text-amud-on-surface-variant">
                        Étudiant actif
                        <select
                          value={studentId}
                          onChange={(e) => setCurrentStudentId(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-secondary"
                        >
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.prenom} {s.nom}
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
          <main key={pathname} className="min-w-0 flex-1 animate-amud-rise-in p-margin-mobile pb-24 md:p-margin-desktop md:pb-margin-desktop">
            {children}
          </main>
        </div>

        {/* Barre de navigation basse mobile */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-amud-outline-variant bg-amud-surface-container-lowest md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Navigation principale"
        >
          {BOTTOM_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href, item.href === '/amud/student/dashboard');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${active ? 'text-amud-secondary' : 'text-amud-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined text-[22px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.bottomIcon ?? item.icon}
                </span>
                <span className="truncate">{item.bottomLabel ?? item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setPlusOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-amud-on-surface-variant"
            aria-haspopup="menu"
            aria-expanded={plusOpen}
          >
            <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            Plus
          </button>
        </nav>

        <Drawer open={plusOpen} onClose={() => setPlusOpen(false)} anchor="bottom" title="Plus d'options">
          <div className="flex flex-col gap-lg">
            {PLUS_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-1 pb-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline">{group.label}</div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isNavActive(pathname, item.href)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Drawer>
      </div>
    </ToastProvider>
  );
}
