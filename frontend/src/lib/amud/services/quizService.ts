/** Voir `storageService.ts` pour le principe de cette couche. */
export { quizzesCollection, loadLocalQuizzes as loadQuizzes } from '../localQuizzes';
export { quizQuestionsCollection, loadLocalQuizQuestions as loadQuizQuestions } from '../localQuizQuestions';
export { quizSessionsCollection, loadLocalQuizSessions as loadQuizSessions } from '../localQuizSessions';
export { quizParticipantsCollection, loadLocalQuizParticipants as loadQuizParticipants } from '../localQuizParticipants';
export { quizAnswersCollection, loadLocalQuizAnswers as loadQuizAnswers, getAnswer } from '../localQuizAnswers';
export { quizResultsCollection, loadLocalQuizResults as loadQuizResults } from '../localQuizResults';
