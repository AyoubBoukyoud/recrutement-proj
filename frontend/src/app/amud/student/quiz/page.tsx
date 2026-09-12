'use client';

import { useEffect, useMemo, useState } from 'react';
import { Drawer, EmptyState, LoadingState } from '@/components/amud/ui';
import { QrScanner } from '@/components/amud/centre/QrScanner';
import { QuizWaitingRoom } from '@/components/amud/centre/QuizWaitingRoom';
import { QuizPlayer } from '@/components/amud/centre/QuizPlayer';
import { useToast } from '@/components/amud/Toast';
import { useCurrentStudent } from '@/lib/amud/currentStudent';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerEnrollmentsCollection, activeStudentIdsForGroup } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { quizzesCollection } from '@/lib/amud/localQuizzes';
import { quizzesSeed } from '@/data/amud/quizzes';
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
import { joinQuiz, submitAnswer, endQuiz } from '@/lib/amud/quizCascades';
import type { QrPayload } from '@/data/amud/centerTypes';

export default function StudentQuizPage() {
  const notify = useToast();
  const { studentId } = useCurrentStudent();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [quizzes] = useCollection(quizzesCollection, quizzesSeed);
  const [questions] = useCollection(quizQuestionsCollection, quizQuestionsSeed);
  const [sessions] = useCollection(quizSessionsCollection, quizSessionsSeed);
  const [participants] = useCollection(quizParticipantsCollection, quizParticipantsSeed);
  const [answers] = useCollection(quizAnswersCollection, quizAnswersSeed);
  const [results] = useCollection(quizResultsCollection, quizResultsSeed);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [, setTick] = useState(0);

  const student = students.find((s) => s.id === studentId);

  // Dernière participation de cet étudiant, quel que soit l'état de la session — permet
  // d'afficher le lecteur immersif si elle est LIVE, ou le résultat une fois qu'elle a ENDED.
  const myParticipant = useMemo(
    () => participants.filter((p) => p.studentId === studentId).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))[0],
    [participants, studentId],
  );
  const mySession = myParticipant ? sessions.find((s) => s.id === myParticipant.quizSessionId) : undefined;
  const myQuiz = mySession ? quizzes.find((q) => q.id === mySession.quizId) : undefined;
  const myQuestions = useMemo(() => (myQuiz ? questions.filter((q) => q.quizId === myQuiz.id).sort((a, b) => a.ordre - b.ordre) : []), [questions, myQuiz]);
  const myAnswers = useMemo(() => (myParticipant ? answers.filter((a) => a.participantId === myParticipant.id) : []), [answers, myParticipant]);
  const sessionParticipantsCount = mySession ? participants.filter((p) => p.quizSessionId === mySession.id).length : 0;
  const myResult = mySession ? results.find((r) => r.quizSessionId === mySession.id && r.studentId === studentId) : undefined;

  const isLive = mySession?.status === 'LIVE' && myParticipant && myParticipant.status !== 'SUBMITTED';

  useEffect(() => {
    if (!mySession || mySession.status !== 'LIVE' || !myQuiz || !student) return;
    const interval = setInterval(() => {
      if (new Date(mySession.endsAt).getTime() <= Date.now()) {
        endQuiz(mySession, myQuiz, { utilisateur: `${student.prenom} ${student.nom}`, role: 'STUDENT' }, { early: false });
      } else {
        setTick((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySession?.id, mySession?.status, mySession?.endsAt, myQuiz?.id]);

  function handleScan(text: string) {
    setScannerOpen(false);
    let payload: QrPayload;
    try {
      payload = JSON.parse(text);
    } catch {
      notify('QR code invalide.', 'error');
      return;
    }
    if (!payload || payload.v !== 1 || payload.type !== 'QUIZ_JOIN') {
      notify('Ce QR ne correspond pas à un quiz.', 'error');
      return;
    }
    if (!student) return;
    const groupStudentIds = activeStudentIdsForGroup(enrollments, payload.groupId);
    const actor = { utilisateur: `${student.prenom} ${student.nom}`, role: 'STUDENT' };
    const result = joinQuiz(payload, student.id, groupStudentIds, actor);
    if (!result.ok) {
      notify(result.error.message, 'error');
      return;
    }
    setStarted(false);
    notify('Vous avez rejoint le quiz !', 'success');
  }

  function handleAnswer(question: QuizQuestion, selectedIndex: number) {
    if (!mySession || !myParticipant) return;
    submitAnswer(mySession, myParticipant, question, selectedIndex);
  }

  function handleFinish() {
    if (!myParticipant) return;
    quizParticipantsCollection.update(myParticipant.id, { status: 'SUBMITTED', submittedAt: new Date().toISOString() });
    notify('Réponses envoyées — en attente de la fin du quiz.', 'success');
  }

  if (!student) return <LoadingState label="Chargement…" rows={3} />;

  const secondsLeft = mySession ? Math.max(0, Math.round((new Date(mySession.endsAt).getTime() - Date.now()) / 1000)) : 0;

  if (isLive && myQuiz) {
    const group = groups.find((g) => g.id === mySession!.groupId);
    const formation = formations.find((f) => f.id === myQuiz.formationId);
    const teacher = teachers.find((t) => t.id === mySession!.teacherId);
    return (
      <div className="fixed inset-0 z-40">
        {started ? (
          <QuizPlayer questions={myQuestions} existingAnswers={myAnswers} startIndex={myParticipant!.currentQuestionIndex} secondsLeft={secondsLeft} onAnswer={handleAnswer} onFinish={handleFinish} />
        ) : (
          <QuizWaitingRoom
            quizTitle={myQuiz.titre}
            formationName={formation?.nom}
            groupName={group?.nom}
            teacherName={teacher ? `${teacher.prenom} ${teacher.nom}` : undefined}
            participantsCount={sessionParticipantsCount}
            onStart={() => setStarted(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Quiz</h1>

      {myResult ? (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center shadow-sm">
          <p className="text-title-lg font-semibold text-amud-on-surface">Quiz terminé !</p>
          <p className="mt-1 text-headline-md font-bold text-amud-primary">{myResult.percentage}%</p>
          <p className="text-body-md text-amud-on-surface-variant">
            {myResult.correctCount}/{myResult.correctCount + myResult.incorrectCount} bonnes réponses
          </p>
        </div>
      ) : mySession?.status === 'LIVE' && myParticipant?.status === 'SUBMITTED' ? (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
          <EmptyState icon="hourglass_top" title="En attente de la fin du quiz" description="Vos réponses ont été envoyées, les résultats arrivent bientôt." />
        </div>
      ) : (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
          <EmptyState
            icon="qr_code_scanner"
            title="Scannez le QR de votre enseignant"
            description="Votre enseignant affiche un QR code pour lancer un Quick Quiz — scannez-le pour le rejoindre."
            actionLabel="Scanner le Quiz"
            onAction={() => setScannerOpen(true)}
          />
        </div>
      )}

      <Drawer open={scannerOpen} onClose={() => setScannerOpen(false)} anchor="full" title="Scanner le QR du quiz">
        <QrScanner active={scannerOpen} onScan={handleScan} />
      </Drawer>
    </div>
  );
}
