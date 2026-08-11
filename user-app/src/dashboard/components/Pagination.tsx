import { Button } from './ui'
import type { PaginatedResponse } from '../types/candidate'

/**
 * The API has always paginated at 20 and nothing ever asked for page two, so
 * candidate #21 onward was invisible without anyone being told. Rendered
 * whenever there is more than one page — and the total is shown even when
 * there is not, because "12 candidates" is the answer to the question the
 * recruiter actually asked.
 */
export function Pagination<T>({
  page,
  data,
  onPage,
}: {
  page: number
  data: PaginatedResponse<T> | undefined
  onPage: (page: number) => void
}) {
  if (!data || data.total === 0) return null

  const { current_page, last_page, total } = data

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--sp-md)',
        flexWrap: 'wrap',
      }}
    >
      <span className="helper-text">
        {last_page > 1
          ? `Page ${current_page} of ${last_page} · ${total} candidate${total === 1 ? '' : 's'}`
          : `${total} candidate${total === 1 ? '' : 's'}`}
      </span>

      {last_page > 1 && (
        <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
          <Button
            variant="ghost"
            size="compact"
            disabled={current_page <= 1}
            onClick={() => onPage(page - 1)}
          >
            ← Previous
          </Button>
          <Button
            variant="ghost"
            size="compact"
            disabled={current_page >= last_page}
            onClick={() => onPage(page + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  )
}
