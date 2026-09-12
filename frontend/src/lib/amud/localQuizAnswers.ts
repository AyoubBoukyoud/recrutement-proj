'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { QuizAnswer } from '@/data/amud/quizAnswers';

const collection = createCollection<QuizAnswer>(AMUD_KEYS.quizAnswers);

export function loadLocalQuizAnswers(): QuizAnswer[] {
  return collection.getAll();
}

export function addLocalQuizAnswer(a: QuizAnswer) {
  collection.add(a);
}

export function updateLocalQuizAnswer(id: string, patch: Partial<QuizAnswer>) {
  return collection.update(id, patch);
}

export function removeLocalQuizAnswer(id: string) {
  collection.remove(id);
}

/** Une réponse par (participant, question) — utilisé par `submitAnswer` pour upserter plutôt qu'empiler. */
export function getAnswer(quizSessionId: string, participantId: string, questionId: string): QuizAnswer | undefined {
  return collection.getAll().find((a) => a.quizSessionId === quizSessionId && a.participantId === participantId && a.questionId === questionId);
}

export { collection as quizAnswersCollection };
