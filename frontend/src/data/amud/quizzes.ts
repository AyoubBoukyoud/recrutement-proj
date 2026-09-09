/** Réexport fin — voir `quizTypes.ts` (types). Seed dérivé des vraies formations/groupes/enseignants générés par `centerDemoFactory.ts` (pas d'ids inventés). */
import type { Quiz } from './quizTypes';
import { centerFormationsSeed } from './centerFormations';
import { centerGroupsSeed } from './centerGroups';
import { centerTeachersSeed } from './centerTeachers';

export type { Quiz, QuizQuestionType, QuizLevel, QuizStatus } from './quizTypes';
export { QUIZ_STATUSES, QUIZ_STATUS_LABELS } from './quizTypes';

function buildQuizzesSeed(): Quiz[] {
  const formation = centerFormationsSeed[0];
  if (!formation) return [];
  const group = centerGroupsSeed.find((g) => g.formationId === formation.id) ?? centerGroupsSeed.find((g) => g.centerId === formation.centerId);
  const teacher = centerTeachersSeed.find((t) => t.centerId === formation.centerId);
  if (!group || !teacher) return [];
  const niveau = formation.niveau === 'Autres' ? ('Tous niveaux' as const) : formation.niveau;
  const now = new Date().toISOString();
  return [
    {
      id: 'quiz_demo_1',
      centerId: formation.centerId,
      formationId: formation.id,
      groupId: group.id,
      titre: `Vocabulaire — ${formation.niveau}`,
      description: 'Quiz de révision rapide sur le vocabulaire de la leçon.',
      niveau,
      nbQuestions: 3,
      pointsParQuestion: 1,
      dureeMinutes: 5,
      statut: 'PUBLIE',
      createdBy: teacher.id,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'quiz_demo_2',
      centerId: formation.centerId,
      formationId: formation.id,
      groupId: group.id,
      titre: `Grammaire — ${formation.niveau}`,
      description: 'Vrai ou faux sur les règles de grammaire vues en cours.',
      niveau,
      nbQuestions: 2,
      pointsParQuestion: 1,
      dureeMinutes: 3,
      statut: 'BROUILLON',
      createdBy: teacher.id,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export const quizzesSeed: Quiz[] = buildQuizzesSeed();
