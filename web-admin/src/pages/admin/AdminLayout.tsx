import { NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { TopBar } from '../../components/TopBar'
import { StatusPill } from '../../components/ui'

const SECTIONS = [
  { to: 'apercu', label: 'Aperçu' },
  { to: 'candidats', label: 'Candidats' },
  { to: 'reclamations', label: 'Réclamations' },
  { to: 'stage', label: 'Stage' },
  { to: 'utilisateurs', label: 'Utilisateurs' },
  { to: 'parrainage', label: 'Parrainage' },
] as const

const NAV_BASE =
  'inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-element border border-transparent px-3 text-[13px] font-semibold tracking-[0.1px] transition-[background-color,border-color,color] duration-100'
const NAV_ACTIVE = 'bg-primary text-white'
const NAV_INACTIVE = 'border-outline-variant bg-surface-lowest text-on-surface hover:border-primary hover:text-primary'

/**
 * Le socle de la console administrateur. Il reste monté tant que l'admin
 * circule entre les sections — c'est ce qui garantit qu'une section quittée
 * démonte réellement ses requêtes (et son intervalle, le cas échéant) au lieu
 * d'être seulement masquée en CSS.
 *
 * La connectivité de l'API vit ici plutôt que dans une carte de 150px en
 * pleine page : une seule vérification par session admin, affichée dans le
 * bandeau que `TopBar` prévoit pour ça.
 */
export function AdminLayout() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-ping'],
    queryFn: () => api.get('/admin/ping').then((r) => r.data),
  })

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
          contenu de façon imprévisible. Même motif que les puces de filtre
          de user-app (`offres`, `documents`) — overflow-x-auto en bas, grille
          qui se déplie au-delà. */}
      <nav className="border-b border-outline-variant bg-surface-lowest px-8 py-3">
        <div className="flex gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) => `${NAV_BASE} ${isActive ? NAV_ACTIVE : NAV_INACTIVE}`}
            >
              {s.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
