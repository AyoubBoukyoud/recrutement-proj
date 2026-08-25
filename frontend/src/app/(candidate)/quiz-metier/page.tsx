'use client';

// Quiz Métier — auto-évaluation des compétences techniques avant candidature.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, IconButton } from '@/components/shared/Button';
import { useLanguage } from '@/context/LanguageContext';
import { candidateQuizMetierContentFor } from '@/lib/candidateQuizMetierContent';
import { useAuth } from '@/context/AuthContext';
import { candidateProfileRepository } from '@/data/candidateProfile';
import { useInvalidateCandidateProfile } from '@/lib/useCandidateProfile';

export default function QuizMetierPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const content = candidateQuizMetierContentFor(language);
  const { token } = useAuth();
  const invalidateProfile = useInvalidateCandidateProfile();
  const QUESTIONS = content.questions;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);

  const question = QUESTIONS[index];
  const progress = Math.round(((index + (selected !== null ? 1 : 0)) / QUESTIONS.length) * 100);

  const handleNext = async () => {
    const nextAnswers = [...answers, selected];
    if (index + 1 >= QUESTIONS.length) {
      setAnswers(nextAnswers);
      setFinished(true);
      if (token) {
        const finalScore = nextAnswers.filter((a, i) => a === QUESTIONS[i]?.correctIndex).length;
        await candidateProfileRepository.update({ orientation_result: content.jobTitle, orientation_score: Math.round(finalScore / QUESTIONS.length * 100) }, token);
        await invalidateProfile();
      }
    } else {
      setAnswers(nextAnswers);
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const score = answers.filter((a, i) => a === QUESTIONS[i]?.correctIndex).length;

  if (finished) {
    return (
      <div className="min-h-screen bg-surface pb-24">
        <header className="sticky top-0 z-20 flex h-16 w-full items-center gap-4 border-b border-outline-variant bg-surface px-4 lg:px-10">
          <Link href="/offres" className="p-2 transition-transform active:scale-95">
            <span className="material-symbols-outlined text-primary-dark">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-primary-dark">{content.header.title}</h1>
        </header>
        <main className="mx-auto flex max-w-[600px] flex-col items-center space-y-6 px-4 py-16 text-center lg:max-w-[720px] lg:px-10">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gold/10">
            <span className="material-symbols-outlined text-gold-dark" style={{ fontSize: 48 }}>emoji_events</span>
          </div>
          <h2 className="text-2xl font-bold text-primary-dark">
            {content.finished.scoreTemplate.replace('{score}', String(score)).replace('{total}', String(QUESTIONS.length))}
          </h2>
          <p className="text-onSurface-variant">
            {content.finished.description}
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/offres"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-dark py-4 text-sm font-semibold text-on-primary transition-all active:scale-95"
            >
              {content.finished.backToOffers}
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setIndex(0);
                setSelected(null);
                setAnswers([]);
                setFinished(false);
              }}
              className="flex-1 text-primary-dark"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
              {content.finished.restart}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-20 flex h-16 w-full items-center gap-4 border-b border-outline-variant bg-surface px-4 lg:px-10">
        <IconButton variant="ghost" onClick={() => router.back()} aria-label={content.header.backAria}>
          <span className="material-symbols-outlined text-primary-dark">arrow_back</span>
        </IconButton>
        <h1 className="text-lg font-bold text-primary-dark">{content.header.title}</h1>
      </header>

      <main className="mx-auto max-w-[800px] space-y-8 px-4 pt-6 lg:px-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-onSurface">{content.jobTitle}</h2>
            <span className="text-sm font-bold text-primary-dark">
              {content.questionOf.replace('{index}', String(index + 1)).replace('{total}', String(QUESTIONS.length))}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
            <div className="h-full rounded-full bg-primary-container transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <article className="rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-sm">
          <p className="mb-4 text-lg font-semibold text-onSurface">{question.question}</p>
          <div className="inline-flex items-center rounded-lg border border-outline-variant bg-surface-container px-3 py-1">
            <span className="material-symbols-outlined mr-2 text-primary-dark" style={{ fontSize: 16 }}>engineering</span>
            <span className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{question.tag}</span>
          </div>
        </article>

        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          {question.options.map((option, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSelected(i)}
                className={`flex items-center rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${
                  isSelected ? 'border-2 border-gold bg-gold/5' : 'border-outline-variant bg-surface-container-lowest hover:border-primary-dark'
                }`}
              >
                <div
                  className={`mr-4 flex h-10 w-10 items-center justify-center rounded-lg font-bold ${
                    isSelected ? 'bg-gold text-onSecondary' : 'bg-surface-container text-onSurface-variant'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span className={`text-sm font-medium text-onSurface ${isSelected ? 'font-bold' : ''}`}>{option}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined fill text-gold-dark" style={{ fontSize: 20 }}>check_circle</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 w-full bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-subtle md:relative md:bottom-auto md:z-auto md:bg-transparent md:p-0 md:shadow-none">
          <Button
            size="lg"
            fullWidth
            onClick={handleNext}
            disabled={selected === null}
            className="bg-primary-dark shadow-md hover:enabled:opacity-90 md:shadow-none"
          >
            {index + 1 >= QUESTIONS.length ? content.resultButton : content.nextButton}
            <span className="material-symbols-outlined">chevron_right</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
