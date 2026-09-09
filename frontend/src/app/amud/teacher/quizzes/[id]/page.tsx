'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge, ConfirmDialog, EmptyState, LoadingState, StatCard, Tabs, statusTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerEnrollmentsCollection, activeStudentIdsForGroup } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { quizzesCollection } from '@/lib/amud/localQuizzes';
import { quizzesSeed, QUIZ_STATUS_LABELS } from '@/data/amud/quizzes';
import { quizQuestionsCollection } from '@/lib/amud/localQuizQuestions';
import { quizQuestionsSeed, type QuizQuestion } from '@/data/amud/quizQuestions';
import { quizSessionsCollection } from '@/lib/amud/localQuizSessions';
import { quizSessionsSeed } from '@/data/amud/quizSessions';
import { quizParticipantsCollection } from '@/lib/amud/localQuizParticipants';
import { quizParticipantsSeed } from '@/data/amud/quizParticipants';
import { quizAnswersCollection } from '@/lib/amud/localQuizAnswers';
import { quizAnswersSeed } from '@/data/amud/quizAnswers';
import { quizResultsCollection } from '@/lib/amud/localQuizResults';
import { quizResultsSeed } from '@/data/amud/quizResults';
import { launchQuiz, endQuiz, removeQuizQuestion } from '@/lib/amud/quizCascades';
import { QrCodeDisplay } from '@/components/amud/centre/QrCodeDisplay';
import { QuizQuestionFormModal } from '@/components/amud/centre/QuizQuestionFormModal';
import { QuizLiveMonitor } from '@/components/amud/centre/QuizLiveMonitor';
import { QuizLeaderboard } from '@/components/amud/centre/QuizLeaderboard';
import type { QrPayload } from '@/data/amud/centerTypes';

export default function TeacherQuizDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const { teacherId } = useCurrentTeacher();

  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [quizzes] = useCollection(quizzesCollection, quizzesSeed);
  const [questions] = useCollection(quizQuestionsCollection, quizQuestionsSeed);
  const [sessions] = useCollection(quizSessionsCollection, quizSessionsSeed);
  const [participants] = useCollection(quizParticipantsCollection, quizParticipantsSeed);
  const [answers] = useCollection(quizAnswersCollection, quizAnswersSeed);
  const [results] = useCollection(quizResultsCollection, quizResultsSeed);

  const teacher = teachers.find((t) => t.id === teacherId);
  const quiz = quizzes.find((q) => q.id === params.id);
  const quizQuestions = useMemo(() => questions.filter((q) => q.quizId === params.id).sort((a, b) => a.ordre - b.ordre), [questions, params.id]);
  const quizSessionsForQuiz = useMemo(() => sessions.filter((s) => s.quizId === params.id).sort((a, b) => b.startedAt.localeCompare(a.startedAt)), [sessions, params.id]);
  const latestSession = quizSessionsForQuiz[0];

  const [tab, setTab] = useState<'questions' | 'session' | 'resultats'>('questions');
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | undefined>(undefined);
  const [deletingQuestion, setDeletingQuestion] = useState<QuizQuestion | null>(null);
  const [, setTick] = useState(0);

  const actor = { utilisateur: teacher ? `${teacher.prenom} ${teacher.nom}` : 'Enseignant', role: 'TEACHER' };

  // Horloge murale : une seconde de résolution suffit pour l'affichage ; la fin
  // automatique se déclenche dès que `now >= endsAt`, jamais sur un décompte stocké.
  useEffect(() => {
    if (!latestSession || latestSession.status !== 'LIVE' || !quiz) return;
    const interval = setInterval(() => {
      if (new Date(latestSession.endsAt).getTime() <= Date.now()) {
        endQuiz(latestSession, quiz, actor, { early: false });
        setTab('resultats');
      } else {
        setTick((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestSession?.id, latestSession?.status, latestSession?.endsAt, quiz?.id]);

  useEffect(() => {
    if (latestSession?.status === 'LIVE') setTab('session');
    else if (latestSession?.status === 'ENDED') setTab((t) => (t === 'questions' ? 'resultats' : t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestSession?.id, latestSession?.status]);

  if (!teacher || !quiz) return <LoadingState label="Chargement…" rows={4} />;

  const formation = formations.find((f) => f.id === quiz.formationId);
  const group = groups.find((g) => g.id === quiz.groupId);
  const groupStudentIds = quiz.groupId ? activeStudentIdsForGroup(enrollments, quiz.groupId) : [];

  const sessionParticipants = latestSession ? participants.filter((p) => p.quizSessionId === latestSession.id) : [];
  const sessionAnswers = latestSession ? answers.filter((a) => a.quizSessionId === latestSession.id) : [];
  const sessionResults = latestSession ? results.filter((r) => r.quizSessionId === latestSession.id) : [];

  const joinPayload: QrPayload | null =
    latestSession && latestSession.status === 'LIVE' && new Date(latestSession.endsAt).getTime() > Date.now()
      ? { v: 1, type: 'QUIZ_JOIN', centerId: quiz.centerId, quizSessionId: latestSession.id, quizId: quiz.id, groupId: latestSession.groupId, teacherId, token: latestSession.joinToken, issuedAt: latestSession.startedAt }
      : null;

  const secondsLeft = latestSession && latestSession.status === 'LIVE' ? Math.max(0, Math.round((new Date(latestSession.endsAt).getTime() - Date.now()) / 1000)) : 0;

  function handleLaunch() {
    if (!quiz || quizQuestions.length === 0 || !quiz.groupId) return;
    launchQuiz(quiz, quiz.groupId, teacherId, actor);
    notify('Quiz lancé — affichez le QR pour vos étudiants.', 'success');
  }

  function handleEndEarly() {
    if (!latestSession || !quiz) return;
    endQuiz(latestSession, quiz, actor, { early: true });
    notify('Quiz terminé, résultats calculés.', 'success');
    setTab('resultats');
  }

  function nextOrdre() {
    return quizQuestions.length > 0 ? Math.max(...quizQuestions.map((q) => q.ordre)) + 1 : 1;
  }

  function handleDeleteQuestion() {
    if (!deletingQuestion) return;
    removeQuizQuestion(deletingQuestion, actor);
    notify('Question supprimée.', 'info');
    setDeletingQuestion(null);
  }

  const stats =
    sessionResults.length > 0
      ? {
          moyenne: Math.round(sessionResults.reduce((sum, r) => sum + r.percentage, 0) / sessionResults.length),
          meilleur: Math.max(...sessionResults.map((r) => r.percentage)),
          reussite: Math.round((sessionResults.filter((r) => r.percentage >= 50).length / sessionResults.length) * 100),
          participation: groupStudentIds.length > 0 ? Math.round((sessionResults.length / groupStudentIds.length) * 100) : 100,
        }
      : null;

  return (
    <div className="space-y-lg pb-24 md:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <button onClick={() => router.push('/amud/teacher/quizzes')} className="mb-1 flex items-center gap-1 text-label-md text-amud-on-surface-variant hover:text-amud-primary">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Tous les quiz
          </button>
          <h1 className="text-headline-md text-amud-on-surface">{quiz.titre}</h1>
          <p className="text-body-md text-amud-on-surface-variant">
            {formation?.nom ?? '—'} · {group?.nom ?? 'Tous les groupes'} · {quiz.niveau}
          </p>
        </div>
        <Badge tone={statusTone(quiz.statut)}>{QUIZ_STATUS_LABELS[quiz.statut]}</Badge>
      </div>

      <Tabs
        tabs={[
          { id: 'questions', label: `Questions (${quizQuestions.length})` },
          { id: 'session', label: 'Session en direct' },
          { id: 'resultats', label: 'Résultats' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === 'questions' ? (
        <div className="space-y-md">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <p className="text-body-md text-amud-on-surface-variant">
              {quizQuestions.length} question(s) · {quiz.dureeMinutes} min · {quiz.pointsParQuestion} pt/question
            </p>
            <div className="flex flex-wrap gap-sm">
              <button
                onClick={() => {
                  setEditingQuestion(undefined);
                  setQuestionModalOpen(true);
                }}
                className="flex min-h-[44px] items-center gap-2 rounded-lg border border-amud-outline-variant px-lg text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Ajouter une question
              </button>
              <button
                onClick={handleLaunch}
                disabled={quizQuestions.length === 0 || !quiz.groupId || latestSession?.status === 'LIVE'}
                className="flex min-h-[44px] items-center gap-2 rounded-lg bg-amud-primary px-lg text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span> Lancer le quiz
              </button>
            </div>
          </div>
          {!quiz.groupId ? <p className="text-label-sm text-amud-tertiary-fixed-dim">Choisissez un groupe précis (bouton « Modifier » depuis la liste) pour pouvoir lancer ce quiz.</p> : null}

          {quizQuestions.length === 0 ? (
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
              <EmptyState icon="quiz" title="Aucune question" description="Ajoutez au moins une question avant de lancer le quiz." />
            </div>
          ) : (
            <ul className="divide-y divide-amud-outline-variant rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
              {quizQuestions.map((q, i) => (
                <li key={q.id} className="flex flex-wrap items-start justify-between gap-sm px-lg py-md">
                  <div className="min-w-0 flex-1">
                    <p className="text-body-md text-amud-on-surface">
                      {i + 1}. {q.texte}
                    </p>
                    <p className="text-label-sm text-amud-on-surface-variant">
                      {q.type === 'QCM' ? 'QCM' : 'Vrai / Faux'} · Réponse : {q.options[q.bonneReponseIndex]} · {q.points} pt
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-sm">
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setQuestionModalOpen(true);
                      }}
                      className="rounded-lg p-2 text-amud-on-surface-variant hover:bg-amud-surface-container-high hover:text-amud-primary"
                      aria-label="Modifier"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => setDeletingQuestion(q)} className="rounded-lg p-2 text-amud-on-surface-variant hover:bg-amud-error-container/30 hover:text-amud-error" aria-label="Supprimer">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'session' ? (
        <div className="space-y-lg">
          {!latestSession || latestSession.status !== 'LIVE' ? (
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
              <EmptyState icon="qr_code_2" title="Aucune session en direct" description="Lancez le quiz depuis l’onglet « Questions » pour afficher le QR à vos étudiants." />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
              <div className="flex flex-col items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center shadow-sm">
                {joinPayload ? <QrCodeDisplay value={JSON.stringify(joinPayload)} label="QR pour rejoindre le quiz" /> : <p className="text-body-md text-amud-on-surface-variant">Le temps est écoulé.</p>}
                <p className="text-title-lg font-semibold text-amud-on-surface">Scanner pour rejoindre le Quiz</p>
                <p className="text-label-lg font-medium text-amud-primary">
                  Temps restant : {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                </p>
                <button onClick={handleEndEarly} className="min-h-[44px] rounded-lg bg-amud-error px-lg text-label-md font-medium text-white hover:bg-amud-error/90">
                  Terminer le quiz maintenant
                </button>
              </div>
              <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
                <h2 className="mb-md text-title-lg text-amud-on-surface">Participants en direct</h2>
                <QuizLiveMonitor participants={sessionParticipants} answers={sessionAnswers} students={students} totalQuestions={quizQuestions.length} />
              </div>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'resultats' ? (
        <div className="space-y-lg">
          {!latestSession || sessionResults.length === 0 ? (
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
              <EmptyState icon="grade" title="Aucun résultat" description="Les résultats apparaîtront une fois une session de quiz terminée." />
            </div>
          ) : (
            <>
              {stats ? (
                <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
                  <StatCard label="Moyenne" value={stats.moyenne} suffix=" %" icon="grade" accent="bg-amud-primary" />
                  <StatCard label="Meilleur score" value={stats.meilleur} suffix=" %" icon="workspace_premium" accent="bg-amud-tertiary-fixed-dim" />
                  <StatCard label="Taux de réussite" value={stats.reussite} suffix=" %" icon="check_circle" accent="bg-amud-primary-container" />
                  <StatCard label="Participation" value={stats.participation} suffix=" %" icon="groups" accent="bg-amud-secondary" />
                </div>
              ) : null}
              <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
                <h2 className="mb-md text-title-lg text-amud-on-surface">Classement</h2>
                <QuizLeaderboard results={sessionResults} students={students} />
              </div>
            </>
          )}
        </div>
      ) : null}

      <QuizQuestionFormModal open={questionModalOpen} onClose={() => setQuestionModalOpen(false)} quiz={quiz} question={editingQuestion} nextOrdre={nextOrdre()} actor={actor} />
      <ConfirmDialog open={!!deletingQuestion} onClose={() => setDeletingQuestion(null)} onConfirm={handleDeleteQuestion} title="Supprimer cette question ?" description="Cette action est irréversible." confirmLabel="Supprimer" />
    </div>
  );
}
