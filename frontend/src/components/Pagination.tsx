import { Button } from '@/components/ui'
import type { PaginatedResponse } from '@/types/candidate'

/**
 * L'API a toujours paginé par 20 sans que rien ne demande jamais la page deux :
 * à partir du 21e candidat, plus personne n'était visible et personne n'en
 * était averti. Affichée dès qu'il y a plus d'une page — et le total est
 * montré même quand il n'y en a qu'une, parce que « 12 candidats » répond à la
 * question que le recruteur s'est réellement posée.
 */
export function Pagination<T>({
  page,
  data,
  onPage,
  noun = 'candidat',
}: {
  page: number
  data: PaginatedResponse<T> | undefined
  onPage: (page: number) => void
  /** Le nom au singulier — un « s » suffit à tout ce qui est compté ici. */
  noun?: string
}) {
  if (!data || data.total === 0) return null

  const { current_page, last_page, total } = data
  const count = `${total} ${noun}${total === 1 ? '' : 's'}`

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <span className="helper-text">
        {last_page > 1 ? `Page ${current_page} sur ${last_page} · ${count}` : count}
      </span>

      {last_page > 1 && (
        <div className="flex gap-2">
          <Button variant="ghost" size="compact" disabled={current_page <= 1} onClick={() => onPage(page - 1)}>
            ← Précédent
          </Button>
          <Button variant="ghost" size="compact" disabled={current_page >= last_page} onClick={() => onPage(page + 1)}>
            Suivant →
          </Button>
        </div>
      )}
    </div>
  )
}
