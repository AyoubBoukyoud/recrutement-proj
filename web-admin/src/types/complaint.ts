export type Complaint = {
  id: number
  type: 'text' | 'voice'
  body: string | null
  audio_path: string | null
  status: 'open' | 'in_review' | 'resolved'
  created_at: string
  user: { id: number; name: string | null; phone: string }
}
