'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/*
 * La coquille de la console d'administration. Les quatre écrans historiques
 * (`offres`, `candidatures`, `journal`, `notifications`) vivaient sans layout
 * ni navigation : on ne pouvait passer de l'un à l'autre qu'en tapant l'URL.
 * `utilisateurs` est le seul point d'entrée pour attribuer un rôle, donc il
 * ouvre la liste.
 */
const nav = [
  ['/admin', 'Vue d’ensemble'],
  ['/admin/utilisateurs', 'Utilisateurs'],
  ['/admin/offres', 'Offres'],
  ['/admin/candidatures', 'Candidatures'],
  ['/admin/journal', 'Journal'],
  ['/admin/notifications', 'Notifications'],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <nav
        aria-label="Navigation de la console d’administration"
        className="overflow-x-auto border-b bg-surface-lowest px-4 py-3 sm:px-6"
      >
        <div className="flex min-w-max gap-2">
          {nav.map(([href, label]) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${
                  active ? 'bg-primary text-onPrimary' : 'text-primary hover:bg-primary/5'
                }`}
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
