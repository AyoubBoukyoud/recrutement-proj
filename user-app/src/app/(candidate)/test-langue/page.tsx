'use client';

// Interface 13 — Test de langue IA (vocal).

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useProfile } from '@/context/ProfileContext';
import { useNetwork } from '@/context/NetworkContext';
import { CEFR_LEVELS } from '@/lib/mockData';

const PROMPT = 'Thema: Beschreiben Sie Ihren Beruf und Ihre täglichen Aufgaben im Detail.';
const PROMPT_HINT = 'Consigne : Parlez pendant au moins 45 secondes de votre métier et de vos responsabilités quotidiennes.';

type Stage = 'preparation' | 'recording' | 'analysis' | 'results';

function scoreToLevel(score: number): (typeof CEFR_LEVELS)[number] {
  const index = Math.min(CEFR_LEVELS.length - 1, Math.floor((score / 100) * CEFR_LEVELS.length));
  return CEFR_LEVELS[index];
}

export default function TestLanguePage() {
  const { profile, updateProfile } = useProfile();
  const { isOnline, queueAction } = useNetwork();

  const [stage, setStage] = useState<Stage>(profile.testLangueScore !== null ? 'results' : 'preparation');
  const [score, setScore] = useState<number | null>(profile.testLangueScore);
  const [seconds, setSeconds] = useState(60);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ pronunciation: 0, fluency: 0, vocabulary: 0 });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startTest = async () => {
    setStage('recording');
    setSeconds(60);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          stopTest();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        recorder.start();
        mediaRecorderRef.current = recorder;
      }
    } catch {
      // Pas de micro disponible — le test continue en mode simulé.
    }
  };

  const stopTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    analyze();
  };

  const analyze = () => {
    setStage('analysis');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          finishAnalysis();
          return 100;
        }
        return p + 5;
      });
    }, 150);
  };

  const finishAnalysis = () => {
    const generatedScore = 62 + Math.floor(Math.random() * 30);
    setScore(generatedScore);
    setStats({
      pronunciation: 70 + Math.floor(Math.random() * 25),
      fluency: 65 + Math.floor(Math.random() * 25),
      vocabulary: 75 + Math.floor(Math.random() * 20),
    });
    updateProfile({ testLangueScore: generatedScore });
    if (!isOnline) {
      queueAction('submit_test_langue', { score: generatedScore });
    }
    setStage('results');
  };

  const restart = () => {
    setStage('preparation');
    setScore(null);
    setProgress(0);
  };

  const level = score !== null ? scoreToLevel(score) : null;
  const timerLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const gaugeCircumference = 552.92;
  const gaugeOffset = score ? gaugeCircumference * (1 - score / 100) : gaugeCircumference;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="flex h-16 max-w-4xl items-center justify-between px-6 mx-auto w-full">
        <Link href="/dashboard" className="text-primary-dark transition-opacity hover:opacity-80">
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-primary-dark">Test de langue — Allemand</h1>
        <span className="w-6" />
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-8 pt-4">
        {stage === 'preparation' && (
          <section className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 64, fontVariationSettings: "'wght' 300" }}>
                headset_mic
              </span>
            </div>
            <h2 className="mb-1 text-2xl font-bold text-primary-dark">Prêt pour votre évaluation ?</h2>
            <p className="mx-auto mb-6 max-w-md text-onSurface-variant">
              L&apos;intelligence artificielle analysera votre fluidité, votre prononciation et votre vocabulaire en temps réel.
            </p>

            <div className="mb-8 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary-container" style={{ fontSize: 18 }}>topic</span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-container">Sujet de l&apos;épreuve</span>
              </div>
              <p className="mb-2 text-lg font-semibold italic text-primary-dark">&quot;{PROMPT}&quot;</p>
              <p className="border-t border-outline-variant pt-2 text-sm text-onSurface-variant">{PROMPT_HINT}</p>
            </div>

            <button
              type="button"
              onClick={startTest}
              className="flex items-center justify-center gap-2 rounded-full bg-primary-container px-8 py-4 text-sm font-semibold text-on-primary transition-all hover:shadow-lg active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>mic</span>
              Démarrer le test
            </button>
          </section>
        )}

        {stage === 'recording' && (
          <section className="flex flex-col items-center py-8 text-center">
            <div className="mb-6 flex items-center gap-2">
              <span className="h-3 w-3 animate-pulse rounded-full bg-error" />
              <span className="text-xs font-bold uppercase tracking-widest text-error">Enregistrement en cours…</span>
            </div>
            <div className="mb-10 text-5xl font-bold tabular-nums text-primary-dark">{timerLabel}</div>
            <div className="mb-10 flex h-24 w-full max-w-xs items-end justify-center gap-1.5 px-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 animate-[wave_1s_ease-in-out_infinite] rounded-full ${i % 2 === 0 ? 'bg-primary-container' : 'bg-primary-dark'}`}
                  style={{ animationDelay: `${(i % 6) * 0.1}s`, height: 8 }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={stopTest}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-error text-onError shadow-lg transition-transform hover:opacity-90 active:scale-90"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 30 }}>stop</span>
            </button>
          </section>
        )}

        {stage === 'analysis' && (
          <section className="flex flex-col items-center py-10 text-center">
            <div className="relative mb-8 flex h-48 w-48 items-center justify-center">
              <div className="absolute inset-0 animate-[concentric_2s_ease-out_infinite] rounded-full border-4 border-primary-dark/20" />
              <div className="absolute inset-0 animate-[concentric_2s_ease-out_infinite] rounded-full border-4 border-primary-dark/10" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-0 animate-[concentric_2s_ease-out_infinite] rounded-full border-4 border-primary-dark/5" style={{ animationDelay: '1s' }} />
              <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 56 }}>psychology</span>
            </div>
            <h3 className="mb-1 text-xl font-bold text-primary-dark">Analyse de votre prononciation…</h3>
            <p className="mb-6 text-onSurface-variant">L&apos;IA compare vos phonèmes aux standards allemands.</p>
            <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-primary-dark transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </section>
        )}

        {stage === 'results' && level && score !== null && (
          <section>
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0px_8px_30px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col items-center gap-6 md:flex-row">
                <div className="relative flex h-48 w-48 shrink-0 items-center justify-center">
                  <svg className="h-full w-full -rotate-90 transform">
                    <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-container-low" />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={gaugeCircumference}
                      strokeDashoffset={gaugeOffset}
                      className="text-primary-dark transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-primary-dark">{level}</span>
                    <span className="text-xs text-onSurface-variant">Niveau {level}</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-dark/5 px-3 py-1 text-primary-dark">
                    <span className="material-symbols-outlined fill" style={{ fontSize: 16 }}>verified</span>
                    <span className="text-xs font-bold uppercase tracking-wide">Vérifié par IA</span>
                  </div>
                  <h2 className="mb-1 text-2xl font-bold text-primary-dark">Excellent travail !</h2>
                  <p className="text-sm text-onSurface-variant">
                    Votre maîtrise de l&apos;allemand est solide. Score global : {score}/100.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                {[
                  { label: 'Prononciation', value: stats.pronunciation },
                  { label: 'Fluidité', value: stats.fluency },
                  { label: 'Vocabulaire', value: stats.vocabulary },
                ].map((stat) => (
                  <div key={stat.label} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-primary-dark">{stat.label}</span>
                      <span className="font-bold text-primary-dark">{stat.value}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary-dark" style={{ width: `${stat.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/profil"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-dark py-4 text-sm font-semibold text-on-primary shadow-sm transition-all hover:shadow-lg active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>leaderboard</span>
                Voir mon profil
              </Link>
              <button
                type="button"
                onClick={restart}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-outline bg-surface-container-lowest py-4 text-sm font-semibold text-primary-dark transition-all hover:bg-surface-container-low active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
                Repasser le test
              </button>
            </div>
          </section>
        )}
      </main>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        @keyframes concentric {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
