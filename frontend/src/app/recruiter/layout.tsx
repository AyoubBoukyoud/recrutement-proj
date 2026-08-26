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
      <nav aria-label="Navigation de l’espace recruteur" className="overflow-x-auto border-b bg-surface-lowest px-4 py-3 sm:px-6">
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
      {children}
    </div>
  );
}
