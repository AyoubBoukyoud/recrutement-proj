'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { TopBar } from '@/components/TopBar';
import { StatusPill } from '@/components/ui';

const SECTIONS = [
  { to: '/admin/apercu', label: 'Aperçu' },
  { to: '/admin/candidats', label: 'Candidats' },
  { to: '/admin/recruteurs', label: 'Recruteurs' },
  { to: '/admin/reclamations', label: 'Réclamations' },
  { to: '/admin/stage', label: 'Stage' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs' },
  { to: '/admin/parrainage', label: 'Parrainage' },
] as const;

const NAV_BASE =
  'inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-element border border-transparent px-3 text-[13px] font-semibold tracking-[0.1px] transition-[background-color,border-color,color] duration-100';
const NAV_ACTIVE = 'bg-primary text-onPrimary';
const NAV_INACTIVE = 'border-outline-variant bg-surface-lowest text-on-surface hover:border-primary hover:text-primary';

/**
 * Le socle de la console administrateur, porté depuis web-admin. Il reste
 * monté tant que l'admin circule entre les sections — c'est ce qui garantit
 * qu'une section quittée démonte réellement ses requêtes (et son intervalle,
 * le cas échéant) au lieu d'être seulement masquée en CSS.
 *
 * `NavLink` de react-router n'a pas d'équivalent direct : l'état actif se
 * calcule ici à la main via `usePathname()`, comparé au préfixe de chaque
 * section — un dossier ouvert (`/admin/candidats/12`) doit garder l'onglet
 * « Candidats » actif, d'où `startsWith` plutôt qu'une égalité stricte.
 *
 * La connectivité de l'API vit dans le bandeau que `TopBar` prévoit pour ça,
 * plutôt que dans une carte de 150px en pleine page.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-ping'],
    queryFn: () => api.get('/admin/ping').then((r) => r.data),
  });

  return (
    <div className="min-h-screen bg-surface">
      <TopBar
        title="Console administrateur"
        connectivity={
          <StatusPill
            status={isLoading ? 'pending' : error ? 'error' : 'ok'}
            label={
              isLoading
                ? "Vérification de l'API…"
                : error
                  ? 'API injoignable ou non autorisée'
                  : `API : ${data?.message}`
            }
          />
        }
      />

      {/* Défile horizontalement en dessous de `lg` : six onglets ne tiennent
          pas sur un téléphone, et les faire passer à la ligne pousserait le
          contenu de façon imprévisible. */}
      <nav className="border-b border-outline-variant bg-surface-lowest px-8 py-3">
        <div className="flex gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible">
          {SECTIONS.map((s) => {
            const isActive = pathname === s.to || pathname.startsWith(`${s.to}/`);
            return (
              <Link key={s.to} href={s.to} className={`${NAV_BASE} ${isActive ? NAV_ACTIVE : NAV_INACTIVE}`}>
                {s.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 pb-36 md:pb-8">{children}</main>
    </div>
  );
}
