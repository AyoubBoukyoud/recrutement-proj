'use client';

import { EmptyState } from '@/components/amud/ui';
import type { QuizResult } from '@/data/amud/quizResults';
import type { CenterStudent } from '@/data/amud/centerStudents';

const MEDALS = ['emoji_events', 'workspace_premium', 'military_tech'];

/** Classement de fin de quiz — variantes public (nom visible) et anonyme (cahier des charges §33). */
export function QuizLeaderboard({ results, students, anonymized = false }: { results: QuizResult[]; students: CenterStudent[]; anonymized?: boolean }) {
  if (results.length === 0) {
    return <EmptyState compact icon="leaderboard" title="Aucun résultat" description="Le classement apparaîtra une fois le quiz terminé." />;
  }

  const sorted = [...results].sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0));

  return (
    <ol className="flex flex-col gap-sm">
      {sorted.map((r, i) => {
        const student = students.find((s) => s.id === r.studentId);
        const name = anonymized ? `Étudiant #${i + 1}` : student ? `${student.prenom} ${student.nom}` : r.studentId;
        return (
          <li key={r.id} className="flex items-center justify-between gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest px-lg py-md shadow-sm">
            <div className="flex items-center gap-md">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-label-md font-bold text-white">
                {i < 3 ? <span className="material-symbols-outlined text-[20px]">{MEDALS[i]}</span> : r.rang}
              </span>
              <div>
                <p className="text-body-md font-medium text-amud-on-surface">{name}</p>
                <p className="text-label-sm text-amud-on-surface-variant">{r.correctCount}/{r.correctCount + r.incorrectCount} bonnes réponses · {r.tempsSecondes}s</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-title-md font-bold text-amud-primary">{r.score}/{r.totalPoints}</p>
              <p className="text-label-sm text-amud-on-surface-variant">{r.percentage}%</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
