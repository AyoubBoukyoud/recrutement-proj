/**
 * Le vivier tel qu'un recruteur le voit. Les profils varient volontairement
 * sur ce que l'interface doit savoir distinguer : niveau certifié contre
 * niveau auto-déclaré, écart entre les deux, vidéo présente ou non, dossier
 * soumis ou encore en brouillon.
 */
import type {
  CandidateDetail,
  CandidateListItem,
  CandidateLanguage,
  ShortlistRow,
} from '../../types/candidate'

const lang = (
  id: number,
  language: CandidateLanguage['language'],
  level: CandidateLanguage['cefr_level'],
  source: CandidateLanguage['source'],
  extra: Partial<CandidateLanguage> = {}
): CandidateLanguage => ({
  id,
  language,
  cefr_level: level,
  self_declared_cefr: level,
  ai_cefr: null,
  ai_assessed_at: null,
  source,
  level_discrepancy: false,
  ...extra,
})

export const MOCK_CANDIDATES: CandidateListItem[] = [
  {
    id: 1,
    first_name: 'Youssef',
    last_name: 'Amrani',
    profession: 'Développeur Full-Stack',
    specialization: 'React / Laravel',
    years_of_experience: 4,
    availability_status: 'immediate',
    languages: [
      lang(1, 'ar', 'C2', 'self_declared'),
      lang(2, 'fr', 'C1', 'certified'),
      lang(3, 'de', 'B1', 'ai_assessed', { ai_cefr: 'B1', ai_assessed_at: '2026-07-28T10:00:00Z' }),
    ],
    has_video: true,
    has_verified_assessment: true,
    submitted: true,
    shortlisted: true,
    shortlist_stage: 'contacted',
    contact_revealed: true,
    updated_at: '2026-08-10T08:30:00Z',
  },
  {
    id: 2,
    first_name: 'Salma',
    last_name: 'Bennis',
    profession: 'Infirmière diplômée',
    specialization: 'Soins intensifs',
    years_of_experience: 6,
    availability_status: 'within_1_month',
    languages: [
      lang(4, 'ar', 'C2', 'self_declared'),
      lang(5, 'fr', 'C1', 'self_declared'),
      // Déclaration et évaluation à deux bandes d'écart : l'interface doit le signaler.
      lang(6, 'de', 'A2', 'ai_assessed', {
        self_declared_cefr: 'B2',
        ai_cefr: 'A2',
        ai_assessed_at: '2026-08-02T14:20:00Z',
        level_discrepancy: true,
      }),
    ],
    has_video: true,
    has_verified_assessment: true,
    submitted: true,
    shortlisted: false,
    shortlist_stage: null,
    contact_revealed: false,
    updated_at: '2026-08-09T16:05:00Z',
  },
  {
    id: 3,
    first_name: 'Karim',
    last_name: 'El Fassi',
    profession: 'Électricien industriel',
    specialization: 'Basse tension',
    years_of_experience: 8,
    availability_status: 'within_2_months',
    languages: [lang(7, 'ar', 'C2', 'self_declared'), lang(8, 'de', 'A2', 'self_declared')],
    has_video: false,
    has_verified_assessment: false,
    submitted: true,
    shortlisted: false,
    shortlist_stage: null,
    contact_revealed: false,
    updated_at: '2026-08-07T11:45:00Z',
  },
  {
    id: 4,
    first_name: 'Imane',
    last_name: 'Ouahbi',
    profession: 'Ingénieure Backend',
    specialization: 'Node.js / PostgreSQL',
    years_of_experience: 3,
    availability_status: 'immediate',
    languages: [
      lang(9, 'ar', 'C2', 'self_declared'),
      lang(10, 'en', 'C1', 'certified'),
      lang(11, 'de', 'B2', 'certified'),
    ],
    has_video: true,
    has_verified_assessment: true,
    submitted: true,
    shortlisted: true,
    shortlist_stage: 'interviewing',
    contact_revealed: true,
    updated_at: '2026-08-11T09:15:00Z',
  },
  {
    id: 5,
    first_name: 'Hamza',
    last_name: 'Rachidi',
    profession: 'Chef de chantier',
    specialization: 'Gros œuvre',
    years_of_experience: 10,
    availability_status: 'within_2_months',
    languages: [lang(12, 'ar', 'C2', 'self_declared'), lang(13, 'fr', 'B2', 'self_declared')],
    has_video: false,
    has_verified_assessment: false,
    // Brouillon : jamais soumis, donc absent des résultats par défaut.
    submitted: false,
    shortlisted: false,
    shortlist_stage: null,
    contact_revealed: false,
    updated_at: '2026-08-05T18:00:00Z',
  },
  {
    id: 6,
    first_name: 'Nadia',
    last_name: 'Cherkaoui',
    profession: 'Aide-soignante',
    specialization: 'Gériatrie',
    years_of_experience: 5,
    availability_status: 'immediate',
    languages: [lang(14, 'ar', 'C2', 'self_declared'), lang(15, 'de', 'B1', 'certified')],
    has_video: true,
    has_verified_assessment: true,
    submitted: true,
    shortlisted: false,
    shortlist_stage: null,
    contact_revealed: false,
    updated_at: '2026-08-12T07:20:00Z',
  },
]

export function mockCandidateDetail(id: number): CandidateDetail | null {
  const item = MOCK_CANDIDATES.find((c) => c.id === id)
  if (!item) return null

  return {
    id: item.id,
    first_name: item.first_name,
    last_name: item.last_name,
    profession: item.profession,
    specialization: item.specialization,
    years_of_experience: item.years_of_experience,
    availability_status: item.availability_status,
    languages: item.languages,
    updated_at: item.updated_at,
    date_of_birth: '1996-03-18',
    presentation_video_path: item.has_video ? 'videos/presentation.mp4' : null,
    submitted_at: item.submitted ? '2026-08-01T09:00:00Z' : null,
    educations: [
      {
        id: 1,
        level: 'Master',
        field: 'Génie logiciel',
        institution: 'ENSIAS, Rabat',
        started_at: '2017-09',
        ended_at: '2019-07',
      },
    ],
    documents: [
      {
        id: 1,
        type: 'cv',
        file_path: 'documents/cv.pdf',
        url: '/assets/mock/cv.pdf',
        verified: true,
        uploaded_at: '2026-08-01T09:05:00Z',
      },
      {
        id: 2,
        type: 'certificate',
        file_path: 'documents/goethe-b1.pdf',
        url: '/assets/mock/goethe-b1.pdf',
        verified: item.has_verified_assessment,
        uploaded_at: '2026-08-02T10:10:00Z',
      },
    ],
    language_assessments: item.has_verified_assessment
      ? [
          {
            id: 1,
            language: 'de',
            predicted_cefr: 'B1',
            status: 'completed',
            failure_reason: null,
            transcript: 'Guten Tag, mein Name ist …',
            duration_seconds: 74,
            words_per_minute: 96,
            filler_word_ratio: 0.04,
            pronunciation_score: 78,
            score_breakdown: null,
            created_at: '2026-08-02T14:20:00Z',
          },
        ]
      : [],
    shortlist: item.shortlisted
      ? {
          id: item.id,
          candidate_profile_id: item.id,
          stage: item.shortlist_stage ?? 'saved',
          notes: null,
          contact_revealed_at: item.contact_revealed ? '2026-08-08T12:00:00Z' : null,
          updated_at: item.updated_at,
        }
      : null,
    contact: item.contact_revealed
      ? { phone: '+212 6 61 23 45 67', email: 'candidat@example.ma', revealed_at: '2026-08-08T12:00:00Z' }
      : null,
  }
}

export const MOCK_SHORTLIST: ShortlistRow[] = MOCK_CANDIDATES.filter((c) => c.shortlisted).map((c) => ({
  id: c.id,
  candidate_profile_id: c.id,
  stage: c.shortlist_stage ?? 'saved',
  notes: null,
  contact_revealed_at: c.contact_revealed ? '2026-08-08T12:00:00Z' : null,
  updated_at: c.updated_at,
  candidate: {
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    profession: c.profession,
    specialization: c.specialization,
    years_of_experience: c.years_of_experience,
    availability_status: c.availability_status,
    languages: c.languages,
    has_verified_assessment: c.has_verified_assessment,
    submitted: c.submitted,
    shortlisted: c.shortlisted,
    shortlist_stage: c.shortlist_stage,
    contact_revealed: c.contact_revealed,
    updated_at: c.updated_at,
  },
  contact: c.contact_revealed
    ? { phone: '+212 6 61 23 45 67', email: 'candidat@example.ma', revealed_at: '2026-08-08T12:00:00Z' }
    : null,
}))
