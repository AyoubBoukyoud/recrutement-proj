import type { CenterSchedule } from '@/data/amud/centerSchedules';

export type ScheduleConflict = { type: 'enseignant' | 'salle' | 'groupe'; message: string; withScheduleId: string };

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Détecte les conflits de planning (cahier des charges §62/§85) avant
 * l'enregistrement d'un créneau : même enseignant, même salle ou même
 * groupe déjà occupé sur un horaire qui chevauche celui proposé, le même
 * jour. `excludeScheduleId` permet d'ignorer le créneau lui-même lors d'une
 * modification.
 */
export function findScheduleConflicts(
  candidate: Pick<CenterSchedule, 'centerId' | 'date' | 'heureDebut' | 'heureFin' | 'enseignantId' | 'salle' | 'groupId'>,
  existing: CenterSchedule[],
  excludeScheduleId?: string,
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const sameDay = existing.filter(
    (s) => s.centerId === candidate.centerId && s.date === candidate.date && s.id !== excludeScheduleId && overlaps(candidate.heureDebut, candidate.heureFin, s.heureDebut, s.heureFin),
  );

  for (const s of sameDay) {
    if (s.enseignantId === candidate.enseignantId) {
      conflicts.push({ type: 'enseignant', message: `Cet enseignant a déjà un cours de ${s.heureDebut} à ${s.heureFin} le même jour.`, withScheduleId: s.id });
    }
    if (s.salle === candidate.salle) {
      conflicts.push({ type: 'salle', message: `La salle "${candidate.salle}" est déjà occupée de ${s.heureDebut} à ${s.heureFin} le même jour.`, withScheduleId: s.id });
    }
    if (s.groupId === candidate.groupId) {
      conflicts.push({ type: 'groupe', message: `Ce groupe a déjà un cours de ${s.heureDebut} à ${s.heureFin} le même jour.`, withScheduleId: s.id });
    }
  }

  return conflicts;
}
