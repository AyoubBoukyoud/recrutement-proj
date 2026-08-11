export type ComplaintStatus = 'open' | 'in_review' | 'resolved'

export type Complaint = {
  id: number
  type: 'text' | 'voice'
  body: string | null
  audio_path: string | null
  /** Playable URL for a voice note, built server-side. */
  audio_url: string | null
  status: ComplaintStatus
  /** What an administrator wrote back; the candidate sees this in the app. */
  admin_response: string | null
  responded_at: string | null
  responded_by: { id: number; name: string | null; phone: string } | null
  /**
   * When an alert actually reached somebody. Null means nothing was sent —
   * no administrator has an email and no Slack webhook is configured.
   */
  admin_notified_at: string | null
  created_at: string
  user: { id: number; name: string | null; phone: string }
}
