'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ToastProvider } from '@/components/amud/Toast';
import { ThemeSwitch } from '@/components/amud/ThemeSwitch';
import { Drawer } from '@/components/amud/ui';
import { useAuth } from '@/context/AuthContext';

/**
 * Coquille de l'espace recruteur, portée depuis `CompanyShell` du prototype
 * `/amud/entreprise` (sidebar + header), branchée sur la vraie session
 * (`useAuth`) plutôt que sur une identité et une recherche en `localStorage`.
 *
 * Cinq entrées de la maquette (Entretiens, Messages, Mon entreprise, Équipe,
 * Statistiques) n'ont aucun backend réel derrière elles — pas de modèle
 * Interview, pas de messagerie, pas de multi-utilisateur par entreprise, pas
 * d'édition de profil en libre-service, pas d'endpoint de statistiques par
 * recruteur (voir l'audit fonctionnel). Depuis, quatre des cinq ont reçu leur
 * backend (profil, équipe, entretiens, statistiques — voir
 * `RecruiterProfileController`, `RecruiterTeamController`,
 * `RecruiterInterviewController`, `RecruiterStatsController`) et rejoignent
 * la navigation active. Seule la messagerie reste désactivée : aucune
 * messagerie n'existe nulle part dans le produit réel, côté candidat non
 * plus — la construire est son propre chantier, transverse aux deux espaces.
 */
type NavItem = { href: string; icon: string; label: string };
const NAV: NavItem[] = [
  { href: '/recruiter', icon: 'person_search', label: 'Recherche candidats' },
  { href: '/recruiter/offres', icon: 'work', label: 'Offres' },
  { href: '/recruiter/candidatures', icon: 'assignment', label: 'Candidatures' },
  { href: '/recruiter/entretiens', icon: 'event', label: 'Entretiens' },
  { href: '/recruiter/statistiques', icon: 'monitoring', label: 'Statistiques' },
  { href: '/recruiter/equipe', icon: 'groups', label: 'Équipe' },
  { href: '/recruiter/profil', icon: 'apartment', label: 'Mon entreprise' },
  { href: '/recruiter/notifications', icon: 'notifications', label: 'Notifications' },
];

const INERT_NAV: { icon: string; label: string }[] = [{ icon: 'mail', label: 'Messages' }];

function isActive(pathname: string, href: string) {
  if (href === '/recruiter') return pathname === '/recruiter';
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

function InertItem({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      title="Pas encore branché sur un vrai backend"
      className="flex cursor-not-allowed items-center gap-sm rounded-lg px-md py-sm text-label-md text-amud-on-surface-variant opacity-50"
    >
      <span className="material-symbols-outlined shrink-0 text-[20px]">{icon}</span>
      {label}
    </span>
  );
}

export function RecruiterShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';
  const current = NAV.find((item) => isActive(pathname, item.href));
  const displayName = user?.name?.trim() || user?.phone || 'Recruteur';

  return (
    <ToastProvider>
      <div className="amud-ops-scale flex min-h-screen bg-amud-background text-amud-on-surface">
        <aside
          className={`group fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-amud-outline-variant bg-amud-surface-container-lowest transition-[width] duration-200 ease-in-out md:flex ${
            collapsed ? 'md:w-20 md:hover:w-64' : 'md:w-64'
          }`}
        >
          <div className={`flex items-center gap-sm border-b border-amud-outline-variant px-lg py-2.5 ${collapsed ? 'md:px-md' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amud-primary-container">
              <span className="material-symbols-outlined text-amud-primary">apartment</span>
            </div>
            <div className={hiddenWhenCollapsed}>
              <h1 className="truncate text-title-lg font-bold text-amud-primary">Espace recruteur</h1>
              <p className="text-label-sm text-amud-on-surface-variant">Amud Skills</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md" aria-label="Navigation de l’espace recruteur">
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
                      active ? 'bg-amud-primary-container text-white' : 'text-amud-on-surface-variant hover:bg-amud-surface-container-low hover:text-amud-on-surface'
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
            <div className={`mt-4 px-md py-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline ${hiddenWhenCollapsed}`}>
              Bientôt
            </div>
            <div className="flex flex-col gap-0.5">
              {INERT_NAV.map((item) => (
                <InertItem key={item.label} icon={item.icon} label={item.label} />
              ))}
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
                <div className="truncate text-label-sm text-amud-on-surface-variant">Recruteur</div>
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

        <div className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
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
                <span className="material-symbols-outlined text-amud-primary">apartment</span>
                <span className="truncate text-title-lg font-bold text-amud-primary">Espace recruteur</span>
              </div>
              <h2 className="ml-2 hidden truncate text-title-md font-semibold text-amud-on-surface sm:block">
                {current?.label ?? 'Espace recruteur'}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-sm">
              <LanguageSwitcher compact />
              <ThemeSwitch />
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
          <nav className="flex flex-col gap-0.5" aria-label="Navigation de l’espace recruteur">
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
