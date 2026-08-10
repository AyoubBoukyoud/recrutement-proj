'use client';

// Page : Leçon d'allemand quotidienne avec Prononciation & Flashcards Interactives

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';

const FLASHCARDS = [
  { id: '1', de: 'Guten Morgen', fr: 'Bonjour (matin)', ar: 'صباح الخير', phonetics: '[goo-ten mor-gen]', icon: 'wb_sunny' },
  { id: '2', de: 'Wie geht es Ihnen?', fr: 'Comment allez-vous ?', ar: 'كيف حالك؟', phonetics: '[vee gayt es ee-nen]', icon: 'help_outline' },
  { id: '3', de: 'Vielen Dank', fr: 'Merci beaucoup', ar: 'شكرا جزيلا', phonetics: '[fee-len dank]', icon: 'thumb_up' },
  { id: '4', de: 'Auf Wiedersehen', fr: 'Au revoir', ar: 'إلى اللقاء', phonetics: '[owf vee-der-zay-en]', icon: 'waving_hand' },
  { id: '5', de: 'Entschuldigung', fr: 'Excusez-moi / Pardon', ar: 'عذراً', phonetics: '[ent-shool-dee-goong]', icon: 'chat' },
];

const QUIZ_QUESTIONS = [
  {
    question: 'Comment dit-on "Bonjour (matin)" en allemand ?',
    correct: 'Guten Morgen',
    options: ['Guten Morgen', 'Gute Nacht', 'Danke'],
  },
  {
    question: 'Que signifie "Vielen Dank" ?',
    correct: 'Merci beaucoup',
    options: ['Au revoir', 'Merci beaucoup', 'S\'il vous plaît'],
  },
  {
    question: 'Traduisez "Au revoir" en allemand :',
    correct: 'Auf Wiedersehen',
    options: ['Entschuldigung', 'Auf Wiedersehen', 'Hallo'],
  },
];

export default function CoursAllemandPage() {
  const { t } = useLanguage();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(7);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = FLASHCARDS[currentCardIndex];
  const currentQuiz = QUIZ_QUESTIONS[currentQuizIndex];

  // Speech synthesis for native German audio playback
  const speakGerman = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
      toast.success(`🔊 Prononciation: "${text}"`, { duration: 2000, position: 'bottom-center' });
    } else {
      toast('🔊 Sound effect played', { duration: 1500 });
    }
  };

  const handleSelectQuiz = (option: string) => {
    if (selectedQuiz !== null) return; // Prevent multiple clicks
    setSelectedQuiz(option);
    if (option === currentQuiz.correct) {
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
      toast.success('✨ Bravo ! Réponse correcte (+1 point)', { icon: '🎉', duration: 2500 });
    } else {
      toast.error(`Dommage ! La bonne réponse était "${currentQuiz.correct}"`, { duration: 3000 });
    }
  };

  const handleNextQuiz = () => {
    setSelectedQuiz(null);
    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      toast.success(`🎯 Quiz terminé ! Votre score: ${score + (selectedQuiz === currentQuiz.correct ? 1 : 0)}/${QUIZ_QUESTIONS.length}`, {
        duration: 4000,
      });
      setCurrentQuizIndex(0);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 text-onSurface">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center gap-4 border-b border-outline-variant bg-surface px-4 shadow-sm">
        <Link
          href="/dashboard"
          aria-label={t('common:actions.back')}
          className="p-2 transition-transform active:scale-95 text-primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            arrow_back
          </span>
        </Link>
        <h1 className="flex-1 truncate text-lg font-extrabold text-primary">{t('candidateD:coursAllemand.title')}</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1.5 border border-gold/40">
          <span className="material-symbols-outlined fill text-tertiary" style={{ fontSize: 18 }}>
            local_fire_department
          </span>
          <span className="text-xs font-bold text-tertiary">
            {streak} jours d'affilée
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[600px] flex-1 flex-col space-y-8 px-4 py-6">
        {/* Weekly Progress */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">
              Progression hebdo (A1 Level)
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

        {/* Main Lesson Card / Interactive Flashcard */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-primary uppercase tracking-wider">
              Flashcard {currentCardIndex + 1} / {FLASHCARDS.length}
            </h2>
            <span className="text-xs font-semibold text-onSurface-variant">Cliquez pour tourner 🔄</span>
          </div>

          <article
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-surface-container-lowest to-surface-container-low p-8 shadow-md transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
                <span className="material-symbols-outlined text-[48px]">{currentCard.icon}</span>
              </div>

              {!isFlipped ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <h2 className="text-3xl font-extrabold text-primary tracking-tight">{currentCard.de}</h2>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakGerman(currentCard.de);
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-onPrimary transition-all hover:scale-105 active:scale-95 shadow-md"
                      title="Ecouter la prononciation"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        volume_up
                      </span>
                    </button>
                  </div>
                  <p className="text-xs font-mono text-outline">{currentCard.phonetics}</p>
                </div>
              ) : (
                <div className="w-full space-y-3 border-t border-outline-variant/30 pt-4 animate-fadeIn">
                  <div className="flex items-center justify-between rounded-xl bg-surface-container p-3.5">
                    <span className="text-xs font-semibold text-onSurface-variant">Français</span>
                    <span className="text-base font-black text-onSurface">{currentCard.fr}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-surface-container p-3.5">
                    <span className="text-xs font-semibold text-onSurface-variant">Arabe</span>
                    <span className="text-base font-black text-onSurface" dir="rtl">
                      {currentCard.ar}
                    </span>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="grid w-full grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakGerman(currentCard.de);
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-surface-container-high text-xs font-extrabold text-primary transition-colors hover:bg-surface-container-highest active:scale-95"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    volume_up
                  </span>
                  Écouter
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev + 1) % FLASHCARDS.length);
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-extrabold text-onPrimary shadow-md transition-all hover:opacity-95 active:scale-95"
                >
                  Suivant
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          </article>
        </section>

        {/* Mini Quiz Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: 22 }}>
                quiz
              </span>
              <h3 className="text-lg font-extrabold text-onSurface">Quiz de révision</h3>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
              Score: {score}
            </span>
          </div>

          <div className="space-y-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle">
            <p className="text-base font-bold text-onSurface">{currentQuiz.question}</p>

            <div className="grid grid-cols-1 gap-3">
              {currentQuiz.options.map((option) => {
                const isSelected = selectedQuiz === option;
                const isCorrect = option === currentQuiz.correct;
                let btnStyle = 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low';

                if (selectedQuiz !== null) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200';
                  } else if (isSelected) {
                    btnStyle = 'border-error bg-error/10 text-error';
                  }
                }

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectQuiz(option)}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-extrabold transition-all active:scale-[0.98] ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {selectedQuiz !== null && isCorrect && (
                      <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: 22 }}>
                        check_circle
                      </span>
                    )}
                    {selectedQuiz !== null && isSelected && !isCorrect && (
                      <span className="material-symbols-outlined text-error" style={{ fontSize: 22 }}>
                        cancel
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedQuiz !== null && (
              <button
                type="button"
                onClick={handleNextQuiz}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-onPrimary shadow-md transition-all active:scale-95"
              >
                Question Suivante
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  arrow_forward
                </span>
              </button>
            )}
          </div>
        </section>

        {/* Footer Action */}
        <footer className="pb-4 pt-4">
          <Link
            href="/dashboard"
            className="flex h-14 w-full items-center justify-center rounded-xl bg-secondary text-base font-extrabold text-onSecondary shadow-lg transition-all hover:opacity-95 active:scale-95"
          >
            {t('candidateD:coursAllemand.done')}
          </Link>
        </footer>
      </main>
    </div>
  );
}

