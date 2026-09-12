import type { CenterAttendanceRecord, CenterGroup, CenterSchedule, CenterStudent, CenterTeacher, StudentResult } from '@/data/amud/centerTypes';
import { computeAttendanceRates, computeTeacherHours, computeTeacherRemuneration, sessionHours } from '@/lib/amud/centerCalculations';
import { bucketByWeekday, bucketTimeSeries, toIsoDate, type PeriodRange } from './period';

export type TeacherKpis = {
  mesEtudiants: number;
  mesGroupes: number;
  coursAujourdhui: number;
  heuresCeMois: number;
  presenceMoyenne: number;
  evaluations: number;
  remuneration: number;
  etudiantsARisque: number;
};

export type TeacherStats = {
  kpis: TeacherKpis;
  /** Détail horaire (cumul total / mois courant / mois précédent), voir calcul ci-dessous. */
  heures: { total: number; ceMois: number; moisPrecedent: number };
  /** `computeAttendanceRates(...).presenceRate` par groupe de l'enseignant. */
  presenceParGroupe: { label: string; value: number }[];
  /** Répartition des étudiants (avec ≥1 note) en 3 paliers de moyenne. Tableau vide si zéro `StudentResult`. */
  progressionEtudiants: { label: string; value: number }[];
  /** Moyenne des notes (%) par bucket temporel (jour/semaine/mois selon `range`). */
  evolutionPerformances: { label: string; value: number }[];
  /** Heures enseignées par jour de semaine (Lun→Dim), toutes dates confondues. */
  heuresParJour: { label: string; value: number }[];
};

const RISK_PRESENCE_THRESHOLD = 70; // %
const RISK_NOTE_THRESHOLD = 50; // %

function notePct(r: Pick<StudentResult, 'note' | 'noteMax'>): number {
  return r.noteMax > 0 ? (r.note / r.noteMax) * 100 : 0;
}

/**
 * Statistiques enseignant (`/amud/teacher/dashboard`).
 *
 * Contrat de scope (comme `getRecruiterStats`/`getStudentStats`, fonction pure) :
 * - `groups`/`schedules` peuvent être la collection complète du centre ou déjà
 *   filtrées par l'appelant — cette fonction refiltre toujours par
 *   `enseignantId === teacherId` en interne (idempotent, sûr dans les deux cas).
 * - `attendance` : collection (du centre ou déjà scopée) — filtrée ici par
 *   `groupId` appartenant à un groupe de l'enseignant (aucun champ enseignant
 *   direct sur `CenterAttendanceRecord`).
 * - `students` : DOIT déjà être la liste (dédupliquée) des étudiants inscrits
 *   (ACTIF) dans les groupes de l'enseignant — calculée par l'appelant via
 *   `centerEnrollments` (même logique que `teacher/students/page.tsx`), car
 *   `StudentResult`/`CenterStudent` n'ont pas de lien direct vers un enseignant.
 * - `studentResults` : collection (du centre ou déjà scopée) — filtrée ici par
 *   `studentId` appartenant à `students`.
 *
 * Écart volontaire par rapport à la signature du plan : `teacher` (taux
 * horaire) a été ajouté car `computeTeacherRemuneration` en a besoin et
 * `teacherId` seul ne suffit pas à le retrouver sans dupliquer une recherche
 * déjà faite côté page.
 */
export function getTeacherStats(
  teacherId: string,
  teacher: Pick<CenterTeacher, 'id' | 'tauxHoraire'>,
  groups: CenterGroup[],
  schedules: CenterSchedule[],
  attendance: CenterAttendanceRecord[],
  studentResults: StudentResult[],
  students: CenterStudent[],
  range: PeriodRange,
): TeacherStats {
  const today = toIsoDate(new Date());

  const myGroups = groups.filter((g) => g.enseignantId === teacherId);
  const myGroupIds = new Set(myGroups.map((g) => g.id));
  const mySchedules = schedules.filter((s) => s.enseignantId === teacherId);
  const myAttendance = attendance.filter((a) => myGroupIds.has(a.groupId));

  const studentIds = new Set(students.map((s) => s.id));
  const myResults = studentResults.filter((r) => studentIds.has(r.studentId));

  // --- Heures : total / ce mois / mois précédent, via computeTeacherHours()
  // (cumul borné par `upToDate`) — jamais de recalcul manuel des sessions ici,
  // seulement des différences de cumuls à 3 bornes de dates.
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const monthEnd = toIsoDate(new Date(y, m + 1, 0));
  const prevMonthEnd = toIsoDate(new Date(y, m, 0));
  const prevPrevMonthEnd = toIsoDate(new Date(y, m - 1, 0));

  const heuresTotal = computeTeacherHours(teacherId, schedules);
  const heuresJusquaFinMois = computeTeacherHours(teacherId, schedules, monthEnd);
  const heuresJusquaFinMoisPrecedent = computeTeacherHours(teacherId, schedules, prevMonthEnd);
  const heuresJusquaFinMoisAvantPrecedent = computeTeacherHours(teacherId, schedules, prevPrevMonthEnd);
  const heuresCeMois = heuresJusquaFinMois - heuresJusquaFinMoisPrecedent;
  const heuresMoisPrecedent = heuresJusquaFinMoisPrecedent - heuresJusquaFinMoisAvantPrecedent;

  // --- Présence moyenne (toutes mes présences) + par groupe.
  const presenceMoyenne = computeAttendanceRates(myAttendance).presenceRate;
  const presenceParGroupe = myGroups.map((g) => ({
    label: g.nom,
    value: computeAttendanceRates(myAttendance.filter((a) => a.groupId === g.id)).presenceRate,
  }));

  // --- Rémunération cumulée (heures enseignées × taux horaire), indépendante de `range`.
  const remuneration = computeTeacherRemuneration(teacher, schedules).montant;

  // --- Étudiants à risque : présence < 70% (si présences enregistrées) OU
  // moyenne des notes < 50% (si évaluations enregistrées). Un étudiant sans
  // aucune présence ET sans aucune note n'est PAS compté à risque (donnée
  // insuffisante plutôt que faux positif) — cf. contrainte "ne jamais
  // fabriquer un chiffre".
  let etudiantsARisque = 0;
  let eleveeCount = 0;
  let moyenneCount = 0;
  let faibleCount = 0;
  let studentsWithResults = 0;

  for (const student of students) {
    const studentAttendance = myAttendance.filter((a) => a.studentId === student.id);
    const studentResultsForThis = myResults.filter((r) => r.studentId === student.id);

    const hasAttendance = studentAttendance.length > 0;
    const presenceRate = hasAttendance ? computeAttendanceRates(studentAttendance).presenceRate : null;

    const hasResults = studentResultsForThis.length > 0;
    const avgNotePct = hasResults
      ? Math.round(studentResultsForThis.reduce((sum, r) => sum + notePct(r), 0) / studentResultsForThis.length)
      : null;

    const isAtRisk = (hasAttendance && presenceRate! < RISK_PRESENCE_THRESHOLD) || (hasResults && avgNotePct! < RISK_NOTE_THRESHOLD);
    if (isAtRisk) etudiantsARisque += 1;

    if (hasResults) {
      studentsWithResults += 1;
      if (avgNotePct! >= 75) eleveeCount += 1;
      else if (avgNotePct! >= 50) moyenneCount += 1;
      else faibleCount += 1;
    }
  }

  const progressionEtudiants =
    studentsWithResults === 0
      ? []
      : [
          { label: 'Élevée', value: eleveeCount },
          { label: 'Moyenne', value: moyenneCount },
          { label: 'Faible', value: faibleCount },
        ];

  // --- Évolution des performances : bucketTimeSeries ne fait que sommer/compter,
  // donc on calcule ici la moyenne par bucket = (somme des %) / (nombre d'évaluations).
  const counts = bucketTimeSeries(myResults, (r) => r.date, range);
  const sums = bucketTimeSeries(myResults, (r) => r.date, range, (r) => notePct(r));
  const evolutionPerformances = counts.map((c, i) => ({
    label: c.label,
    value: c.value > 0 ? Math.round(sums[i].value / c.value) : 0,
  }));

  // --- Heures enseignées par jour de semaine, toutes dates confondues (pas borné à `range`).
  const heuresParJour = bucketByWeekday(mySchedules, (s) => s.date, undefined, (s) => sessionHours(s));

  const kpis: TeacherKpis = {
    mesEtudiants: students.length,
    mesGroupes: myGroups.length,
    coursAujourdhui: mySchedules.filter((s) => s.date === today).length,
    heuresCeMois: Math.round(heuresCeMois),
    presenceMoyenne,
    evaluations: myResults.length,
    remuneration,
    etudiantsARisque,
  };

  return {
    kpis,
    heures: { total: Math.round(heuresTotal), ceMois: Math.round(heuresCeMois), moisPrecedent: Math.round(heuresMoisPrecedent) },
    presenceParGroupe,
    progressionEtudiants,
    evolutionPerformances,
    heuresParJour,
  };
}
