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
} as const;

export type AmudKey = (typeof AMUD_KEYS)[keyof typeof AMUD_KEYS];

/** Bump cette valeur pour forcer un reseed propre (ex. changement de schéma incompatible). */
export const AMUD_INIT_FLAG = 'amud_init_v1';
