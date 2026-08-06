'use client';

// Layout admin : barre latérale avec navigation vers les 5 modules de gestion.

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const NAV_ITEMS = [
  { href: '/admin/utilisateurs', labelKey: 'common:nav.adminUtilisateurs', icon: 'group' },
  { href: '/admin/validation', labelKey: 'common:nav.adminValidation', icon: 'fact_check' },
  { href: '/admin/reclamations', labelKey: 'common:nav.adminReclamations', icon: 'confirmation_number' },
  { href: '/admin/statistiques', labelKey: 'common:nav.adminStatistiques', icon: 'bar_chart' },
  { href: '/admin/parrainage', labelKey: 'common:nav.adminParrainage', icon: 'handshake' },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map(({ href, labelKey, icon }) => {
        const isActive = pathname === href;
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
      <aside className="hidden w-64 shrink-0 flex-col border-l border-outline-variant bg-surface-low p-5 md:flex md:order-2">
        <div className="mb-8 px-1">
          <h1 className="text-lg font-bold text-primary">Amud Pillar</h1>
          <p className="text-xs text-onSurface-variant">{t('common:adminLayout.roleTitle')}</p>
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

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant bg-surface/95 p-4 backdrop-blur-md md:hidden">
        <span className="text-sm font-bold text-primary">{t('common:space.admin')}</span>
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
              {t('common:actions.logout')}
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 pb-20 md:pb-0 md:order-1">{children}</main>
    </div>
  );
}
