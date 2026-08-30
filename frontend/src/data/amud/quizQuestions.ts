/** Réexport fin — voir `quizTypes.ts` (types). Questions démo rattachées aux quiz de `quizzes.ts`. */
import type { QuizQuestion } from './quizTypes';
import { quizzesSeed } from './quizzes';

export type { QuizQuestion, QuizQuestionType } from './quizTypes';

function buildQuizQuestionsSeed(): QuizQuestion[] {
  const [quiz1, quiz2] = quizzesSeed;
  if (!quiz1 || !quiz2) return [];
  return [
    { id: 'quizq_demo_1a', quizId: quiz1.id, centerId: quiz1.centerId, type: 'QCM', texte: 'Comment dit-on « bonjour » en allemand ?', options: ['Hallo', 'Tschüss', 'Danke', 'Bitte'], bonneReponseIndex: 0, points: 1, ordre: 1 },
    { id: 'quizq_demo_1b', quizId: quiz1.id, centerId: quiz1.centerId, type: 'QCM', texte: 'Que signifie « Danke » ?', options: ['Merci', 'S’il vous plaît', 'Au revoir', 'Pardon'], bonneReponseIndex: 0, points: 1, ordre: 2 },
    { id: 'quizq_demo_1c', quizId: quiz1.id, centerId: quiz1.centerId, type: 'QCM', texte: 'Comment dit-on « au revoir » ?', options: ['Tschüss', 'Guten Morgen', 'Ja', 'Nein'], bonneReponseIndex: 0, points: 1, ordre: 3 },
    { id: 'quizq_demo_2a', quizId: quiz2.id, centerId: quiz2.centerId, type: 'VRAI_FAUX', texte: 'En allemand, les noms communs prennent toujours une majuscule.', options: ['Vrai', 'Faux'], bonneReponseIndex: 0, points: 1, ordre: 1 },
    { id: 'quizq_demo_2b', quizId: quiz2.id, centerId: quiz2.centerId, type: 'VRAI_FAUX', texte: 'Le verbe se place toujours en première position dans une phrase allemande.', options: ['Vrai', 'Faux'], bonneReponseIndex: 1, points: 1, ordre: 2 },
  ];
}

export const quizQuestionsSeed: QuizQuestion[] = buildQuizQuestionsSeed();
