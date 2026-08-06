'use client';

// Layout candidat : Bottom Tab Bar + vérification de la complétion du profil à chaque chargement (règle 1).

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const TABS = [
  { href: '/dashboard', labelKey: 'common:nav.dashboard', icon: 'home' },
  { href: '/offres', labelKey: 'common:nav.offres', icon: 'work' },
  { href: '/documents', labelKey: 'common:nav.documents', icon: 'description' },
  { href: '/profil', labelKey: 'common:nav.profile', icon: 'person' },
  { href: '/settings', labelKey: 'common:nav.settings', icon: 'settings' },
  { href: '/reclamation', labelKey: 'common:nav.support', icon: 'help_outline' },
] as const;

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading } = useAuth();
  const { isHydrated, getIncompleteStep } = useProfile();
  const { t } = useLanguage();

  useEffect(() => {
    if (isLoading || !isHydrated) return;
    const incompleteStep = getIncompleteStep();
    if (incompleteStep) {
      router.replace(`/profile-creation?step=${incompleteStep}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isHydrated]);

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Sidebar desktop/tablet */}
      <aside className="hidden w-64 shrink-0 flex-col border-l border-outline-variant bg-surface-low p-5 md:flex md:order-2 min-h-screen">
        <div className="mb-8 flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-onPrimary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              language
            </span>
          </div>
          <span className="text-lg font-black tracking-tight text-primary">Amud Skills</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {TABS.map(({ href, labelKey, icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
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
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col pb-24 md:pb-0 md:order-1 relative">
        {/* Mobile top bar (optional, or just content) */}
        <main className="flex-1 max-w-5xl mx-auto w-full">{children}</main>

        {/* Bottom bar mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex items-center justify-around border-t border-surface-container-high bg-surface-container-lowest/95 px-3 py-2 shadow-subtle backdrop-blur-md md:hidden">
          {TABS.map(({ href, labelKey, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 transition-all duration-200 active:scale-95 ${
                  isActive ? 'font-extrabold text-primary' : 'text-onSurface-variant opacity-70 hover:opacity-100'
                }`}
              >
                <div className={`flex items-center justify-center rounded-full px-3 py-1 transition-colors ${isActive ? 'bg-surface-container-low text-primary' : ''}`}>
                  <span className={`material-symbols-outlined ${isActive ? 'fill text-primary' : 'text-onSurface-variant'}`} style={{ fontSize: 22 }}>
                    {icon}
                  </span>
                </div>
                <span className="text-[10px] font-bold tracking-tight">{t(labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

