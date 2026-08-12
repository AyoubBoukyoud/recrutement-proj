'use client';

// Quiz Métier — auto-évaluation des compétences techniques avant candidature.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Question {
  question: string;
  tag: string;
  options: string[];
  correctIndex: number;
}

const QUESTIONS: Question[] = [
  {
    question: "Quel est l'appareil utilisé pour mesurer la tension électrique dans un circuit ?",
    tag: 'Technique de mesure',
    options: ['Ampèremètre', 'Voltmètre', 'Ohmmètre', 'Wattmètre'],
    correctIndex: 1,
  },
  {
    question: 'Quelle norme régit les installations électriques basse tension en Allemagne ?',
    tag: 'Réglementation',
    options: ['VDE 0100', 'ISO 9001', 'DIN EN 12464', 'RGE'],
    correctIndex: 0,
  },
  {
    question: 'Que signifie le sigle « EPI » sur un chantier ?',
    tag: 'Sécurité',
    options: ['Équipement Portable Intégré', 'Équipement de Protection Individuelle', 'Étude Préalable Industrielle', 'Aucune de ces réponses'],
    correctIndex: 1,
  },
];

export default function QuizMetierPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);

  const question = QUESTIONS[index];
  const progress = Math.round(((index + (selected !== null ? 1 : 0)) / QUESTIONS.length) * 100);

  const handleNext = () => {
    const nextAnswers = [...answers, selected];
    if (index + 1 >= QUESTIONS.length) {
      setAnswers(nextAnswers);
      setFinished(true);
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
          <h1 className="text-lg font-bold text-primary-dark">Quiz Métier</h1>
        </header>
        <main className="mx-auto flex max-w-[600px] flex-col items-center space-y-6 px-4 py-16 text-center lg:max-w-[720px] lg:px-10">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gold/10">
            <span className="material-symbols-outlined text-gold-dark" style={{ fontSize: 48 }}>emoji_events</span>
          </div>
          <h2 className="text-2xl font-bold text-primary-dark">
            {score} / {QUESTIONS.length} bonnes réponses
          </h2>
          <p className="text-onSurface-variant">
            Ce résultat sera visible par les recruteurs intéressés par votre profil technique.
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/offres"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-dark py-4 text-sm font-semibold text-on-primary transition-all active:scale-95"
            >
              Retour aux offres
            </Link>
            <button
              type="button"
              onClick={() => {
                setIndex(0);
                setSelected(null);
                setAnswers([]);
                setFinished(false);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-outline bg-surface-container-lowest py-4 text-sm font-semibold text-primary-dark transition-all active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
              Recommencer
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-20 flex h-16 w-full items-center gap-4 border-b border-outline-variant bg-surface px-4 lg:px-10">
        <button type="button" onClick={() => router.back()} className="p-2 transition-transform active:scale-95">
          <span className="material-symbols-outlined text-primary-dark">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-primary-dark">Quiz Métier</h1>
      </header>

      <main className="mx-auto max-w-[800px] space-y-8 px-4 pt-6 lg:px-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-onSurface">Électricien Bâtiment</h2>
            <span className="text-sm font-bold text-primary-dark">
              Question {index + 1} sur {QUESTIONS.length}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
            <div className="h-full rounded-full bg-primary-container transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm" style={{ borderLeft: '4px solid #006266' }}>
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
                    isSelected ? 'bg-gold text-white' : 'bg-surface-container text-onSurface-variant'
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

        <div className="fixed bottom-0 left-0 w-full bg-surface p-4 md:relative md:bottom-auto md:bg-transparent md:p-0">
          <button
            type="button"
            onClick={handleNext}
            disabled={selected === null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-dark py-4 text-sm font-bold text-on-primary shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 md:shadow-none"
          >
            {index + 1 >= QUESTIONS.length ? 'Voir mon résultat' : 'Question suivante'}
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </main>
    </div>
  );
}
