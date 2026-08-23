'use client';

// Leçon quotidienne — Allemand du quotidien (phrase du jour + mini quiz).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, IconButton } from '@/components/shared/Button';
import { useLanguage } from '@/context/LanguageContext';
import { candidateLeconJourContentFor } from '@/lib/candidateLeconJourContent';

const WEEK_SLOTS = ['done', 'done', 'done', 'done', 'done', 'active', 'remaining'] as const;

// Nombre de jours de la série en cours — mock, non traduisible (interpolé dans
// `content.streak.label`).
const STREAK_DAYS = 7;

// Contenu de la leçon du jour : le mot allemand enseigné et ses traductions de
// référence (française et arabe) restent fixes quelle que soit la langue de
// l'interface — ce sont les données pédagogiques, pas du texte d'UI.
const GERMAN_PHRASE = 'Guten Morgen';
const FRENCH_TRANSLATION = 'Bonjour';
const ARABIC_TRANSLATION = 'صباح الخير';

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
  const { language } = useLanguage();
  const content = candidateLeconJourContentFor(language);
  const [isRepeating, setIsRepeating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleRepeat = () => {
    setIsRepeating(true);
    setFeedback(null);
    setTimeout(() => {
      setIsRepeating(false);
      setFeedback(content.lesson.feedback);
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
        <h1 className="flex-1 truncate text-lg font-bold text-primary-dark">{content.header.title}</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5">
          <span className="material-symbols-outlined fill text-gold" style={{ fontSize: 18 }}>local_fire_department</span>
          <span className="text-sm font-bold text-gold-dark">{content.streak.label.replace('{count}', String(STREAK_DAYS))}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[600px] space-y-8 px-4 py-6 lg:max-w-[720px] lg:px-10 lg:py-10">
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{content.progress.label}</span>
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
              <h2 className="text-2xl font-bold text-primary-dark">{GERMAN_PHRASE}</h2>
              <IconButton
                variant="primary"
                onClick={() => speak(GERMAN_PHRASE, 'de-DE')}
                aria-label={content.lesson.listenAria}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>volume_up</span>
              </IconButton>
            </div>

            <div className="w-full space-y-3 border-t border-outline-variant/30 pt-4">
              <div className="flex items-center justify-between rounded-lg bg-surface-container p-3">
                <span className="text-xs font-semibold text-onSurface-variant">{content.lesson.frenchLabel}</span>
                <span className="text-sm font-semibold">{FRENCH_TRANSLATION}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-container p-3">
                <span className="text-xs font-semibold text-onSurface-variant">{content.lesson.arabicLabel}</span>
                <span className="text-sm font-semibold" dir="rtl">{ARABIC_TRANSLATION}</span>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-4 pt-4">
              <Button variant="tonal" onClick={() => speak(GERMAN_PHRASE, 'de-DE')} className="flex-1">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>play_circle</span>
                {content.lesson.listen}
              </Button>
              <Button onClick={handleRepeat} disabled={isRepeating} className="flex-1 shadow-lg shadow-primary-dark/20">
                <span className={`material-symbols-outlined ${isRepeating ? 'animate-pulse' : ''}`} style={{ fontSize: 20 }}>mic</span>
                {isRepeating ? content.lesson.repeating : content.lesson.repeat}
              </Button>
            </div>

            {feedback && <p className="text-sm font-bold text-primary-dark">{feedback}</p>}
          </div>
        </article>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 20 }}>quiz</span>
            <h3 className="text-lg font-bold text-onSurface">{content.quiz.title}</h3>
          </div>
          <div className="space-y-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <p className="text-onSurface">{content.quiz.question}</p>
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
          <Button
            size="lg"
            fullWidth
            onClick={handleFinish}
            className="bg-tertiary text-onTertiary shadow-lg shadow-tertiary/20 hover:enabled:bg-tertiary-dark"
          >
            {content.finish}
          </Button>
        </footer>
      </main>
    </div>
  );
}
