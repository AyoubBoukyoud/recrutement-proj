'use client';

import { EmptyState } from '@/components/amud/ui';
import type { QuizParticipant } from '@/data/amud/quizParticipants';
import type { QuizAnswer } from '@/data/amud/quizAnswers';
import type { CenterStudent } from '@/data/amud/centerStudents';

const STATUS_LABELS: Record<QuizParticipant['status'], string> = { WAITING: 'En attente', IN_PROGRESS: 'En cours', SUBMITTED: 'Terminé' };

/** Vue enseignant "en direct" — participants, progression, nombre de réponses reçues (cahier des charges §32). */
export function QuizLiveMonitor({ participants, answers, students, totalQuestions }: { participants: QuizParticipant[]; answers: QuizAnswer[]; students: CenterStudent[]; totalQuestions: number }) {
  if (participants.length === 0) {
    return <EmptyState compact icon="group" title="Aucun participant" description="Les étudiants qui scannent le QR apparaîtront ici en direct." />;
  }

  const totalAnswers = answers.length;
  const expectedAnswers = participants.length * totalQuestions;
  const responseRate = expectedAnswers > 0 ? Math.round((totalAnswers / expectedAnswers) * 100) : 0;

  return (
    <div className="flex flex-col gap-md">
      <p className="text-body-md text-amud-on-surface-variant">
        {participants.length} participant(s) · {totalAnswers} réponse(s) reçue(s) · {responseRate}%
      </p>
      <ul className="divide-y divide-amud-outline-variant rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest">
        {participants.map((p) => {
          const student = students.find((s) => s.id === p.studentId);
          const answered = answers.filter((a) => a.participantId === p.id).length;
          const progress = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;
          return (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-sm px-lg py-sm">
              <span className="text-body-md text-amud-on-surface">{student ? `${student.prenom} ${student.nom}` : p.studentId}</span>
              <div className="flex items-center gap-md">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-amud-surface-container-high">
                  <div className="h-full rounded-full bg-amud-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="w-12 text-right text-label-sm text-amud-on-surface-variant">{answered}/{totalQuestions}</span>
                <span className="text-label-sm font-medium text-amud-on-surface-variant">{STATUS_LABELS[p.status]}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
