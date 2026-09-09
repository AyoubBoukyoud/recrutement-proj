export type Language = 'fr' | 'ar' | 'en' | 'de'
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type AvailabilityStatus = 'immediate' | 'within_1_month' | 'within_2_months'

export type CandidateLanguage = {
  id: number
  language: Language
  /** The effective level. `source` says which piece of evidence produced it. */
  cefr_level: CefrLevel | null
  /** What the candidate claims about themselves. */
  self_declared_cefr: CefrLevel | null
  /** What the last assessment predicted — kept even when it did not win. */
  ai_cefr: CefrLevel | null
  ai_assessed_at: string | null
  source: 'self_declared' | 'certified' | 'ai_assessed' | string
  /** The declaration and the assessment are two CEFR bands or more apart. */
  level_discrepancy: boolean
}

export type Education = {
  id: number
  level: string
  field: string | null
  institution: string | null
  started_at: string | null
  ended_at: string | null
}

/**
 * A document as a recruiter receives it. Deliberately no `ocr_status`: our
 * scanner's verdict is not a verdict on the candidate. `verified` means the
 * candidate attached it as proof of a language level.
 */
export type CandidateDocument = {
  id: number
  type: 'cv' | 'certificate' | 'diploma'
  file_path: string
  url: string | null
  verified: boolean
  uploaded_at: string
}

export type ScoreComponent = {
  key: string
  label: string
  detail: string
  contribution: number
  max: number
}

export type ScoreBreakdown = {
  components: ScoreComponent[]
  penalty: ScoreComponent
  total: number
  max_total: number
  estimated_from_clarity: boolean
  pronunciation: {
    score: number
    mean_confidence: number
    unclear_word_ratio: number
    unclear_words: { word: string; probability: number }[]
    pause_count: number
    pause_seconds: number
    articulation_rate: number
  } | null
}

export type LanguageAssessmentResult = {
  id: number
  language: Language
  predicted_cefr: CefrLevel | null
  status: string
  failure_reason: string | null
  transcript: string | null
  duration_seconds: number | null
  words_per_minute: number | null
  filler_word_ratio: number | null
  /** 0-100: how confidently the speech engine recognised the words. */
  pronunciation_score: number | null
  score_breakdown: ScoreBreakdown | null
  created_at: string
}

export type ShortlistStage = 'saved' | 'contacted' | 'interviewing' | 'placed' | 'rejected'

export type ShortlistEntry = {
  id: number
  candidate_profile_id: number
  stage: ShortlistStage
  notes: string | null
  contact_revealed_at: string | null
  updated_at: string
}

/** Released only through the contact endpoint, which records the disclosure. */
export type CandidateContact = {
  phone: string | null
  email: string | null
  revealed_at?: string | null
}

export type ShortlistRow = ShortlistEntry & {
  candidate: (Omit<CandidateListItem, 'has_video'> & { languages: CandidateLanguage[] }) | null
  contact: CandidateContact | null
}

export type CandidateListItem = {
  id: number
  first_name: string | null
  last_name: string | null
  profession: string | null
  specialization: string | null
  years_of_experience: number | null
  availability_status: AvailabilityStatus | null
  languages: CandidateLanguage[]
  has_video: boolean
  has_verified_assessment: boolean
  /** The candidate declared the dossier finished, rather than leaving it a draft. */
  submitted: boolean
  shortlisted: boolean
  shortlist_stage: ShortlistStage | null
  contact_revealed: boolean
  updated_at: string
}

export type CandidateDetail = Omit<
  CandidateListItem,
  'has_video' | 'has_verified_assessment' | 'submitted' | 'shortlisted' | 'shortlist_stage' | 'contact_revealed'
> & {
  date_of_birth: string | null
  presentation_video_path: string | null
  /** Short-lived signed URL; null when the video does not exist or this viewer is not authorized. */
  video_url: string | null
  submitted_at: string | null
  educations: Education[]
  documents: CandidateDocument[]
  language_assessments: LanguageAssessmentResult[]
  shortlist: ShortlistEntry | null
  contact: CandidateContact | null
}

export type PaginatedResponse<T> = {
  data: T[]
  current_page: number
  last_page: number
  total: number
}
