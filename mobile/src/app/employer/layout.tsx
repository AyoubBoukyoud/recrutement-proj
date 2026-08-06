'use client';

// Layout employeur : barre latérale (desktop) / menu hamburger (mobile).

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const NAV_ITEMS = [
  { href: '/employer/dashboard', labelKey: 'common:nav.employerDashboard', icon: 'dashboard' },
  { href: '/employer/recherche', labelKey: 'common:nav.recherche', icon: 'search' },
  { href: '/employer/matchings', labelKey: 'common:nav.matchings', icon: 'handshake' },
  { href: '/employer/messagerie', labelKey: 'common:nav.messagerie', icon: 'mail' },
  { href: '/employer/suivi', labelKey: 'common:nav.suivi', icon: 'fact_check' },
] as const;

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/login-employeur');
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map(({ href, labelKey, icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              isActive ? 'bg-primary-container text-onPrimary-container' : 'text-onSurface-variant hover:bg-surface-high'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {icon}
            </span>
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-l border-outline-variant bg-surface-low p-5 md:flex md:order-2">
        <div className="mb-8 flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-onPrimary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              language
            </span>
          </div>
          <span className="text-lg font-black tracking-tight text-primary">Amud Skills</span>
        </div>
        <NavLinks />
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-onSurface-variant hover:bg-surface-high"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            logout
          </span>
          {t('common:actions.logout')}
        </button>
      </aside>

      {/* Top bar mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant bg-surface/95 p-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>
            business_center
          </span>
          <span className="text-sm font-bold text-primary">{t('common:space.employer')}</span>
        </div>
        <button type="button" onClick={() => setIsMenuOpen(true)} aria-label={t('common:menu.open')} className="text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            menu
          </span>
        </button>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface-lowest p-5">
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label={t('common:menu.close')}
              className="mb-6 self-end text-onSurface-variant"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                close
              </span>
            </button>
            <NavLinks onNavigate={() => setIsMenuOpen(false)} />
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-onSurface-variant hover:bg-surface-high"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                logout
              </span>
              Déconnexion
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 md:order-1">{children}</main>
    </div>
  );
}
