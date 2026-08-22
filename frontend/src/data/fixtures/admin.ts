/**
 * Les données de l'espace administrateur. Les lignes couvrent les états que
 * les écrans doivent savoir peindre : dossier vérifié, dossier soumis en
 * attente, brouillon, et candidat décroché (engagement en retard).
 */
import type {
  AdminActivityEvent,
  AdminCandidateDetail,
  AdminCandidateRow,
  AdminRecruiterDetail,
  AdminRecruiterRow,
  AdminUser,
  Engagement,
  Metrics,
  Task,
} from '../../types/admin'
import type { Complaint } from '../../types/complaint'

const engagement = (over: Partial<Engagement> = {}): Engagement => ({
  assigned: 12,
  completed: 9,
  completion_rate: 75,
  overdue: 1,
  minutes_last_7_days: 210,
  daily_target_minutes: 30,
  streak_days: 4,
  active_today: true,
  last_activity_on: '2026-08-12',
  ...over,
})

export const MOCK_ADMIN_CANDIDATES: AdminCandidateRow[] = [
  {
    id: 1,
    phone: '+212661234567',
    email: 'youssef.amrani@example.ma',
    name: 'Youssef Amrani',
    city: 'Casablanca',
    account_status: 'active',
    availability_status: 'immediate',
    referred_by: 'Agent Nord',
    submitted_at: '2026-08-01T09:00:00Z',
    verified_at: '2026-08-03T11:00:00Z',
    completion_percent: 100,
    checklist: { profile_completed: true, cv_uploaded: true, certificates_uploaded: true, video_recorded: true },
    documents_awaiting_approval: 0,
    engagement: engagement(),
    top_skills: ['JavaScript', 'PHP', 'Docker'],
    shortlists_count: 2,
    interviews_count: 1,
    placements_count: 0,
  },
  {
    id: 2,
    phone: '+212662345678',
    email: 'salma.bennis@example.ma',
    name: 'Salma Bennis',
    city: 'Rabat',
    account_status: 'active',
    availability_status: 'within_1_month',
    referred_by: null,
    submitted_at: '2026-08-04T15:30:00Z',
    verified_at: null,
    completion_percent: 85,
    checklist: { profile_completed: true, cv_uploaded: true, certificates_uploaded: true, video_recorded: false },
    documents_awaiting_approval: 2,
    engagement: engagement({ completion_rate: 60, overdue: 3, streak_days: 0, active_today: false }),
    top_skills: ['Prise en charge patient', 'Hygiène HACCP'],
    shortlists_count: 1,
    interviews_count: 0,
    placements_count: 0,
  },
  {
    id: 3,
    phone: '+212663456789',
    email: 'karim.elfassi@example.ma',
    name: 'Karim El Fassi',
    city: 'Tanger',
    account_status: 'inactive',
    availability_status: 'within_2_months',
    referred_by: 'Agent Sud',
    submitted_at: '2026-08-06T10:15:00Z',
    verified_at: null,
    completion_percent: 70,
    checklist: { profile_completed: true, cv_uploaded: true, certificates_uploaded: false, video_recorded: false },
    documents_awaiting_approval: 1,
    engagement: engagement({ assigned: 8, completed: 3, completion_rate: 38, overdue: 4 }),
    top_skills: ['Soudure TIG'],
    shortlists_count: 0,
    interviews_count: 0,
    placements_count: 0,
  },
  {
    id: 5,
    phone: '+212665678901',
    email: null,
    name: 'Hamza Rachidi',
    city: null,
    account_status: 'blocked',
    availability_status: null,
    referred_by: null,
    // Jamais soumis : rien n'a encore été assigné, d'où un taux nul plutôt que zéro.
    submitted_at: null,
    verified_at: null,
    completion_percent: 35,
    checklist: { profile_completed: false, cv_uploaded: true, certificates_uploaded: false, video_recorded: false },
    documents_awaiting_approval: 0,
    engagement: engagement({
      assigned: 0,
      completed: 0,
      completion_rate: null,
      overdue: 0,
      minutes_last_7_days: 0,
      streak_days: 0,
      active_today: false,
      last_activity_on: null,
    }),
    top_skills: [],
    shortlists_count: 0,
    interviews_count: 0,
    placements_count: 0,
  },
]

export function mockAdminCandidateDetail(id: number): AdminCandidateDetail | null {
  const row = MOCK_ADMIN_CANDIDATES.find((c) => c.id === id)
  if (!row) return null

  const [firstName, ...rest] = (row.name ?? 'Candidat').split(' ')

  return {
    id: row.id,
    first_name: firstName,
    last_name: rest.join(' ') || null,
    profession: 'Développeur Full-Stack',
    specialization: 'React / Laravel',
    years_of_experience: 4,
    city: row.city,
    date_of_birth: '1996-03-18',
    availability_status: row.availability_status,
    terms_consent_at: '2026-07-30T08:00:00Z',
    cndp_consent_at: '2026-07-30T08:00:00Z',
    presentation_video_path: row.checklist.video_recorded ? 'videos/presentation.mp4' : null,
    submitted_at: row.submitted_at,
    verified_at: row.verified_at,
    admin_notes: row.verified_at ? 'Dossier complet, entretien planifié.' : null,
    verified_by: row.verified_at ? { id: 301, name: 'Administrateur', phone: '+212600000004' } : null,
    user: {
      id: 100 + row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      status: row.account_status,
      status_reason: null,
      created_at: '2026-07-29T12:00:00Z',
    },
    skills: row.top_skills.map((skill, i) => ({ id: i + 1, skill, level: 'intermediaire', years_of_experience: 2 })),
    shortlist_entries:
      row.shortlists_count > 0
        ? [
            {
              id: row.id,
              stage: row.interviews_count > 0 ? 'interviewing' : 'saved',
              notes: null,
              contact_revealed_at: null,
              created_at: '2026-08-05T10:00:00Z',
              updated_at: '2026-08-09T10:00:00Z',
              user: { id: 201, name: 'TechGmbH Munich', phone: '+212600000003' },
            },
          ]
        : [],
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
    languages: [
      {
        id: 1,
        language: 'de',
        cefr_level: 'B1',
        self_declared_cefr: 'B1',
        ai_cefr: 'B1',
        ai_assessed_at: '2026-08-02T14:20:00Z',
        source: 'ai_assessed',
        level_discrepancy: false,
      },
    ],
    documents: [
      {
        id: 1,
        type: 'cv',
        file_path: 'documents/cv.pdf',
        url: '/assets/mock/cv.pdf',
        ocr_status: 'completed',
        approval_status: 'approved',
        rejection_reason: null,
        reviewed_at: '2026-08-03T10:00:00Z',
        reviewed_by: { id: 301, name: 'Administrateur' },
      },
      {
        id: 2,
        type: 'certificate',
        file_path: 'documents/goethe-b1.jpg',
        url: '/assets/mock/goethe-b1.jpg',
        ocr_status: 'needs_review',
        // En attente : c'est ce cas qui fait apparaître les actions approuver/rejeter.
        approval_status: 'pending',
        rejection_reason: null,
        reviewed_at: null,
        reviewed_by: null,
      },
    ],
    task_assignments: [
      {
        id: 1,
        task_id: 1,
        assigned_for: '2026-08-12',
        status: 'completed',
        completed_at: '2026-08-12T09:30:00Z',
        minutes_spent: 25,
        candidate_note: 'Leçon terminée.',
        admin_feedback: null,
        is_overdue: false,
        task: {
          id: 1,
          title: 'Leçon A1 — se présenter',
          description: null,
          category: 'language',
          estimated_minutes: 30,
          is_active: true,
        },
      },
      {
        id: 2,
        task_id: 3,
        assigned_for: '2026-08-11',
        status: 'assigned',
        completed_at: null,
        minutes_spent: null,
        candidate_note: null,
        admin_feedback: null,
        is_overdue: true,
        task: {
          id: 3,
          title: 'Téléverser le diplôme traduit',
          description: null,
          category: 'documents',
          estimated_minutes: 15,
          is_active: true,
        },
      },
    ],
    checklist: row.checklist,
    completeness: { percent: row.completion_percent, can_submit: row.completion_percent >= 80 },
    engagement: row.engagement,
  }
}

export const MOCK_METRICS: Metrics = {
  candidates: {
    total: 148,
    submitted: 96,
    verified: 61,
    discoverable: 58,
    drafts: 52,
    new_this_week: 14,
    active: 139,
    profiles_complete: 61,
    profiles_incomplete: 87,
    in_shortlist: 34,
    interviewing: 9,
    placed: 4,
  },
  recruiters: {
    total: 12,
    active: 10,
    pending_verification: 3,
    verified: 9,
    blocked: 1,
    shortlisted_candidates: 34,
    interviews_scheduled: 9,
  },
  documents: {
    total: 312,
    awaiting_approval: 17,
    approved: 268,
    rejected: 11,
    unreadable: 9,
    needs_candidate_review: 7,
  },
  complaints: { open: 4, in_review: 2, resolved: 23, unannounced: 1 },
  assessments: { total: 121, completed: 104, failed: 8, in_flight: 9 },
  internship: {
    assigned_today: 38,
    completed_today: 21,
    overdue: 12,
    active_candidates_today: 27,
    candidates_with_assignments: 63,
  },
  growth: { users: 173, referred_registrations: 44, referred_this_week: 6 },
}

/**
 * Ce produit n'a pas d'entité « offre d'emploi »/« candidature » : un
 * recruteur est un `User` avec le rôle Spatie « Company » plus un
 * `CompanyProfile`, et son pipeline est la sélection (RecruiterShortlist) —
 * voir `AdminRecruiterController` côté backend. Ces maquettes reflètent
 * cette même forme, pas une couche job-board inventée pour l'occasion.
 */
export const MOCK_ADMIN_RECRUITERS: AdminRecruiterRow[] = [
  {
    id: 201,
    name: 'TechGmbH Munich',
    phone: '+212600000003',
    email: 'rh@techgmbh.de',
    account_status: 'active',
    company_name: 'TechGmbH Munich',
    sector: 'IT',
    city: 'Casablanca',
    verified_at: '2026-08-05T09:00:00Z',
    shortlists_count: 3,
    interviewing_count: 1,
    placed_count: 0,
    last_activity_at: '2026-08-09T10:00:00Z',
    created_at: '2026-06-14T09:00:00Z',
  },
  {
    id: 202,
    name: 'Klinik Nord GmbH',
    phone: '+212600000006',
    email: 'contact@kliniknord.de',
    account_status: 'active',
    company_name: 'Klinik Nord GmbH',
    sector: 'Santé',
    city: 'Rabat',
    verified_at: null,
    shortlists_count: 1,
    interviewing_count: 0,
    placed_count: 0,
    last_activity_at: '2026-08-06T14:00:00Z',
    created_at: '2026-07-01T09:00:00Z',
  },
  {
    id: 203,
    name: 'BauWerk AG',
    phone: '+212600000007',
    email: null,
    account_status: 'blocked',
    company_name: 'BauWerk AG',
    sector: 'BTP',
    city: 'Tanger',
    verified_at: null,
    shortlists_count: 0,
    interviewing_count: 0,
    placed_count: 0,
    last_activity_at: null,
    created_at: '2026-07-10T09:00:00Z',
  },
]

export function mockAdminRecruiterDetail(id: number): AdminRecruiterDetail | null {
  const row = MOCK_ADMIN_RECRUITERS.find((r) => r.id === id)
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    status: row.account_status,
    status_reason: null,
    created_at: row.created_at,
    company: {
      id: row.id,
      user_id: row.id,
      company_name: row.company_name,
      sector: row.sector,
      city: row.city,
      phone: row.phone,
      website: null,
      employees_count: 40,
      verified_at: row.verified_at,
      verified_by_id: row.verified_at ? 301 : null,
      verified_by: row.verified_at ? { id: 301, name: 'Administrateur', phone: '+212600000004' } : null,
    },
    shortlist:
      row.shortlists_count > 0
        ? [
            {
              id: row.id,
              stage: row.interviewing_count > 0 ? 'interviewing' : 'saved',
              notes: null,
              contact_revealed_at: null,
              created_at: '2026-08-05T10:00:00Z',
              updated_at: row.last_activity_at ?? '2026-08-05T10:00:00Z',
              candidate_profile: { id: 1, first_name: 'Youssef', last_name: 'Amrani', profession: 'Développeur Full-Stack', city: 'Casablanca' },
            },
          ]
        : [],
  }
}

/** Un flux dérivé simplifié — le vrai backend le compose depuis plusieurs tables (voir App\Services\ActivityFeed). */
export function mockAdminActivity(name: string): AdminActivityEvent[] {
  return [
    { at: '2026-08-09T10:00:00Z', type: 'shortlisted', label: `${name} a été ajouté à une sélection`, meta: {} },
    { at: '2026-08-03T11:00:00Z', type: 'profile_verified', label: 'Profil vérifié par Administrateur', meta: {} },
    { at: '2026-07-29T12:00:00Z', type: 'registration', label: 'Compte créé', meta: {} },
  ]
}

export const MOCK_TASKS: Task[] = [
  {
    id: 1,
    title: 'Leçon A1 — se présenter',
    description: 'Vocabulaire de base et présentation personnelle.',
    category: 'language',
    estimated_minutes: 30,
    is_active: true,
    assignments_count: 42,
  },
  {
    id: 2,
    title: 'Leçon A2 — le vocabulaire du métier',
    description: null,
    category: 'language',
    estimated_minutes: 30,
    is_active: true,
    assignments_count: 28,
  },
  {
    id: 3,
    title: 'Téléverser le diplôme traduit',
    description: 'Traduction assermentée exigée par la reconnaissance allemande.',
    category: 'documents',
    estimated_minutes: 15,
    is_active: true,
    assignments_count: 61,
  },
  {
    id: 4,
    title: 'Codes culturels au travail',
    description: 'Ponctualité, hiérarchie, communication directe.',
    category: 'culture',
    estimated_minutes: 20,
    is_active: true,
    assignments_count: 19,
  },
  {
    id: 5,
    title: 'Ancien module de visa',
    description: 'Remplacé par la procédure 2026.',
    category: 'admin',
    estimated_minutes: 25,
    // Désactivée : l'interface doit la distinguer d'une tâche vivante.
    is_active: false,
    assignments_count: 3,
  },
]

export const MOCK_ROLES: string[] = ['Administrator', 'Company', 'Commercial Agent', 'User']

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 301,
    name: 'Administrateur',
    phone: '+212600000004',
    email: 'admin@example.ma',
    roles: ['Administrator'],
    has_candidate_profile: false,
    created_at: '2026-06-01T09:00:00Z',
  },
  {
    id: 201,
    name: 'TechGmbH Munich',
    phone: '+212600000003',
    email: 'rh@techgmbh.de',
    roles: ['Company'],
    has_candidate_profile: false,
    created_at: '2026-06-14T09:00:00Z',
  },
  {
    id: 401,
    name: 'Agent Nord',
    phone: '+212600000005',
    email: null,
    roles: ['Commercial Agent'],
    has_candidate_profile: false,
    created_at: '2026-06-20T09:00:00Z',
  },
  {
    id: 101,
    name: 'Youssef Amrani',
    phone: '+212661234567',
    email: 'youssef.amrani@example.ma',
    roles: ['User'],
    has_candidate_profile: true,
    created_at: '2026-07-29T12:00:00Z',
  },
]

export const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: 1,
    type: 'text',
    body: "Je n'arrive pas à téléverser mon diplôme, la page reste bloquée.",
    audio_path: null,
    audio_url: null,
    status: 'open',
    admin_response: null,
    responded_at: null,
    responded_by: null,
    admin_notified_at: '2026-08-11T09:05:00Z',
    created_at: '2026-08-11T09:00:00Z',
    user: { id: 102, name: 'Salma Bennis', phone: '+212662345678' },
  },
  {
    id: 2,
    type: 'voice',
    body: null,
    audio_path: 'complaints/2.webm',
    audio_url: '/assets/mock/complaint-2.webm',
    status: 'in_review',
    admin_response: null,
    responded_at: null,
    responded_by: null,
    // Personne n'a été prévenu : aucun e-mail admin, aucun webhook configuré.
    admin_notified_at: null,
    created_at: '2026-08-10T17:40:00Z',
    user: { id: 103, name: 'Karim El Fassi', phone: '+212663456789' },
  },
  {
    id: 3,
    type: 'text',
    body: 'Mon niveau d\'allemand affiché ne correspond pas à mon certificat Goethe.',
    audio_path: null,
    audio_url: null,
    status: 'resolved',
    admin_response: 'Certificat vérifié, niveau corrigé en B2. Merci de votre signalement.',
    responded_at: '2026-08-09T11:20:00Z',
    responded_by: { id: 301, name: 'Administrateur', phone: '+212600000004' },
    admin_notified_at: '2026-08-08T14:05:00Z',
    created_at: '2026-08-08T14:00:00Z',
    user: { id: 101, name: 'Youssef Amrani', phone: '+212661234567' },
  },
]
