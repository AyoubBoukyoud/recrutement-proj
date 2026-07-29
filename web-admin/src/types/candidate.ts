export type Language = 'fr' | 'ar' | 'en' | 'de'
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type AvailabilityStatus = 'immediate' | 'within_1_month' | 'within_2_months'

export type CandidateLanguage = {
  id: number
  language: Language
  cefr_level: CefrLevel | null
  source: string
}

export type Education = {
  id: number
  level: string
  field: string | null
  institution: string | null
  started_at: string | null
  ended_at: string | null
}

export type CandidateDocument = {
  id: number
  type: 'cv' | 'certificate' | 'diploma'
  file_path: string
  ocr_status: string
}

export type LanguageAssessmentResult = {
  id: number
  language: Language
  predicted_cefr: CefrLevel | null
  status: string
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
}

export type CandidateDetail = CandidateListItem & {
  date_of_birth: string | null
  presentation_video_path: string | null
  educations: Education[]
  documents: CandidateDocument[]
  language_assessments: LanguageAssessmentResult[]
}

export type PaginatedResponse<T> = {
  data: T[]
  current_page: number
  last_page: number
  total: number
}
