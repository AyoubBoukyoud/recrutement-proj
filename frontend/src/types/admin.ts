import type { CandidateLanguage, Education, ShortlistStage } from './candidate'

export type AccountStatus = 'active' | 'inactive' | 'blocked'

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: 'Actif',
  inactive: 'Désactivé',
  blocked: 'Bloqué',
}

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
  email: string | null
  name: string | null
  city: string | null
  account_status: AccountStatus
  availability_status: string | null
  referred_by: string | null
  submitted_at: string | null
  verified_at: string | null
  completion_percent: number
  checklist: AdminChecklist
  documents_awaiting_approval: number
  engagement: Engagement
  top_skills: string[]
  shortlists_count: number
  interviews_count: number
  placements_count: number
}

export type CandidateSkill = {
  id: number
  skill: string
  level: 'debutant' | 'intermediaire' | 'avance' | 'expert'
  years_of_experience: number | null
}

export const SKILL_LEVEL_LABELS: Record<CandidateSkill['level'], string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  expert: 'Expert',
}

/**
 * A recruiter's tracking of one candidate, as the admin sees it — this
 * product has no job-application/interview entity, so "Candidatures" and
 * "Entretiens" on a candidate's dossier are this shortlist pipeline, keyed by
 * `stage`. See RecruiterShortlist on the backend.
 */
export type AdminShortlistEntry = {
  id: number
  stage: ShortlistStage
  notes: string | null
  contact_revealed_at: string | null
  created_at: string
  updated_at: string
  user: { id: number; name: string | null; phone: string }
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
  city: string | null
  date_of_birth: string | null
  availability_status: string | null
  terms_consent_at: string | null
  cndp_consent_at: string | null
  presentation_video_path: string | null
  submitted_at: string | null
  verified_at: string | null
  admin_notes: string | null
  verified_by: { id: number; name: string | null; phone: string } | null
  user: {
    id: number
    name: string | null
    phone: string
    email: string | null
    status: AccountStatus
    status_reason: string | null
    created_at: string
  }
  educations: Education[]
  languages: CandidateLanguage[]
  skills: CandidateSkill[]
  documents: AdminDocument[]
  task_assignments: TaskAssignment[]
  shortlist_entries: AdminShortlistEntry[]
  checklist: AdminChecklist
  completeness: { percent: number; can_submit: boolean }
  engagement: Engagement
}

/** Row shape for /admin/candidates/{id}/activity and /admin/recruiters/{id}/activity. */
export type AdminActivityEvent = {
  at: string
  type: string
  label: string
  meta: Record<string, unknown>
}

export type AdminCompanyProfile = {
  id: number
  user_id: number
  company_name: string | null
  sector: string | null
  city: string | null
  phone: string | null
  website: string | null
  employees_count: number | null
  verified_at: string | null
  verified_by_id: number | null
  verified_by?: { id: number; name: string | null; phone: string } | null
}

export type AdminRecruiterRow = {
  id: number
  name: string | null
  phone: string
  email: string | null
  account_status: AccountStatus
  company_name: string | null
  sector: string | null
  city: string | null
  verified_at: string | null
  shortlists_count: number
  interviewing_count: number
  placed_count: number
  last_activity_at: string | null
  created_at: string
}

export type AdminRecruiterShortlistItem = {
  id: number
  stage: ShortlistStage
  notes: string | null
  contact_revealed_at: string | null
  created_at: string
  updated_at: string
  candidate_profile: {
    id: number
    first_name: string | null
    last_name: string | null
    profession: string | null
    city: string | null
  } | null
}

export type AdminRecruiterDetail = {
  id: number
  name: string | null
  phone: string
  email: string | null
  status: AccountStatus
  status_reason: string | null
  created_at: string
  company: AdminCompanyProfile | null
  shortlist: AdminRecruiterShortlistItem[]
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
    active: number
    profiles_complete: number
    profiles_incomplete: number
    in_shortlist: number
    interviewing: number
    placed: number
  }
  recruiters: {
    total: number
    active: number
    pending_verification: number
    verified: number
    blocked: number
    shortlisted_candidates: number
    interviews_scheduled: number
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
