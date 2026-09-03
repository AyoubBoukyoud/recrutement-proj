'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  ['/recruiter', 'Candidats'],
  ['/recruiter/offres', 'Offres'],
  ['/recruiter/candidatures', 'Candidatures'],
  ['/recruiter/notifications', 'Notifications'],
] as const;

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <div className="relative border-b bg-surface-lowest">
        <nav aria-label="Navigation de l’espace recruteur" className="overflow-x-auto px-4 py-3 sm:px-6">
          <div className="flex min-w-max gap-2">
            {nav.map(([href, label]) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${active ? 'bg-primary text-onPrimary' : 'text-primary hover:bg-primary/5'}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
        {/* Affordance de défilement : la barre d'onglets déborde souvent sur
            mobile sans autre indice qu'un onglet coupé net en bord d'écran. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface-lowest to-transparent sm:hidden" aria-hidden="true" />
      </div>
      <div id="main-content" tabIndex={-1} className="outline-none">{children}</div>
    </div>
  );
}
