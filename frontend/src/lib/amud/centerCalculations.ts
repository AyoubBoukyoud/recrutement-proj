import type { CenterStudent } from '@/data/amud/centerStudents';
import type { CenterTeacher } from '@/data/amud/centerTeachers';
import type { CenterFormation } from '@/data/amud/centerFormations';
import type { CenterGroup } from '@/data/amud/centerGroups';
import type { CenterEnrollment } from '@/data/amud/centerEnrollments';
import type { CenterSchedule } from '@/data/amud/centerSchedules';
import type { CenterAttendanceRecord, AttendanceStatus } from '@/data/amud/centerAttendance';
import { PAYMENT_STATUS_LABELS, type CenterStudentPayment, type PaymentStatus } from '@/data/amud/centerStudentPayments';
import { bucketTimeSeries, comparePeriods, inRange, parseFrDate, previousPeriodRange, type PeriodRange } from '@/lib/amud/analytics/period';
import { countBy, sum, type Count } from '@/lib/amud/analytics/aggregate';

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

/*
 * ------------------------------------------------------------------
 * Statistiques centre (`/amud/centre/statistiques`) — calculs additionnels
 * pour les graphiques dynamiques, en plus des fonctions ci-dessus déjà
 * consommées par le dashboard/fiche admin/finance. Les tableaux passés en
 * argument sont déjà scopés au centre courant par l'appelant (même
 * convention que `getRecruiterStats`).
 * ------------------------------------------------------------------
 */

/** Évolution des inscriptions (line chart) — bucket auto jour/semaine/mois selon `range`. */
export function computeStudentsEvolution(students: CenterStudent[], range: PeriodRange): Count[] {
  return bucketTimeSeries(students, (s) => s.dateInscription, range);
}

/** Répartition des étudiants par niveau (bar chart) — seuls les niveaux réellement présents. */
export function computeStudentsByLevel(students: CenterStudent[]): Count[] {
  return countBy(students, (s) => s.niveau);
}

/**
 * Répartition des étudiants par formation (donut chart). `CenterStudent` ne
 * référence pas directement de formation : le rattachement passe par
 * `CenterEnrollment` (studentId → groupId) puis `CenterGroup.formationId`
 * (l'entité `CenterEnrollment` remplace l'ancien `CenterGroup.studentIds`,
 * voir `centerTypes.ts`). On ne compte que les inscriptions `ACTIF`, un
 * étudiant n'est compté qu'une fois par formation même s'il a plusieurs
 * groupes de la même formation.
 */
export function computeFormationDistribution(students: CenterStudent[], groups: CenterGroup[], enrollments: CenterEnrollment[], formations: CenterFormation[]): Count[] {
  const validStudentIds = new Set(students.map((s) => s.id));
  const groupToFormation = new Map(groups.map((g) => [g.id, g.formationId]));
  const studentsByFormation = new Map<string, Set<string>>();
  for (const e of enrollments) {
    if (e.statut !== 'ACTIF' || !validStudentIds.has(e.studentId)) continue;
    const formationId = groupToFormation.get(e.groupId);
    if (!formationId) continue;
    if (!studentsByFormation.has(formationId)) studentsByFormation.set(formationId, new Set());
    studentsByFormation.get(formationId)!.add(e.studentId);
  }
  const formationById = new Map(formations.map((f) => [f.id, f]));
  return Array.from(studentsByFormation.entries())
    .map(([formationId, studentIds]) => ({ label: formationById.get(formationId)?.nom ?? 'Formation inconnue', value: studentIds.size }))
    .filter((d) => d.value > 0);
}

/** Assiduité sur la période sélectionnée — réutilise `computeAttendanceRates()` + données prêtes pour un donut chart. */
export function computeAttendanceByPeriod(attendance: CenterAttendanceRecord[], range: PeriodRange) {
  const scoped = attendance.filter((a) => inRange(a.date, range));
  const rates = computeAttendanceRates(scoped);
  const donutData: Count[] = [
    { label: 'Présent', value: scoped.filter((a) => a.statut === 'PRESENT').length },
    { label: 'Absent', value: scoped.filter((a) => a.statut === 'ABSENT').length },
    { label: 'Retard', value: scoped.filter((a) => a.statut === 'RETARD').length },
    { label: 'Excusé', value: scoped.filter((a) => a.statut === 'EXCUSE').length },
  ];
  return { rates, donutData };
}

/**
 * Revenus encaissés sur la période (area chart) + comparaison à la période
 * précédente de même durée (`previousPeriodRange`) pour la puce de tendance
 * du KPI "Revenus" de la page Statistiques.
 */
export function computeRevenueSeries(payments: CenterStudentPayment[], range: PeriodRange) {
  const series = bucketTimeSeries(payments, (p) => p.date, range, (p) => p.montantPaye);
  const currentTotal = sum(payments.filter((p) => inRange(p.date, range)), (p) => p.montantPaye);
  const previousRange = previousPeriodRange(range);
  const previousTotal = sum(payments.filter((p) => inRange(p.date, previousRange)), (p) => p.montantPaye);
  const trend = comparePeriods(currentTotal, previousTotal, { positiveIsGood: true });
  return { series, currentTotal, previousTotal, trend };
}

/** Répartition des paiements par statut réel (`PAYE`/`PARTIEL`/`IMPAYE`/`EN_RETARD`) pour un donut chart. */
export function computePaymentsDistribution(payments: CenterStudentPayment[]): Count[] {
  return countBy(payments, (p) => PAYMENT_STATUS_LABELS[p.statut]);
}

export type FormationPerformanceRow = {
  formationId: string;
  formation: string;
  studentsCount: number;
  avgAttendance: number; // %
  revenue: number;
  /** % du temps écoulé entre `dateDebut` et `dateFin` — omis nulle part ailleurs faute de champ fiable, ici dérivé des vraies dates de la formation. */
  progression: number;
};

function formationProgression(formation: Pick<CenterFormation, 'dateDebut' | 'dateFin'>, today: string): number {
  const start = parseFrDate(formation.dateDebut)?.getTime();
  const end = parseFrDate(formation.dateFin)?.getTime();
  const now = new Date(today).getTime();
  if (start == null || end == null || end <= start) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

/**
 * Ligne "Performance des formations" (table) : nombre d'étudiants actifs
 * (via `CenterEnrollment`), taux de présence moyen (via `CenterAttendanceRecord.groupId`
 * → `CenterGroup.formationId`), revenus encaissés (via `CenterStudentPayment.formationId`,
 * qui référence directement la formation) et progression temporelle réelle.
 */
export function computeFormationPerformance(
  formations: CenterFormation[],
  groups: CenterGroup[],
  enrollments: CenterEnrollment[],
  attendance: CenterAttendanceRecord[],
  payments: CenterStudentPayment[],
  today: string = todayIso(),
): FormationPerformanceRow[] {
  return formations.map((f) => {
    const formationGroupIds = new Set(groups.filter((g) => g.formationId === f.id).map((g) => g.id));
    const studentIds = new Set(enrollments.filter((e) => e.statut === 'ACTIF' && formationGroupIds.has(e.groupId)).map((e) => e.studentId));
    const formationAttendance = attendance.filter((a) => formationGroupIds.has(a.groupId));
    const { presenceRate } = computeAttendanceRates(formationAttendance);
    const revenue = payments.filter((p) => p.formationId === f.id).reduce((total, p) => total + p.montantPaye, 0);
    return {
      formationId: f.id,
      formation: f.nom,
      studentsCount: studentIds.size,
      avgAttendance: presenceRate,
      revenue,
      progression: formationProgression(f, today),
    };
  });
}
