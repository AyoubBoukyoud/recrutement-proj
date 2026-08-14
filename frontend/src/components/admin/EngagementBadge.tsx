import { Badge } from '@/components/ui'
import type { Engagement } from '@/types/admin'

/**
 * Whether a candidate is keeping up with the daily hour.
 *
 * Says "not enrolled" rather than "0%" when nothing has ever been assigned:
 * an administrator not handing out work is not the candidate failing to do it,
 * and rendering both as zero hides the one an administrator can fix.
 */
export function EngagementBadge({ engagement }: { engagement: Engagement }) {
  if (engagement.completion_rate === null) {
    return <Badge tone="neutral">non inscrit</Badge>
  }

  if (engagement.overdue > 0) {
    return <Badge tone="pending">{`${engagement.overdue} en retard`}</Badge>
  }

  if (engagement.streak_days > 0) {
    return <Badge tone="done">{`${engagement.streak_days} jours d'affilée`}</Badge>
  }

  return <Badge tone="neutral">{`${engagement.completion_rate} % faits`}</Badge>
}
