import type { CandidateLanguage, Education } from './candidate'

export type TaskCategory = 'language' | 'documents' | 'culture' | 'admin' | 'other'

/** One preparation activity in the catalogue. */
export type Task = {
  id: number
  title: string
  description: string | null
  category: TaskCategory
  estimated_minutes: number
  is_active: boolean
  assignments_count?: number
}

export type TaskAssignment = {
  id: number
  task_id: number
  assigned_for: string
  status: 'assigned' | 'completed' | 'skipped'
  completed_at: string | null
  minutes_spent: number | null
  candidate_note: string | null
  admin_feedback: string | null
  /** Still open, and its day has passed. */
  is_overdue: boolean
  task?: Task
  assigned_by?: { id: number; name: string | null; phone: string } | null
}

/**
 * "Is this candidate keeping up?" — `completion_rate` is null rather than 0
 * when nothing was ever assigned, because nobody assigning work is not the
 * candidate's failing.
 */
export type Engagement = {
  assigned: number
  completed: number
  completion_rate: number | null
  overdue: number
  minutes_last_7_days: number
  daily_target_minutes: number
  streak_days: number
  active_today: boolean
  last_activity_on: string | null
}

export type AdminChecklist = {
  profile_completed: boolean
  cv_uploaded: boolean
  certificates_uploaded: boolean
  video_recorded: boolean
}

export type AdminCandidateRow = {
  id: number
  phone: string
  name: string | null
  availability_status: string | null
  referred_by: string | null
  submitted_at: string | null
  verified_at: string | null
  completion_percent: number
  checklist: AdminChecklist
  documents_awaiting_approval: number
  engagement: Engagement
}

/** A document with the administrative verdict on it, which recruiters never see. */
export type AdminDocument = {
  id: number
  type: 'cv' | 'certificate' | 'diploma'
  file_path: string
  url: string | null
  ocr_status: string
  approval_status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_at: string | null
  reviewed_by?: { id: number; name: string | null } | null
}

export type AdminCandidateDetail = {
  id: number
  first_name: string | null
  last_name: string | null
  profession: string | null
  specialization: string | null
  years_of_experience: number | null
  date_of_birth: string | null
  availability_status: string | null
  terms_consent_at: string | null
  cndp_consent_at: string | null
  presentation_video_path: string | null
  submitted_at: string | null
  verified_at: string | null
  admin_notes: string | null
  verified_by: { id: number; name: string | null; phone: string } | null
  user: { id: number; name: string | null; phone: string; created_at: string }
  educations: Education[]
  languages: CandidateLanguage[]
  documents: AdminDocument[]
  task_assignments: TaskAssignment[]
  checklist: AdminChecklist
  completeness: { percent: number; can_submit: boolean }
  engagement: Engagement
}

export type AdminUser = {
  id: number
  name: string | null
  phone: string
  email: string | null
  roles: string[]
  has_candidate_profile: boolean
  created_at: string
}

export type Metrics = {
  candidates: {
    total: number
    submitted: number
    verified: number
    discoverable: number
    drafts: number
    new_this_week: number
  }
  documents: {
    total: number
    awaiting_approval: number
    approved: number
    rejected: number
    unreadable: number
    needs_candidate_review: number
  }
  complaints: { open: number; in_review: number; resolved: number; unannounced: number }
  assessments: { total: number; completed: number; failed: number; in_flight: number }
  internship: {
    assigned_today: number
    completed_today: number
    overdue: number
    active_candidates_today: number
    candidates_with_assignments: number
  }
  growth: { users: number; referred_registrations: number; referred_this_week: number }
}
