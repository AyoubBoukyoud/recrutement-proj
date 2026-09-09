import { Button } from '@/components/ui'
import type { PaginatedResponse } from '@/types/candidate'
import type { Language } from '@/lib/types'
import { translate } from '@/lib/i18n'

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
  nounPlural,
  language = 'fr',
}: {
  page: number
  data: PaginatedResponse<T> | undefined
  onPage: (page: number) => void
  /** Le nom au singulier — par défaut, un « s » suffit à tout ce qui est compté ici. */
  noun?: string
  /** Forme au pluriel, quand un simple « +s » ne convient pas (allemand, arabe...). */
  nounPlural?: string
  /** Espaces non encore branchés sur `useLanguage()` : défaut `'fr'`, comportement inchangé. */
  language?: Language
}) {
  if (!data || data.total === 0) return null

  const { current_page, last_page, total } = data
  const count = `${total} ${total === 1 ? noun : (nounPlural ?? `${noun}s`)}`

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <span className="helper-text">
        {last_page > 1
          ? translate(language, 'pagination_page_of')
              .replace('{current}', String(current_page))
              .replace('{last}', String(last_page))
              .replace('{count}', count)
          : count}
      </span>

      {last_page > 1 && (
        <div className="flex gap-2">
          <Button variant="ghost" size="compact" disabled={current_page <= 1} onClick={() => onPage(page - 1)}>
            {translate(language, 'pagination_previous')}
          </Button>
          <Button variant="ghost" size="compact" disabled={current_page >= last_page} onClick={() => onPage(page + 1)}>
            {translate(language, 'pagination_next')}
          </Button>
        </div>
      )}
    </div>
  )
}
