'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TopBar } from '@/components/TopBar';

/*
 * La coquille de la console d'administration.
 *
 * `TopBar` est la même barre que les espaces recruteur et agent : elle porte
 * le sélecteur de thème clair/sombre, le sélecteur de langue et la
 * déconnexion. L'admin était le seul rôle à ne l'avoir pas — donc le seul
 * sans bascule de thème, et surtout le seul sans aucun moyen de se
 * déconnecter autrement qu'en vidant le stockage du navigateur.
 */
const nav = [
  ['/admin', 'Vue d’ensemble'],
  ['/admin/utilisateurs', 'Utilisateurs'],
  ['/admin/offres', 'Offres'],
  ['/admin/candidatures', 'Candidatures'],
  ['/admin/reclamations', 'Réclamations'],
  ['/admin/journal', 'Journal'],
  ['/admin/notifications', 'Notifications'],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Le libellé de l'onglet courant plutôt qu'un titre fixe : la barre dit où
  // l'on est, comme chez le recruteur où chaque écran passe le sien.
  const current = nav.find(([href]) => href === pathname);

  return (
    <div className="min-h-screen bg-surface">
      <TopBar title={current ? current[1] : 'Administration'} />

      <div className="relative border-b border-outline-variant bg-surface-container-lowest">
        <nav
          aria-label="Navigation de la console d’administration"
          className="overflow-x-auto px-4 py-3 sm:px-6"
        >
          <div className="flex min-w-max gap-2">
            {nav.map(([href, label]) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    active
                      ? 'bg-primary text-onPrimary'
                      : 'text-primary hover:bg-primary/5'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
        {/* Affordance de défilement : la barre d'onglets déborde souvent sur
            mobile sans autre indice qu'un onglet coupé net en bord d'écran. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface-container-lowest to-transparent sm:hidden" aria-hidden="true" />
      </div>

      {/* La TopBar passe en barre fixe en bas sous md : sans cette réserve, le
          dernier élément de la page se retrouve dessous. */}
      <div id="main-content" tabIndex={-1} className="pb-24 outline-none md:pb-0">{children}</div>
    </div>
  );
}
