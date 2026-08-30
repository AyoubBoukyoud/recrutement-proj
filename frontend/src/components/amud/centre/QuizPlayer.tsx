'use client';

import { useEffect, useState } from 'react';
import type { QuizQuestion } from '@/data/amud/quizQuestions';
import type { QuizAnswer } from '@/data/amud/quizAnswers';

/**
 * Écran de passation plein écran, mobile first (cahier des charges §30) :
 * question X/N, barre de progression, timer, options, "Suivant". Le timer
 * (`secondsLeft`) est recalculé par le composant appelant à chaque tick
 * depuis `QuizSession.endsAt` — jamais un décompte stocké ici — ce qui lui
 * fait survivre à un refresh ou un passage en arrière-plan. Les réponses
 * déjà enregistrées (`existingAnswers`) permettent de reprendre exactement
 * où l'étudiant s'était arrêté.
 */
export function QuizPlayer({
  questions,
  existingAnswers,
  startIndex,
  secondsLeft,
  onAnswer,
  onFinish,
}: {
  questions: QuizQuestion[];
  existingAnswers: QuizAnswer[];
  startIndex: number;
  secondsLeft: number;
  onAnswer: (question: QuizQuestion, selectedIndex: number) => void;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(() => Math.min(startIndex, Math.max(0, questions.length - 1)));
  const question = questions[index];

  const [selected, setSelected] = useState<number | null>(() => existingAnswers.find((a) => a.questionId === question?.id)?.selectedIndex ?? null);

  useEffect(() => {
    const current = questions[index];
    setSelected(current ? existingAnswers.find((a) => a.questionId === current.id)?.selectedIndex ?? null : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!question) return null;

  const isLast = index === questions.length - 1;
  const progress = Math.round(((index + 1) / questions.length) * 100);

  function handleNext() {
    if (selected === null) return;
    onAnswer(question, selected);
    if (isLast) onFinish();
    else setIndex((i) => i + 1);
  }

  return (
    <div className="flex h-full flex-col bg-amud-surface p-lg">
      <div className="mb-md flex items-center justify-between text-label-md text-amud-on-surface-variant">
        <span>
          Question {index + 1}/{questions.length}
        </span>
        <span className="font-semibold text-amud-primary">
          {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
        </span>
      </div>
      <div className="mb-lg h-2 w-full overflow-hidden rounded-full bg-amud-surface-container-high">
        <div className="h-full rounded-full bg-amud-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <p className="mb-lg text-title-lg font-semibold text-amud-on-surface">{question.texte}</p>

      <div className="flex flex-1 flex-col gap-sm">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`min-h-[56px] rounded-xl border-2 px-lg text-left text-body-lg font-medium transition-colors ${
              selected === i ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={selected === null}
        className="mt-lg min-h-[52px] w-full rounded-lg bg-amud-primary text-label-lg font-semibold text-white shadow-sm transition-colors hover:bg-amud-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {isLast ? 'Terminer' : 'Suivant'}
      </button>
    </div>
  );
}
