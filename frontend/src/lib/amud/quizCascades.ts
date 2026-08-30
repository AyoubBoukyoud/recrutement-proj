'use client';

import { generateId } from './storage/ids';
import { logAudit } from './storage/audit';
import { pushNotification } from './storage/notify';
import { logCenterActivity } from './localCenterActivities';
import { quizzesCollection } from './localQuizzes';
import { quizQuestionsCollection } from './localQuizQuestions';
import { quizSessionsCollection } from './localQuizSessions';
import { quizParticipantsCollection } from './localQuizParticipants';
import { quizAnswersCollection, getAnswer } from './localQuizAnswers';
import { quizResultsCollection } from './localQuizResults';
import { studentResultsCollection } from './localStudentResults';
import type { Quiz } from '@/data/amud/quizzes';
import type { QuizQuestion } from '@/data/amud/quizQuestions';
import type { QuizSession } from '@/data/amud/quizSessions';
import type { QuizParticipant } from '@/data/amud/quizParticipants';
import type { QuizResult } from '@/data/amud/quizResults';
import type { QrPayload } from '@/data/amud/centerTypes';

/**
 * Écritures cascade pour le Quick Quiz (cahier des charges §24-37) — même
 * gabarit que `offerCascades.ts`/`attendanceCascades.ts`. `joinQuiz` renvoie
 * un résultat typé (comme `checkInStudent`) plutôt que de lever une
 * exception ; `submitAnswer` upsert (jamais d'empilement de réponses) et
 * `endQuiz` est idempotent — appelable indifféremment par l'écran enseignant
 * ou l'écran étudiant qui remarque le premier que `now >= endsAt`.
 */

type Actor = { utilisateur: string; role: string };

export type QuizActionError = { code: 'INVALID_PAYLOAD' | 'SESSION_NOT_LIVE' | 'WRONG_GROUP' | 'ALREADY_JOINED'; message: string };
export type QuizJoinResult = { ok: true; participant: QuizParticipant } | { ok: false; error: QuizActionError };

// ---------------------------------------------------------------------------
// Authoring (quiz + questions)
// ---------------------------------------------------------------------------

export function createQuiz(input: Omit<Quiz, 'id' | 'nbQuestions' | 'createdAt' | 'updatedAt'>, actor: Actor): Quiz {
  const now = new Date().toISOString();
  const quiz: Quiz = { ...input, id: generateId('quiz'), nbQuestions: 0, createdAt: now, updatedAt: now };
  quizzesCollection.add(quiz);
  logCenterActivity({ centerId: quiz.centerId, type: 'QUIZ_CREATED', message: `Quiz créé : « ${quiz.titre} ».`, utilisateur: actor.utilisateur, role: actor.role });
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Création quiz ${quiz.titre}`, actionType: 'create', module: 'Centres de formation — Quiz', reference: `${quiz.titre} (#${quiz.id})`, centerId: quiz.centerId });
  return quiz;
}

export function updateQuiz(quiz: Quiz, patch: Partial<Omit<Quiz, 'id' | 'centerId'>>, actor: Actor) {
  quizzesCollection.update(quiz.id, { ...patch, updatedAt: new Date().toISOString() });
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Modification quiz ${quiz.titre}`, actionType: 'update', module: 'Centres de formation — Quiz', reference: `${quiz.titre} (#${quiz.id})`, centerId: quiz.centerId });
}

export function deleteQuiz(quiz: Quiz, actor: Actor) {
  quizQuestionsCollection.getAll().filter((q) => q.quizId === quiz.id).forEach((q) => quizQuestionsCollection.remove(q.id));
  quizzesCollection.remove(quiz.id);
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Suppression quiz ${quiz.titre}`, actionType: 'delete', module: 'Centres de formation — Quiz', reference: `${quiz.titre} (#${quiz.id})`, centerId: quiz.centerId });
}

export function duplicateQuiz(quiz: Quiz, actor: Actor): Quiz {
  const now = new Date().toISOString();
  const copy: Quiz = { ...quiz, id: generateId('quiz'), titre: `${quiz.titre} (copie)`, statut: 'BROUILLON', createdAt: now, updatedAt: now };
  quizzesCollection.add(copy);
  quizQuestionsCollection
    .getAll()
    .filter((q) => q.quizId === quiz.id)
    .forEach((q) => quizQuestionsCollection.add({ ...q, id: generateId('quizq'), quizId: copy.id }));
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Duplication quiz ${quiz.titre}`, actionType: 'create', module: 'Centres de formation — Quiz', reference: `${copy.titre} (#${copy.id}, depuis #${quiz.id})`, centerId: quiz.centerId });
  return copy;
}

function syncQuestionCount(quizId: string) {
  const count = quizQuestionsCollection.getAll().filter((q) => q.quizId === quizId).length;
  quizzesCollection.update(quizId, { nbQuestions: count, updatedAt: new Date().toISOString() });
}

export function addQuizQuestion(input: Omit<QuizQuestion, 'id'>, actor: Actor): QuizQuestion {
  const question: QuizQuestion = { ...input, id: generateId('quizq') };
  quizQuestionsCollection.add(question);
  syncQuestionCount(question.quizId);
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: 'Ajout question de quiz', actionType: 'create', module: 'Centres de formation — Quiz', reference: `Question #${question.id} (quiz #${question.quizId})`, centerId: question.centerId });
  return question;
}

export function updateQuizQuestion(question: QuizQuestion, patch: Partial<Omit<QuizQuestion, 'id' | 'quizId' | 'centerId'>>, actor: Actor) {
  quizQuestionsCollection.update(question.id, patch);
  quizzesCollection.update(question.quizId, { updatedAt: new Date().toISOString() });
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: 'Modification question de quiz', actionType: 'update', module: 'Centres de formation — Quiz', reference: `Question #${question.id} (quiz #${question.quizId})`, centerId: question.centerId });
}

export function removeQuizQuestion(question: QuizQuestion, actor: Actor) {
  quizQuestionsCollection.remove(question.id);
  syncQuestionCount(question.quizId);
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: 'Suppression question de quiz', actionType: 'delete', module: 'Centres de formation — Quiz', reference: `Question #${question.id} (quiz #${question.quizId})`, centerId: question.centerId });
}

// ---------------------------------------------------------------------------
// Live session
// ---------------------------------------------------------------------------

export function launchQuiz(quiz: Quiz, groupId: string, teacherId: string, actor: Actor, scheduleId?: string): QuizSession {
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + quiz.dureeMinutes * 60_000);
  const session: QuizSession = {
    id: generateId('qsess'),
    centerId: quiz.centerId,
    quizId: quiz.id,
    scheduleId,
    teacherId,
    groupId,
    status: 'LIVE',
    joinToken: generateId('tok'),
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
  quizSessionsCollection.add(session);
  logCenterActivity({ centerId: quiz.centerId, type: 'QUIZ_STARTED', message: `Quiz « ${quiz.titre} » lancé.`, utilisateur: actor.utilisateur, role: actor.role });
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Lancement quiz ${quiz.titre}`, actionType: 'update', module: 'Centres de formation — Quiz', reference: `${quiz.titre} (#${quiz.id})`, centerId: quiz.centerId });
  return session;
}

export function joinQuiz(payload: QrPayload, studentId: string, groupStudentIds: string[], actor: Actor): QuizJoinResult {
  if (payload.type !== 'QUIZ_JOIN') return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Ce QR ne correspond pas à un quiz.' } };
  const session = quizSessionsCollection.getById(payload.quizSessionId);
  if (!session || session.status !== 'LIVE' || session.joinToken !== payload.token || new Date(session.endsAt).getTime() <= Date.now()) {
    return { ok: false, error: { code: 'SESSION_NOT_LIVE', message: 'Ce quiz n’est plus disponible.' } };
  }
  if (!groupStudentIds.includes(studentId)) {
    return { ok: false, error: { code: 'WRONG_GROUP', message: 'Vous n’êtes pas inscrit(e) dans ce groupe.' } };
  }
  const existing = quizParticipantsCollection.getAll().find((p) => p.quizSessionId === session.id && p.studentId === studentId);
  if (existing) return { ok: false, error: { code: 'ALREADY_JOINED', message: 'Vous avez déjà rejoint ce quiz.' } };
  const participant: QuizParticipant = { id: generateId('qpart'), quizSessionId: session.id, centerId: payload.centerId, studentId, joinedAt: new Date().toISOString(), currentQuestionIndex: 0, status: 'WAITING' };
  quizParticipantsCollection.add(participant);
  logCenterActivity({ centerId: payload.centerId, type: 'QUIZ_JOINED', message: `Un(e) étudiant(e) a rejoint le quiz (session #${session.id}).`, utilisateur: actor.utilisateur, role: actor.role });
  return { ok: true, participant };
}

/** Upsert (jamais d'empilement) — appelée à chaque réponse avant "Suivant". Rejetée une fois `endsAt` dépassé. */
export function submitAnswer(session: QuizSession, participant: QuizParticipant, question: QuizQuestion, selectedIndex: number): { ok: boolean } {
  if (new Date(session.endsAt).getTime() <= Date.now()) return { ok: false };
  const isCorrect = selectedIndex === question.bonneReponseIndex;
  const existing = getAnswer(session.id, participant.id, question.id);
  if (existing) {
    quizAnswersCollection.update(existing.id, { selectedIndex, isCorrect, answeredAt: new Date().toISOString() });
  } else {
    quizAnswersCollection.add({ id: generateId('qans'), quizSessionId: session.id, participantId: participant.id, questionId: question.id, selectedIndex, isCorrect, answeredAt: new Date().toISOString() });
  }
  quizParticipantsCollection.update(participant.id, { currentQuestionIndex: Math.max(participant.currentQuestionIndex, question.ordre), status: 'IN_PROGRESS' });
  return { ok: true };
}

/**
 * Termine le quiz (auto à `endsAt`, ou manuellement) : calcule un
 * `QuizResult` + classement par participant, et écrit une ligne
 * `StudentResult` correspondante pour que `/amud/student/results` affiche le
 * quiz sans aucune modification de cette page. Idempotent : un second appel
 * sur une session déjà `ENDED` ne fait rien.
 */
export function endQuiz(session: QuizSession, quiz: Quiz, actor: Actor, opts: { early: boolean } = { early: false }): QuizResult[] {
  if (session.status === 'ENDED') return quizResultsCollection.getAll().filter((r) => r.quizSessionId === session.id);

  const questions = quizQuestionsCollection.getAll().filter((q) => q.quizId === quiz.id);
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const participants = quizParticipantsCollection.getAll().filter((p) => p.quizSessionId === session.id);
  const answers = quizAnswersCollection.getAll().filter((a) => a.quizSessionId === session.id);
  const endsAtMs = new Date(session.endsAt).getTime();
  const now = new Date();
  const nowIso = now.toISOString();

  const scored = participants.map((participant) => {
    const mine = answers.filter((a) => a.participantId === participant.id);
    const correctCount = mine.filter((a) => a.isCorrect).length;
    const score = questions.reduce((sum, q) => {
      const a = mine.find((x) => x.questionId === q.id);
      return sum + (a?.isCorrect ? q.points : 0);
    }, 0);
    const incorrectCount = questions.length - correctCount;
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const finishedAtMs = Math.min(now.getTime(), endsAtMs);
    const tempsSecondes = Math.max(0, Math.round((finishedAtMs - new Date(participant.joinedAt).getTime()) / 1000));
    quizParticipantsCollection.update(participant.id, { status: 'SUBMITTED', submittedAt: nowIso });
    return { participant, score, totalPoints, percentage, correctCount, incorrectCount, tempsSecondes };
  });

  scored.sort((a, b) => b.score - a.score || a.tempsSecondes - b.tempsSecondes);

  const results: QuizResult[] = scored.map((s, index) => {
    const result: QuizResult = {
      id: generateId('qres'),
      centerId: session.centerId,
      quizSessionId: session.id,
      quizId: quiz.id,
      studentId: s.participant.studentId,
      score: s.score,
      totalPoints: s.totalPoints,
      percentage: s.percentage,
      correctCount: s.correctCount,
      incorrectCount: s.incorrectCount,
      tempsSecondes: s.tempsSecondes,
      rang: index + 1,
      computedAt: nowIso,
    };
    quizResultsCollection.add(result);
    studentResultsCollection.add({
      id: generateId('sres'),
      centerId: session.centerId,
      studentId: s.participant.studentId,
      formationId: quiz.formationId,
      module: `Quiz : ${quiz.titre}`,
      date: nowIso.slice(0, 10),
      note: Math.round((s.percentage / 100) * 20),
      noteMax: 20,
      observation: `${s.correctCount}/${questions.length} bonnes réponses`,
    });
    pushNotification({ scope: 'student', targetId: s.participant.studentId, title: `Résultat disponible : ${quiz.titre} (${s.percentage}%).`, category: 'Quiz', href: '/amud/student/results' });
    return result;
  });

  quizSessionsCollection.update(session.id, { status: 'ENDED', endedAt: nowIso, endedEarlyBy: opts.early ? actor.utilisateur : undefined });
  logCenterActivity({ centerId: session.centerId, type: 'QUIZ_COMPLETED', message: `Quiz « ${quiz.titre} » terminé (${results.length} participant(s)).`, utilisateur: actor.utilisateur, role: actor.role });
  logCenterActivity({ centerId: session.centerId, type: 'RESULT_RECORDED', message: `Résultats enregistrés pour « ${quiz.titre} ».`, utilisateur: actor.utilisateur, role: actor.role });
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Fin du quiz ${quiz.titre}`, actionType: 'update', module: 'Centres de formation — Quiz', reference: `${quiz.titre} (#${quiz.id})`, centerId: session.centerId });
  return results;
}
