'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { HeaderPreferences } from '@/components/shared/HeaderPreferences';
import { ToastProvider } from '@/components/amud/Toast';
import { Drawer } from '@/components/amud/ui';
import { useAuth } from '@/context/AuthContext';

/**
 * Coquille de la console d'administration, portée depuis `AdminShell` du
 * prototype `/amud/admin` (mêmes classes `amud-*`, globalement disponibles —
 * voir `globals.css`) mais branchée sur la vraie session (`useAuth`) plutôt
 * que sur une identité et une recherche en `localStorage`. Remplace la barre
 * d'onglets de l'ancien `admin/layout.tsx` : ce dernier était le seul écran
 * ops sans bascule de thème ni langue, ce que `TopBar` réglait ailleurs —
 * cette coquille les porte désormais dans le header au lieu de `TopBar`.
 */
type NavItem = { href: string; icon: string; label: string };

const NAV: NavItem[] = [
  { href: '/admin', icon: 'dashboard', label: 'Vue d’ensemble' },
  { href: '/admin/candidats', icon: 'person', label: 'Candidats' },
  { href: '/admin/recruteurs', icon: 'domain', label: 'Recruteurs' },
  { href: '/admin/utilisateurs', icon: 'group', label: 'Utilisateurs' },
  { href: '/admin/offres', icon: 'work', label: 'Offres' },
  { href: '/admin/candidatures', icon: 'assignment', label: 'Candidatures' },
  { href: '/admin/stage', icon: 'task_alt', label: 'Stage quotidien' },
  { href: '/admin/parrainages', icon: 'redeem', label: 'Parrainages' },
  { href: '/admin/centres', icon: 'apartment', label: 'Centres de recrutement' },
  { href: '/admin/reclamations', icon: 'support_agent', label: 'Réclamations' },
  { href: '/admin/contact', icon: 'mail', label: 'Contact' },
  { href: '/admin/journal', icon: 'history', label: 'Journal' },
  { href: '/admin/notifications', icon: 'notifications', label: 'Notifications' },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';
  const current = NAV.find((item) => isActive(pathname, item.href));
  const displayName = user?.name?.trim() || user?.phone || 'Administrateur';

  return (
    <ToastProvider>
      <div className="amud-ops-scale flex min-h-screen bg-amud-background text-amud-on-surface">
        <aside
          className={`group fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-amud-outline-variant bg-amud-surface-container-lowest transition-[width] duration-200 ease-in-out md:flex ${
            collapsed ? 'md:w-20 md:hover:w-64' : 'md:w-64'
          }`}
        >
          <div className={`flex items-center gap-sm border-b border-amud-outline-variant px-lg py-2.5 ${collapsed ? 'md:px-md' : ''}`}>
            <img src="/assets/images/logo-mark.png" alt="" className="h-10 w-10 shrink-0 object-contain" />
            <div className={hiddenWhenCollapsed}>
              <h1 className="text-title-lg font-bold text-amud-primary">Amud Skills</h1>
              <p className="text-label-sm text-amud-on-surface-variant">Console admin</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md" aria-label="Navigation de la console d’administration">
            <div className="flex flex-col gap-0.5">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-sm rounded-lg px-md py-sm text-label-md font-medium transition-colors ${
                      active
                        ? 'bg-amud-primary-container text-white'
                        : 'text-amud-on-surface-variant hover:bg-amud-surface-container-low hover:text-amud-on-surface'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined shrink-0 text-[20px]"
                      style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    <span className={collapsed ? 'md:hidden md:group-hover:inline' : ''}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div
            className={`border-t border-amud-outline-variant p-md ${collapsed ? 'md:px-sm' : ''}`}
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
          >
            <div className={`flex items-center gap-3 rounded-lg p-2 ${collapsed ? 'md:justify-center' : ''}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amud-primary-container font-bold text-amud-primary">
                {initialsOf(displayName)}
              </div>
              <div className={`min-w-0 ${hiddenWhenCollapsed}`}>
                <div className="truncate text-label-md font-bold text-amud-on-surface">{displayName}</div>
                <div className="truncate text-label-sm text-amud-on-surface-variant">Administrateur</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-amud-outline-variant px-3 py-2 text-label-sm font-medium text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-error"
              title={collapsed ? 'Déconnexion' : undefined}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className={collapsed ? 'md:hidden md:group-hover:inline' : ''}>Déconnexion</span>
            </button>
          </div>
        </aside>

        <div
          className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out ${
            collapsed ? 'md:ml-20' : 'md:ml-64'
          }`}
        >
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-amud-outline-variant/40 bg-amud-surface/90 px-gutter backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-1">
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:flex"
                aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
                aria-pressed={collapsed}
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <button
                onClick={() => setMobileNavOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:hidden"
                aria-label="Ouvrir le menu de navigation"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="flex min-w-0 items-center gap-sm md:hidden">
                <img src="/assets/images/logo-mark.png" alt="" className="h-8 w-8 shrink-0 object-contain" />
                <span className="truncate text-title-lg font-bold text-amud-primary">Amud Skills</span>
              </div>
              <h2 className="ml-2 hidden truncate text-title-md font-semibold text-amud-on-surface sm:block">
                {current?.label ?? 'Administration'}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-sm">
              <HeaderPreferences />
              <button
                onClick={logout}
                aria-label="Déconnexion"
                className="flex h-9 w-9 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-error md:hidden"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </header>
          <main key={pathname} className="min-w-0 flex-1 animate-amud-rise-in p-margin-mobile pb-8 md:p-margin-desktop">
            {children}
          </main>
        </div>

        <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Navigation" anchor="bottom">
          <nav className="flex flex-col gap-0.5" aria-label="Navigation de la console d’administration">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-sm rounded-lg px-md py-sm text-label-md font-medium transition-colors ${
                    active ? 'bg-amud-primary-container text-white' : 'text-amud-on-surface-variant hover:bg-amud-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined shrink-0 text-[20px]">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </Drawer>
      </div>
    </ToastProvider>
  );
}
