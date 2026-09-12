import type { GermanLevel } from './centerTypes';

/**
 * Types du sous-système Quick Quiz (`/amud/teacher/quizzes`,
 * `/amud/student/quiz`, cahier des charges §24-37). Gardé séparé de
 * `centerTypes.ts` : ce sous-système ne fait que *référencer* des ids déjà
 * produits par `centerDemoFactory.ts` (formation/groupe/enseignant/étudiant),
 * il n'a pas besoin d'être lui-même croisé par cette fabrique.
 */

export type QuizQuestionType = 'QCM' | 'VRAI_FAUX';
export type QuizLevel = GermanLevel | 'Tous niveaux';
export type QuizStatus = 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
export const QUIZ_STATUSES: QuizStatus[] = ['BROUILLON', 'PUBLIE', 'ARCHIVE'];
export const QUIZ_STATUS_LABELS: Record<QuizStatus, string> = {
  BROUILLON: 'Brouillon',
  PUBLIE: 'Publié',
  ARCHIVE: 'Archivé',
};

export type Quiz = {
  id: string;
  centerId: string;
  formationId: string;
  /** Optionnel : un quiz reste réutilisable sur plusieurs groupes de la même formation. */
  groupId?: string;
  titre: string;
  description?: string;
  niveau: QuizLevel;
  /** Dénormalisé, tenu à jour par `quizCascades.ts` à chaque ajout/suppression de question. */
  nbQuestions: number;
  pointsParQuestion: number;
  dureeMinutes: number;
  statut: QuizStatus;
  createdBy: string; // teacherId
  createdAt: string;
  updatedAt: string;
};

export type QuizQuestion = {
  id: string;
  quizId: string;
  centerId: string;
  type: QuizQuestionType;
  texte: string;
  /** ['Vrai', 'Faux'] pour une question VRAI_FAUX. */
  options: string[];
  bonneReponseIndex: number;
  points: number;
  ordre: number;
};

export type QuizSessionStatus = 'WAITING' | 'LIVE' | 'ENDED';

export type QuizSession = {
  id: string;
  centerId: string;
  quizId: string;
  /** Créneau concret pendant lequel le quiz a été lancé, si applicable. */
  scheduleId?: string;
  teacherId: string;
  groupId: string;
  status: QuizSessionStatus;
  /** Jeton embarqué dans le QR_QUIZ_JOIN, régénéré à chaque lancement. */
  joinToken: string;
  startedAt: string;
  /** Horloge murale de fin, calculée une seule fois au lancement (startedAt + dureeMinutes) — jamais un décompte stocké. */
  endsAt: string;
  endedAt?: string;
  endedEarlyBy?: string;
};

export type QuizParticipantStatus = 'WAITING' | 'IN_PROGRESS' | 'SUBMITTED';

export type QuizParticipant = {
  id: string;
  quizSessionId: string;
  centerId: string;
  studentId: string;
  joinedAt: string;
  currentQuestionIndex: number;
  status: QuizParticipantStatus;
  submittedAt?: string;
};

export type QuizAnswer = {
  id: string;
  quizSessionId: string;
  participantId: string;
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  answeredAt: string;
};

export type QuizResult = {
  id: string;
  centerId: string;
  quizSessionId: string;
  quizId: string;
  studentId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  tempsSecondes: number;
  /** Rang au classement, calculé une fois à la fin du quiz. */
  rang?: number;
  computedAt: string;
};
