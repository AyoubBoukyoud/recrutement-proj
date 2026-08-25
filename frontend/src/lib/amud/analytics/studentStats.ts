import type { CenterAttendanceRecord, CenterFormation, StudentResult } from '@/data/amud/centerTypes';
import { ATTENDANCE_LABELS } from '@/data/amud/centerTypes';
import { countBy } from './aggregate';

export type StudentStats = {
  /** 0-100, voir le commentaire sur son calcul ci-dessous. */
  progressPct: number;
  /** Libellé du sous-titre du gauge — dépend de la méthode de calcul retenue (voir ci-dessous). */
  progressLabel: string;
  attendanceBreakdown: { label: string; value: number }[];
  competencyByModule: { label: string; value: number }[];
  gradesOverTime: { label: string; value: number }[];
};

/**
 * Statistiques étudiant (`/amud/student/dashboard`) — `results`/`attendance`
 * doivent déjà être filtrées pour l'étudiant courant par l'appelant (mêmes
 * `myAttendance` déjà calculé dans la page), reste pure comme
 * `getRecruiterStats`.
 */
export function getStudentStats(
  studentId: string,
  results: StudentResult[],
  attendance: CenterAttendanceRecord[],
  formation: Pick<CenterFormation, 'dateDebut' | 'dateFin'> | null | undefined,
  today: string = new Date().toISOString().slice(0, 10),
): StudentStats {
  const myResults = results.filter((r) => r.studentId === studentId).sort((a, b) => a.date.localeCompare(b.date));
  const myAttendance = attendance.filter((a) => a.studentId === studentId);

  // Progression : % de la durée planifiée de la formation déjà écoulée
  // (formation.dateDebut → dateFin) — ce signal est disponible dès
  // l'inscription, avant même la première évaluation, et reflète mieux
  // "où en est l'étudiant dans son parcours" qu'une moyenne de notes (qui
  // mesure la performance, pas l'avancement). À défaut de dates de
  // formation exploitables, on retombe sur la moyenne des notes (note/noteMax%).
  let progressPct = 0;
  let progressLabel = 'Durée de formation écoulée';
  if (formation?.dateDebut && formation?.dateFin) {
    const start = new Date(formation.dateDebut).getTime();
    const end = new Date(formation.dateFin).getTime();
    const now = new Date(today).getTime();
    progressPct = end > start ? Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100))) : 0;
  } else if (myResults.length > 0) {
    progressPct = Math.round(
      myResults.reduce((sum, r) => sum + (r.noteMax > 0 ? (r.note / r.noteMax) * 100 : 0), 0) / myResults.length,
    );
    progressLabel = 'Moyenne des notes';
  }

  // Présences réparties par statut (mêmes catégories que centerCalculations.ts / AttendanceStatus).
  const attendanceBreakdown = countBy(myAttendance, (a) => ATTENDANCE_LABELS[a.statut]);

  // Moyenne des notes (%) groupée par module — les libellés de module sont du
  // texte libre (StudentResult.module), donc on regroupe par les valeurs
  // réellement présentes plutôt que par une liste fixe de matières.
  const moduleTotals = new Map<string, { sum: number; count: number }>();
  for (const r of myResults) {
    const pct = r.noteMax > 0 ? (r.note / r.noteMax) * 100 : 0;
    const entry = moduleTotals.get(r.module) ?? { sum: 0, count: 0 };
    entry.sum += pct;
    entry.count += 1;
    moduleTotals.set(r.module, entry);
  }
  const competencyByModule = Array.from(moduleTotals.entries()).map(([label, { sum, count }]) => ({
    label,
    value: Math.round(sum / count),
  }));

  // Évolution des notes (%) dans l'ordre chronologique des évaluations.
  const gradesOverTime = myResults.map((r, i) => ({
    label: `Éval. ${i + 1}`,
    value: r.noteMax > 0 ? Math.round((r.note / r.noteMax) * 100) : 0,
  }));

  return { progressPct, progressLabel, attendanceBreakdown, competencyByModule, gradesOverTime };
}
