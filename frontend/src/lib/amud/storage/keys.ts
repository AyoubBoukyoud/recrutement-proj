/**
 * Clés localStorage centralisées pour tout le module `/amud/*`. Remplace les
 * clés ad hoc éparpillées dans les anciens fichiers `lib/amud/local*.ts`
 * (`amud:entreprises:extra`, `amud:rendezvous:all`, `amud:commercial:taches:overrides`…
 * trois conventions différentes) par un seul jeu de clés, chacune contenant
 * la collection ENTIÈRE de l'entité (seed + tout ce qui a été créé/modifié),
 * pas seulement un delta.
 */
export const AMUD_KEYS = {
  candidates: 'amud_candidates',
  recruiters: 'amud_recruiters',
  commercials: 'amud_commercials',
  companies: 'amud_companies',
  offers: 'amud_offers',
  applications: 'amud_applications',
  activities: 'amud_activities',
  callTickets: 'amud_call_tickets',
  tasks: 'amud_tasks',
  followups: 'amud_followups',
  appointments: 'amud_appointments',
  contacts: 'amud_contacts',
  companyContacts: 'amud_company_contacts',
  objectives: 'amud_objectives',
  notifications: 'amud_notifications',
  auditLogs: 'amud_audit_logs',
  users: 'amud_users',
  settings: 'amud_settings',
  interviews: 'amud_interviews',
  interviewFeedback: 'amud_interview_feedback',
  favorites: 'amud_favorites',
  conversations: 'amud_conversations',
  candidateNotes: 'amud_candidate_notes',
  commercialCandidatePrefs: 'amud_commercial_candidate_prefs',
  commercialProfileSettings: 'amud_commercial_profile_settings',
  commercialCandidateNotes: 'amud_commercial_candidate_notes',
  centres: 'amud_centres',
  // Alignées sur les noms EXACTS du cahier des charges (§17) — le préfixe
  // `center_` reste réservé aux collections "méta" du module
  // (`amud_center_users`, `amud_center_activities`, `amud_center_audit_logs`,
  // `amud_center_modification_requests`), pas aux entités elles-mêmes.
  centerStudents: 'amud_students',
  centerTeachers: 'amud_teachers',
  centerFormations: 'amud_formations',
  centerGroups: 'amud_groups',
  centerEnrollments: 'amud_enrollments',
  centerSchedules: 'amud_schedules',
  centerAttendance: 'amud_attendance',
  centerStudentPayments: 'amud_student_payments',
  centerTeacherPayments: 'amud_teacher_payments',
  centerTeacherHours: 'amud_teacher_hours',
  centerTarifs: 'amud_center_tarifs',
  centerLeads: 'amud_leads',
  centerModificationRequests: 'amud_center_modification_requests',
  centerUsers: 'amud_center_users',
  centerActivities: 'amud_center_activities',
  // Nouvelles collections pour les espaces Étudiant et Enseignant
  studentResults: 'amud_student_results',
  teacherResources: 'amud_teacher_resources',
  // Espace Candidat self-service (`/amud/candidat/*`) — distinct de
  // `candidates` (fiche CRM) : profil géré par le candidat lui-même.
  candidateAccounts: 'amud_candidate_accounts',
  candidateAuth: 'amud_candidate_auth',
  candidateDocuments: 'amud_candidate_documents',
  candidateOfferFavorites: 'amud_candidate_offer_favorites',
  candidateActivities: 'amud_candidate_activities',
  // Smart Attendance QR (état d'exécution éphémère, réutilise `centerAttendance`
  // pour les présences elles-mêmes) + Quick Quiz (cahier des charges §11-37).
  centerSessionStates: 'amud_center_session_states',
  quizzes: 'amud_quizzes',
  quizQuestions: 'amud_quiz_questions',
  quizSessions: 'amud_quiz_sessions',
  quizParticipants: 'amud_quiz_participants',
  quizAnswers: 'amud_quiz_answers',
  quizResults: 'amud_quiz_results',
} as const;

export type AmudKey = (typeof AMUD_KEYS)[keyof typeof AMUD_KEYS];

/** Bump cette valeur pour forcer un reseed propre (ex. changement de schéma incompatible). */
export const AMUD_INIT_FLAG = 'amud_init_v2';
