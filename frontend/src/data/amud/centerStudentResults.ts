import type { StudentResult } from './centerTypes';
import { centerStudentsSeed } from './centerStudents';
import { centerFormationsSeed } from './centerFormations';

function buildStudentResultsSeed(): StudentResult[] {
  const results: StudentResult[] = [];
  const students = centerStudentsSeed.slice(0, 8);

  const modules = [
    'Vocabulaire & Grammaire',
    'Compréhension orale',
    'Expression écrite',
    'Compréhension écrite',
    'Expression orale',
    'Phonétique',
  ];

  students.forEach((student, si) => {
    const formation = centerFormationsSeed.find((f) => f.centerId === student.centerId);
    if (!formation) return;

    const base = 12 + (si % 4);
    modules.slice(0, 3 + (si % 3)).forEach((module, mi) => {
      const note = Math.min(20, base + (mi % 3));
      results.push({
        id: `result_${student.id}_${mi}`,
        centerId: student.centerId,
        studentId: student.id,
        formationId: formation.id,
        module,
        date: `2026-0${(mi % 6) + 1}-${String(10 + mi * 3).padStart(2, '0')}`,
        note,
        noteMax: 20,
        observation:
          note >= 16
            ? 'Excellent travail, continuez ainsi.'
            : note >= 12
              ? 'Bon niveau, quelques points à améliorer.'
              : 'Des efforts supplémentaires sont nécessaires.',
      });
    });
  });

  return results;
}

export const centerStudentResultsSeed: StudentResult[] = buildStudentResultsSeed();
export type { StudentResult };
