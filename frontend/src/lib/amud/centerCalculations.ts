import type { CenterStudent } from '@/data/amud/centerStudents';
import type { CenterTeacher } from '@/data/amud/centerTeachers';
import type { CenterFormation } from '@/data/amud/centerFormations';
import type { CenterGroup } from '@/data/amud/centerGroups';
import type { CenterSchedule } from '@/data/amud/centerSchedules';
import type { CenterAttendanceRecord, AttendanceStatus } from '@/data/amud/centerAttendance';
import type { CenterStudentPayment, PaymentStatus } from '@/data/amud/centerStudentPayments';

/**
 * Calculs partagés (cahier des charges §63 : "ne jamais coder les
 * statistiques en dur") — utilisés à la fois par le dashboard Centre, la
 * fiche centre Admin et les statistiques Commercial, pour que les 3 espaces
 * affichent toujours le même nombre à partir des mêmes collections.
 */

export function computePaymentStatus(prixTotal: number, montantPaye: number): PaymentStatus {
  if (montantPaye >= prixTotal) return 'PAYE';
  if (montantPaye > 0) return 'PARTIEL';
  return 'IMPAYE';
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function sessionHours(schedule: Pick<CenterSchedule, 'heureDebut' | 'heureFin'>): number {
  return Math.max(0, (timeToMinutes(schedule.heureFin) - timeToMinutes(schedule.heureDebut)) / 60);
}

export function computeAttendanceRates(records: CenterAttendanceRecord[]) {
  const total = records.length;
  if (total === 0) return { presenceRate: 0, absenceRate: 0, retardRate: 0, excuseRate: 0, total: 0 };
  const count = (s: AttendanceStatus) => records.filter((r) => r.statut === s).length;
  return {
    presenceRate: Math.round((count('PRESENT') / total) * 100),
    absenceRate: Math.round((count('ABSENT') / total) * 100),
    retardRate: Math.round((count('RETARD') / total) * 100),
    excuseRate: Math.round((count('EXCUSE') / total) * 100),
    total,
  };
}

export function computeTeacherHours(teacherId: string, schedules: CenterSchedule[], upToDate?: string): number {
  return schedules.filter((s) => s.enseignantId === teacherId && (!upToDate || s.date <= upToDate)).reduce((sum, s) => sum + sessionHours(s), 0);
}

export function computeTeacherRemuneration(teacher: Pick<CenterTeacher, 'id' | 'tauxHoraire'>, schedules: CenterSchedule[], upToDate?: string) {
  const heures = computeTeacherHours(teacher.id, schedules, upToDate);
  return { heures, montant: Math.round(heures * teacher.tauxHoraire) };
}

export type CenterDashboardStats = {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeFormations: number;
  activeGroups: number;
  coursAujourdhui: number;
  tauxPresence: number;
  revenus: number;
  paiementsEnAttente: number;
  remunerationsDues: number;
};

export function computeCenterStats(
  centerId: string,
  data: {
    students: CenterStudent[];
    teachers: CenterTeacher[];
    formations: CenterFormation[];
    groups: CenterGroup[];
    schedules: CenterSchedule[];
    attendance: CenterAttendanceRecord[];
    studentPayments: CenterStudentPayment[];
    today: string;
  },
): CenterDashboardStats {
  const students = data.students.filter((s) => s.centerId === centerId);
  const teachers = data.teachers.filter((t) => t.centerId === centerId);
  const formations = data.formations.filter((f) => f.centerId === centerId);
  const groups = data.groups.filter((g) => g.centerId === centerId);
  const schedules = data.schedules.filter((s) => s.centerId === centerId);
  const attendance = data.attendance.filter((a) => a.centerId === centerId);
  const payments = data.studentPayments.filter((p) => p.centerId === centerId);

  const { presenceRate } = computeAttendanceRates(attendance);
  const revenus = payments.reduce((sum, p) => sum + p.montantPaye, 0);
  const paiementsEnAttente = payments.reduce((sum, p) => sum + Math.max(0, p.prixTotal - p.montantPaye), 0);
  const remunerationsDues = teachers.reduce((sum, t) => sum + computeTeacherRemuneration(t, schedules, data.today).montant, 0);

  return {
    totalStudents: students.length,
    activeStudents: students.filter((s) => s.statut === 'Actif').length,
    totalTeachers: teachers.length,
    activeFormations: formations.filter((f) => f.statut === 'Active').length,
    activeGroups: groups.filter((g) => g.statut === 'Actif').length,
    coursAujourdhui: schedules.filter((s) => s.date === data.today).length,
    tauxPresence: presenceRate,
    revenus,
    paiementsEnAttente,
    remunerationsDues,
  };
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
