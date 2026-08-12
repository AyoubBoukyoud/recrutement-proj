'use client';

// Layout candidat : Bottom Tab Bar + vérification de la complétion du profil à chaque chargement (règle 1).

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';

const TABS = [
  { href: '/dashboard', label: 'Accueil', icon: 'home' },
  { href: '/offres', label: 'Offres', icon: 'work' },
  { href: '/documents', label: 'Documents', icon: 'description' },
  { href: '/profil', label: 'Profil', icon: 'person' },
  { href: '/reclamation', label: 'Support', icon: 'help_outline' },
];

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading } = useAuth();
  const { isHydrated, getIncompleteStep } = useProfile();

  useEffect(() => {
    if (isLoading || !isHydrated) return;
    const incompleteStep = getIncompleteStep();
    if (incompleteStep) {
      router.replace(`/profile-creation?step=${incompleteStep}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isHydrated]);

  return (
    <div className="min-h-screen bg-surface lg:flex">
      {/* Sidebar desktop — remplace la tab bar du bas à partir de lg. */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-outline-variant lg:bg-surface-container-lowest">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-6 py-6">
          <img src="/assets/images/logo.png" alt="" className="h-8 w-8 object-contain" />
          <span className="text-base font-extrabold text-primary-dark">Amud Skills</span>
        </Link>

        <nav className="flex-1 space-y-1 px-3" aria-label="Navigation candidat">
          {TABS.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-onSurface-variant hover:bg-surface-container-low hover:text-onSurface'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`} style={{ fontSize: 22 }}>
                  {icon}
                </span>
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-1 flex-col pb-24 shadow-subtle lg:mx-0 lg:max-w-none lg:pb-0 lg:shadow-none">
        <div className="flex-1">{children}</div>

        {/* Tab bar mobile — masquée dès lg, remplacée par la sidebar. */}
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center justify-around border-t border-surface-container-high bg-surface-container-lowest/95 px-3 py-2 shadow-subtle backdrop-blur-md lg:hidden">
          {TABS.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className={`flex items-center justify-center px-3 py-1.5 transition-all duration-200 active:scale-95 ${
                  isActive ? 'font-extrabold text-primary' : 'text-onSurface-variant opacity-70 hover:opacity-100'
                }`}
              >
                <div className={`flex items-center justify-center rounded-full px-3.5 py-2 transition-colors ${isActive ? 'bg-surface-container-low text-primary' : ''}`}>
                  <span className={`material-symbols-outlined ${isActive ? 'fill text-primary' : 'text-onSurface-variant'}`} style={{ fontSize: 24 }}>
                    {icon}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

