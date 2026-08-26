'use client';

// Interface 13 — Test de langue IA (vocal).
//
// Enregistrement réel → POST /candidate/language-assessments → poll jusqu'à
// ce que le job de transcription/notation ait fini. Le score n'est plus
// simulé : c'est celui que CefrScorer calcule côté back.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/shared/Button';
import { ApiError } from '@/lib/api';
import { isPending, failureMessage, type LanguageAssessmentResult } from '@/lib/languageAssessment';
import { languageAssessmentRepository } from '@/data/languageAssessment';
import { useLanguage } from '@/context/LanguageContext';
import { candidateTestLangueContentFor, type CandidateTestLangueContent } from '@/lib/candidateTestLangueContent';

const MIN_SECONDS = 20;
const MAX_SECONDS = 60;

type Stage = 'preparation' | 'recording' | 'uploading' | 'analysis' | 'results' | 'failed';

function messageOf(error: unknown, fallback: string, content: CandidateTestLangueContent): string {
  if (error instanceof ApiError) {
    if (error.isNetworkFailure) return content.errors.networkUnreachable;
    return error.message || fallback;
  }
  return fallback;
}

export default function TestLanguePage() {
  const { language } = useLanguage();
  const content = candidateTestLangueContentFor(language);
  const { token } = useAuth();

  const [stage, setStage] = useState<Stage>('preparation');
  const [seconds, setSeconds] = useState(MAX_SECONDS);
  const [result, setResult] = useState<LanguageAssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const upload = async (blob: Blob) => {
    if (!token) return;
    setStage('uploading');
    setError(null);

    try {
      const created = await languageAssessmentRepository.submit('de', blob, token);
      setResult(created);
      setStage('analysis');
      pollRef.current = setInterval(async () => {
        try {
          const fresh = await languageAssessmentRepository.get(created.id, token);
          if (!isPending(fresh.status)) {
            if (pollRef.current) clearInterval(pollRef.current);
            setResult(fresh);
            setStage(fresh.status === 'completed' ? 'results' : 'failed');
          }
        } catch {
          // Un trou de réseau ne doit pas arrêter l'attente.
        }
      }, 2000);
    } catch (cause) {
      setError(messageOf(cause, content.errors.uploadFailed, content));
      setStage('preparation');
    }
  };

  const startTest = async () => {
    setError(null);
    elapsedRef.current = 0;
    setStage('recording');
    setSeconds(MAX_SECONDS);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (elapsedRef.current < MIN_SECONDS) {
          setError(
            content.errors.recordingTooShort
              .replace('{seconds}', String(elapsedRef.current))
              .replace('{minSeconds}', String(MIN_SECONDS))
          );
          setStage('preparation');
          return;
        }
        void upload(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setSeconds((s) => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            stopRecording();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      setError(content.errors.microphoneUnavailable);
      setStage('preparation');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const restart = () => {
    setStage('preparation');
    setResult(null);
    setError(null);
  };

  const timerLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const gaugeCircumference = 552.92;
  const score = result?.pronunciation_score ?? null;
  const gaugeOffset = score ? gaugeCircumference * (1 - score / 100) : gaugeCircumference;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="flex h-16 max-w-4xl items-center justify-between px-2.5 mx-auto w-full lg:px-4">
        <Link href="/dashboard" className="text-primary-dark transition-opacity hover:opacity-80">
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-primary-dark">{content.header.title}</h1>
        <span className="w-6" />
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-8 pt-4 lg:max-w-4xl lg:px-10">
        {stage === 'preparation' && (
          <section className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 64, fontVariationSettings: "'wght' 300" }}>
                headset_mic
              </span>
            </div>
            <h2 className="mb-1 text-2xl font-bold text-primary-dark">{content.preparation.heading}</h2>
            <p className="mx-auto mb-6 max-w-md text-onSurface-variant">{content.preparation.intro}</p>

            <div className="mb-8 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary-container" style={{ fontSize: 18 }}>topic</span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-container">{content.preparation.topicLabel}</span>
              </div>
              <p className="mb-2 text-lg font-semibold italic text-primary-dark">&quot;{content.preparation.topic}&quot;</p>
              <p className="border-t border-outline-variant pt-2 text-sm text-onSurface-variant">
                {content.preparation.hint.replace('{seconds}', String(MIN_SECONDS))}
              </p>
            </div>

            {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}

            <Button size="lg" pill onClick={() => void startTest()} className="px-8 hover:enabled:shadow-lg">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>mic</span>
              {content.preparation.startButton}
            </Button>
          </section>
        )}

        {stage === 'recording' && (
          <section className="flex flex-col items-center py-8 text-center">
            <div className="mb-6 flex items-center gap-2">
              <span className="h-3 w-3 animate-pulse rounded-full bg-error" />
              <span className="text-xs font-bold uppercase tracking-widest text-error">{content.recording.inProgress}</span>
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
              onClick={stopRecording}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-error text-onError shadow-lg transition-transform hover:opacity-90 active:scale-90"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 30 }}>stop</span>
            </button>
          </section>
        )}

        {(stage === 'uploading' || stage === 'analysis') && (
          <section className="flex flex-col items-center py-10 text-center">
            <div className="relative mb-8 flex h-48 w-48 items-center justify-center">
              <div className="absolute inset-0 animate-[concentric_2s_ease-out_infinite] rounded-full border-4 border-primary-dark/20" />
              <div className="absolute inset-0 animate-[concentric_2s_ease-out_infinite] rounded-full border-4 border-primary-dark/10" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-0 animate-[concentric_2s_ease-out_infinite] rounded-full border-4 border-primary-dark/5" style={{ animationDelay: '1s' }} />
              <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 56 }}>psychology</span>
            </div>
            <h3 className="mb-1 text-xl font-bold text-primary-dark">
              {stage === 'uploading' ? content.processing.uploading : content.processing.analyzing}
            </h3>
            <p className="mb-6 text-onSurface-variant">{content.processing.description}</p>
          </section>
        )}

        {stage === 'failed' && result && (
          <section className="flex flex-col items-center py-10 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-error-light text-error">
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>error</span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-primary-dark">{content.failed.heading}</h3>
            {/* `failureMessage` lives in `@/lib/languageAssessment` (out of scope for this
                i18n pass) and returns a hardcoded French sentence regardless of `language`. */}
            <p className="mb-6 max-w-md text-onSurface-variant">{failureMessage(result.failure_reason)}</p>
            <Button onClick={restart}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
              {content.failed.retryButton}
            </Button>
          </section>
        )}

        {stage === 'results' && result && result.predicted_cefr && (
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
                    <span className="text-5xl font-bold text-primary-dark">{result.predicted_cefr}</span>
                    <span className="text-xs text-onSurface-variant">
                      {content.results.levelLabel.replace('{level}', result.predicted_cefr)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-dark/5 px-3 py-1 text-primary-dark">
                    <span className="material-symbols-outlined fill" style={{ fontSize: 16 }}>verified</span>
                    <span className="text-xs font-bold uppercase tracking-wide">{content.results.aiEvaluated}</span>
                  </div>
                  <h2 className="mb-1 text-2xl font-bold text-primary-dark">{content.results.heading}</h2>
                  <p className="text-sm text-onSurface-variant">
                    {result.words_per_minute != null &&
                      `${content.results.wordsPerMinute.replace('{value}', String(Math.round(result.words_per_minute)))} · `}
                    {result.duration_seconds != null &&
                      content.results.duration.replace('{value}', String(Math.round(result.duration_seconds)))}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                {result.pronunciation_score != null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-primary-dark">{content.results.pronunciationLabel}</span>
                      <span className="font-bold text-primary-dark">{Math.round(result.pronunciation_score)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary-dark" style={{ width: `${result.pronunciation_score}%` }} />
                    </div>
                  </div>
                )}
                {result.filler_word_ratio != null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-primary-dark">{content.results.fillerWordsLabel}</span>
                      <span className="font-bold text-primary-dark">{Math.round(result.filler_word_ratio * 100)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary-dark" style={{ width: `${result.filler_word_ratio * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {result.transcript && (
                <div className="mt-6 rounded-xl bg-surface-container p-4 text-left">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-onSurface-variant">{content.results.transcriptLabel}</p>
                  <p className="text-sm text-onSurface">{result.transcript}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/profil"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-dark py-4 text-sm font-semibold text-on-primary shadow-sm transition-all hover:shadow-lg active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>leaderboard</span>
                {content.results.viewProfileButton}
              </Link>
              <Button variant="outline" onClick={restart} className="flex-1 py-4 text-primary-dark">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
                {content.results.retakeButton}
              </Button>
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
