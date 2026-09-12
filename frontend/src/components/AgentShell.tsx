'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { Drawer } from '@/components/amud/ui';
import { ToastProvider } from '@/components/amud/Toast';
import { HeaderPreferences } from '@/components/shared/HeaderPreferences';
import { useAuth } from '@/context/AuthContext';

type NavItem = {
  href: string;
  icon: string;
  label: string;
  shortLabel: string;
};

const NAV: NavItem[] = [
  { href: '/agent', icon: 'dashboard', label: 'Vue d’ensemble', shortLabel: 'Accueil' },
  { href: '/agent/parrainages', icon: 'qr_code_2', label: 'Parrainages', shortLabel: 'Parrainages' },
  { href: '/agent/centres', icon: 'apartment', label: 'Prospection', shortLabel: 'Prospection' },
];

function isActive(pathname: string, href: string) {
  if (href === '/agent') return pathname === '/agent';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function NavigationLinks({
  pathname,
  collapsed = false,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return NAV.map((item) => {
    const active = isActive(pathname, item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
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
          aria-hidden="true"
        >
          {item.icon}
        </span>
        <span className={collapsed ? 'md:hidden md:group-hover:inline' : ''}>{item.label}</span>
      </Link>
    );
  });
}

/**
 * Navigation de l'espace commercial réel. Elle reprend la hiérarchie visuelle
 * des écrans Stitch, mais n'expose que les modules branchés sur l'API : aperçu,
 * parrainages/commissions et prospection des centres.
 */
export function AgentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';
  const current = NAV.find((item) => isActive(pathname, item.href));
  const displayName = user?.name?.trim() || user?.phone || 'Agent commercial';

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
              <h1 className="truncate text-title-lg font-bold text-amud-primary">Amud Skills</h1>
              <p className="text-label-sm text-amud-on-surface-variant">Espace commercial</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md" aria-label="Navigation de l’espace commercial">
            <div className="flex flex-col gap-0.5">
              <NavigationLinks pathname={pathname} collapsed={collapsed} />
            </div>
          </nav>

          <div
            className={`border-t border-amud-outline-variant p-md ${collapsed ? 'md:px-sm' : ''}`}
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
          >
            <div className={`flex items-center gap-3 rounded-lg p-2 ${collapsed ? 'md:justify-center' : ''}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">
                {initialsOf(displayName)}
              </div>
              <div className={`min-w-0 ${hiddenWhenCollapsed}`}>
                <div className="truncate text-label-md font-bold text-amud-on-surface">{displayName}</div>
                <div className="truncate text-label-sm text-amud-on-surface-variant">Agent commercial</div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-amud-outline-variant px-3 py-2 text-label-sm font-medium text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-error"
              title={collapsed ? 'Déconnexion' : undefined}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">logout</span>
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
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:flex"
                aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
                aria-pressed={collapsed}
              >
                <span className="material-symbols-outlined" aria-hidden="true">menu</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:hidden"
                aria-label="Ouvrir le menu de navigation"
              >
                <span className="material-symbols-outlined" aria-hidden="true">menu</span>
              </button>
              <div className="flex min-w-0 items-center gap-sm md:hidden">
                <Image src="/assets/images/logo-mark.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
                <span className="truncate text-title-lg font-bold text-amud-primary">Espace commercial</span>
              </div>
              <h2 className="ml-2 hidden truncate text-title-md font-semibold text-amud-on-surface sm:block">
                {current?.label ?? 'Espace commercial'}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-sm">
              <HeaderPreferences />
              <button
                type="button"
                onClick={logout}
                aria-label="Déconnexion"
                className="flex h-9 w-9 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-error md:hidden"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
              </button>
            </div>
          </header>

          <main key={pathname} className="min-w-0 flex-1 animate-amud-rise-in p-margin-mobile pb-24 md:p-margin-desktop md:pb-8">
            {children}
          </main>
        </div>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-amud-outline-variant/40 bg-amud-surface-container-lowest/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-subtle backdrop-blur-md md:hidden"
          aria-label="Navigation principale de l’espace commercial"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                  active ? 'text-amud-primary' : 'text-amud-on-surface-variant'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.shortLabel}</span>
              </Link>
            );
          })}
        </nav>

        <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Navigation" anchor="bottom">
          <nav className="flex flex-col gap-0.5" aria-label="Navigation de l’espace commercial">
            <NavigationLinks pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
          </nav>
        </Drawer>
      </div>
    </ToastProvider>
  );
}
