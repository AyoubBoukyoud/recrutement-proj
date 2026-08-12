'use client';

// Leçon quotidienne — Allemand du quotidien (phrase du jour + mini quiz).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const WEEK_SLOTS = ['done', 'done', 'done', 'done', 'done', 'active', 'remaining'] as const;

const QUIZ_OPTIONS = [
  { text: 'Guten Tag', correct: true },
  { text: 'Gute Nacht', correct: false },
  { text: 'Danke', correct: false },
];

function speak(text: string, lang: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
}

export default function LeconJourPage() {
  const router = useRouter();
  const [isRepeating, setIsRepeating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleRepeat = () => {
    setIsRepeating(true);
    setFeedback(null);
    setTimeout(() => {
      setIsRepeating(false);
      setFeedback('Bien prononcé ! 🎉');
      setTimeout(() => setFeedback(null), 2500);
    }, 1500);
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-20 flex h-16 w-full items-center gap-4 border-b border-outline-variant bg-surface px-4 lg:px-10">
        <Link href="/dashboard" className="p-2 transition-transform active:scale-95">
          <span className="material-symbols-outlined text-primary-dark">arrow_back</span>
        </Link>
        <h1 className="flex-1 truncate text-lg font-bold text-primary-dark">Allemand du quotidien</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5">
          <span className="material-symbols-outlined fill text-gold" style={{ fontSize: 18 }}>local_fire_department</span>
          <span className="text-sm font-bold text-gold-dark">7 jours</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[600px] space-y-8 px-4 py-6 lg:max-w-[720px] lg:px-10 lg:py-10">
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">Progression hebdomadaire</span>
            <span className="text-xs font-bold text-primary-dark">85%</span>
          </div>
          <div className="flex h-2.5 gap-2">
            {WEEK_SLOTS.map((slot, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full shadow-sm ${
                  slot === 'done' ? 'bg-tertiary' : slot === 'active' ? 'animate-pulse bg-tertiary/40' : 'bg-surface-container-high'
                }`}
              />
            ))}
          </div>
        </section>

        <article className="group relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0px_4px_24px_rgba(0,69,35,0.06)]">
          <div className="absolute bottom-0 left-0 top-0 w-1.5 rounded-r-full bg-primary-dark" />
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-primary-container/10 text-primary-dark">
              <span className="material-symbols-outlined" style={{ fontSize: 48 }}>wb_sunny</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-2xl font-bold text-primary-dark">Guten Morgen</h2>
              <button
                type="button"
                onClick={() => speak('Guten Morgen', 'de-DE')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container transition-all hover:opacity-90 active:scale-90"
                aria-label="Écouter la prononciation"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>volume_up</span>
              </button>
            </div>

            <div className="w-full space-y-3 border-t border-outline-variant/30 pt-4">
              <div className="flex items-center justify-between rounded-lg bg-surface-container p-3">
                <span className="text-xs font-semibold text-onSurface-variant">Français</span>
                <span className="text-sm font-semibold">Bonjour</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-container p-3">
                <span className="text-xs font-semibold text-onSurface-variant">Arabe</span>
                <span className="text-sm font-semibold" dir="rtl">صباح الخير</span>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-4 pt-4">
              <button
                type="button"
                onClick={() => speak('Guten Morgen', 'de-DE')}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-surface-container-high text-sm font-semibold text-primary-dark transition-colors hover:bg-surface-container-highest active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>play_circle</span>
                Écouter
              </button>
              <button
                type="button"
                onClick={handleRepeat}
                disabled={isRepeating}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-dark text-sm font-semibold text-on-primary shadow-lg shadow-primary-dark/20 transition-opacity hover:opacity-95 active:scale-95 disabled:opacity-60"
              >
                <span className={`material-symbols-outlined ${isRepeating ? 'animate-pulse' : ''}`} style={{ fontSize: 20 }}>mic</span>
                {isRepeating ? 'Écoute…' : 'Répéter'}
              </button>
            </div>

            {feedback && <p className="text-sm font-bold text-primary-dark">{feedback}</p>}
          </div>
        </article>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 20 }}>quiz</span>
            <h3 className="text-lg font-bold text-onSurface">Mini Quiz</h3>
          </div>
          <div className="space-y-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <p className="text-onSurface">
              Comment dit-on <span className="font-bold">« Bonjour »</span> en allemand ?
            </p>
            <div className="grid grid-cols-1 gap-3">
              {QUIZ_OPTIONS.map((option) => {
                const isSelected = selectedOption === option.text;
                const showState = isSelected;
                return (
                  <button
                    key={option.text}
                    type="button"
                    onClick={() => setSelectedOption(option.text)}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-all active:scale-[0.98] ${
                      showState
                        ? option.correct
                          ? 'border-primary-dark bg-primary-dark/5 text-primary-dark'
                          : 'border-error bg-error/5 text-error'
                        : 'border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <span>{option.text}</span>
                    {showState && (
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        {option.correct ? 'check_circle' : 'cancel'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="pb-4 pt-2">
          <button
            type="button"
            onClick={handleFinish}
            className="w-full rounded-xl bg-tertiary py-4 text-lg font-bold text-onTertiary shadow-lg shadow-tertiary/20 transition-all hover:opacity-95 active:scale-95"
          >
            Terminé
          </button>
        </footer>
      </main>
    </div>
  );
}
