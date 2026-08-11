import { Badge } from '../ui'
import type { Engagement } from '../../types/admin'

/**
 * Whether a candidate is keeping up with the daily hour.
 *
 * Says "not enrolled" rather than "0%" when nothing has ever been assigned:
 * an administrator not handing out work is not the candidate failing to do it,
 * and rendering both as zero hides the one an administrator can fix.
 */
export function EngagementBadge({ engagement }: { engagement: Engagement }) {
  if (engagement.completion_rate === null) {
    return <Badge>not enrolled</Badge>
  }

  if (engagement.overdue > 0) {
    return <Badge>{`${engagement.overdue} overdue`}</Badge>
  }

  if (engagement.streak_days > 0) {
    return <Badge tone="done">{`${engagement.streak_days}-day streak`}</Badge>
  }

  return <Badge>{`${engagement.completion_rate}% done`}</Badge>
}
