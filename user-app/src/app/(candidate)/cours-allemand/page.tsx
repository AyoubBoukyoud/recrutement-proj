'use client';

// Page : Leçon d'allemand quotidienne (Stitch exact template)

import Link from 'next/link';
import { useState } from 'react';

export default function CoursAllemandPage() {
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);

  const handleSelectQuiz = (option: string) => {
    setSelectedQuiz(option);
  };

  return (
    <div className="min-h-screen bg-surface pb-24 text-onSurface">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center gap-4 border-b border-outline-variant bg-surface px-4 lg:px-10">
        <Link
          href="/dashboard"
          aria-label="Retour"
          className="p-2 transition-transform active:scale-95 text-primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            arrow_back
          </span>
        </Link>
        <h1 className="flex-1 truncate text-lg font-bold text-primary">Allemand du quotidien</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1.5">
          <span className="material-symbols-outlined fill text-tertiary" style={{ fontSize: 18 }}>
            local_fire_department
          </span>
          <span className="text-xs font-bold text-tertiary">7 jours</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[600px] flex-1 flex-col space-y-8 px-4 py-6 lg:max-w-[720px] lg:px-10 lg:py-10">
        {/* Weekly Progress */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">
              Progression Hebdomadaire
            </span>
            <span className="text-xs font-bold text-primary">85%</span>
          </div>
          <div className="flex h-2.5 gap-2">
            <div className="flex-1 rounded-full bg-secondary shadow-sm" />
            <div className="flex-1 rounded-full bg-secondary shadow-sm" />
            <div className="flex-1 rounded-full bg-secondary shadow-sm" />
            <div className="flex-1 rounded-full bg-secondary shadow-sm" />
            <div className="flex-1 rounded-full bg-secondary shadow-sm" />
            <div className="flex-1 animate-pulse rounded-full bg-secondary/40" />
            <div className="flex-1 rounded-full bg-surface-container-high" />
          </div>
        </section>

        {/* Main Lesson Card */}
        <article className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-subtle">
          <div className="absolute bottom-0 left-0 top-0 w-1.5 rounded-r-full bg-primary" />
          <div className="flex flex-col items-center space-y-6 text-center">
            {/* Illustrative Icon */}
            <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-surface-container-low text-primary">
              <span className="material-symbols-outlined text-[48px]">wb_sunny</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-3xl font-extrabold text-primary">Guten Morgen</h2>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-onPrimary transition-all hover:opacity-90 active:scale-90 shadow-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    volume_up
                  </span>
                </button>
              </div>
            </div>

            <div className="w-full space-y-4 border-t border-outline-variant/30 pt-4">
              <div className="flex items-center justify-between rounded-lg bg-surface-container p-3">
                <span className="text-xs font-semibold text-onSurface-variant">Français</span>
                <span className="text-sm font-extrabold text-onSurface">Bonjour</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-container p-3">
                <span className="text-xs font-semibold text-onSurface-variant">Arabe</span>
                <span className="text-sm font-extrabold text-onSurface" dir="rtl">
                  صباح الخير
                </span>
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="grid w-full grid-cols-2 gap-4 pt-4">
              <button
                type="button"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-surface-container-high text-sm font-bold text-primary transition-colors hover:bg-surface-container-highest active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  play_circle
                </span>
                Écouter
              </button>
              <button
                type="button"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-onPrimary shadow-md transition-opacity hover:opacity-95 active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  mic
                </span>
                Répéter
              </button>
            </div>
          </div>
        </article>

        {/* Mini Quiz Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: 20 }}>
              quiz
            </span>
            <h3 className="text-lg font-bold text-onSurface">Mini Quiz</h3>
          </div>

          <div className="space-y-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle">
            <p className="text-base font-semibold text-onSurface">
              Comment dit-on <span className="font-extrabold text-primary">&quot;Bonjour&quot;</span> en allemand ?
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => handleSelectQuiz('Guten Tag')}
                className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-bold transition-all active:scale-[0.98] ${
                  selectedQuiz === 'Guten Tag'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
              >
                <span>Guten Tag</span>
                {selectedQuiz === 'Guten Tag' && (
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                    check_circle
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuiz('Gute Nacht')}
                className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-bold transition-all active:scale-[0.98] ${
                  selectedQuiz === 'Gute Nacht'
                    ? 'border-error bg-error/10 text-error'
                    : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
              >
                <span>Gute Nacht</span>
                {selectedQuiz === 'Gute Nacht' && (
                  <span className="material-symbols-outlined text-error" style={{ fontSize: 20 }}>
                    cancel
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuiz('Danke')}
                className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-bold transition-all active:scale-[0.98] ${
                  selectedQuiz === 'Danke'
                    ? 'border-error bg-error/10 text-error'
                    : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
              >
                <span>Danke</span>
                {selectedQuiz === 'Danke' && (
                  <span className="material-symbols-outlined text-error" style={{ fontSize: 20 }}>
                    cancel
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Footer Action */}
        <footer className="pb-4 pt-8">
          <Link
            href="/dashboard"
            className="flex h-14 w-full items-center justify-center rounded-xl bg-secondary text-lg font-bold text-onSecondary shadow-lg transition-all hover:opacity-95 active:scale-95"
          >
            Terminé
          </Link>
        </footer>
      </main>
    </div>
  );
}
