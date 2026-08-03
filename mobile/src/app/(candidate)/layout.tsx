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
    <div className="mx-auto min-h-screen max-w-md bg-surface pb-24 shadow-subtle flex flex-col">
      <div className="flex-1">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center justify-around border-t border-surface-container-high bg-surface-container-lowest/95 px-3 py-2 shadow-subtle backdrop-blur-md">
        {TABS.map(({ href, label, icon }) => {
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
              <span className="text-[10px] font-bold tracking-tight">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

