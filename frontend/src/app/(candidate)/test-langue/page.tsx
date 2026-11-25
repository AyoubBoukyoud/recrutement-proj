'use client';

// Examen d'allemand AMUD — un examen par niveau (celui du certificat, sinon
// celui déclaré, sinon celui choisi). Phase 1 : lecture, écoute, lecture à
// voix haute, écriture → retour par compétence. Phase 2 : oral face caméra au
// niveau de l’examen. Le niveau final est publié automatiquement, avec des corrections administratives possibles.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ApiError } from '@/lib/api';
import { USE_MOCKS } from '@/data/config';
import { languageTestApi, type ExamOverview, type ExamState } from '@/lib/languageTest';
import type { CefrLevel } from '@/lib/languageTestBank';
import { languageExamContentFor } from '@/lib/candidateLanguageExamContent';
import { SectionRunner } from '@/components/languageTest/SectionRunner';
import { OralRunner } from '@/components/languageTest/OralRunner';
import { ExamIntro, PhaseOneResult, ScoringScreen, SectionIntro } from '@/components/languageTest/ExamScreens';

const POLL_MS = 4000;
const LOCALES = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', ar: 'ar-MA' } as const;

export default function LanguageExamPage() {
  const { language } = useLanguage();
  const content = languageExamContentFor(language);
  const { token } = useAuth();

  const [overview, setOverview] = useState<ExamOverview | null>(null);
  const [state, setState] = useState<ExamState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const message = useCallback(
    (e: unknown) => (e instanceof ApiError ? (e.isNetworkFailure ? content.errors.network : e.message || content.errors.generic) : content.errors.generic),
    [content]
  );

  useEffect(() => {
    if (!token || USE_MOCKS) return;
    let cancelled = false;
    (async () => {
      try {
        const ov = await languageTestApi.overview(token);
        if (cancelled) return;
        setOverview(ov);
        const id = ov.active_test_id ?? ov.latest_test_id;
        if (id) {
          const s = await languageTestApi.get(token, id);
          // A finished, older sitting is shown only while its cooldown runs.
          if (!cancelled && (ov.active_test_id || ov.cooldown_until || s.status === 'failed' || s.status === 'abandoned')) setState(s);
        }
      } catch (e) {
        if (!cancelled) setError(message(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, message]);

  // Phase 1 is being marked: poll until the provisional level lands.
  useEffect(() => {
    if (!token || state?.status !== 'scoring') return;
    const id = setInterval(() => {
      languageTestApi.get(token, state.id).then(setState).catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [token, state?.status, state?.id]);

  const run = async (action: () => Promise<ExamState>) => {
    setBusy(true);
    setError(null);
    try {
      setState(await action());
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  const start = (level: CefrLevel | null) => token && void run(() => languageTestApi.start(token, 'de', level));
  const openSection = () =>
    token && state?.current_section && void run(() => languageTestApi.startSection(token, state.id, state.current_section!));

  const section = state?.current_section;
  const sectionStatus = section ? state?.sections[section]?.status : undefined;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-2.5 lg:px-4">
        <Link href="/dashboard" className="text-primary-dark transition-opacity hover:opacity-80" aria-label={content.result.back}>
          <span className="material-symbols-outlined rtl:rotate-180" style={{ fontSize: 24 }}>
            arrow_back
          </span>
        </Link>
        <h1 className="text-lg font-bold text-primary-dark">{content.header.title}</h1>
        <span className="w-6" />
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-8 pt-2 lg:max-w-3xl lg:px-10">
        {USE_MOCKS && <p className="rounded-xl bg-attention-light p-4 text-sm text-on-attention-container">{content.intro.unavailable}</p>}

        {!USE_MOCKS && !overview && !error && <div className="h-40 animate-pulse rounded-2xl bg-surface-container" />}
        {!state && error && <p className="text-sm font-medium text-error">{error}</p>}

        {overview && !state && (
          <ExamIntro overview={overview} content={content} busy={busy} error={error} onStart={start} locale={LOCALES[language]} />
        )}

        {state && token && state.status === 'in_progress' && section !== 'oral' && sectionStatus === 'pending' && (
          <SectionIntro state={state} content={content} busy={busy} onStart={openSection} />
        )}

        {state && token && state.status === 'in_progress' && sectionStatus === 'active' && section !== 'oral' && (
          <SectionRunner key={`${state.id}-${section}`} state={state} token={token} content={content} onState={setState} />
        )}

        {state && token && state.status === 'in_progress' && section === 'oral' && sectionStatus === 'active' && (
          <OralRunner key={`${state.id}-oral`} state={state} token={token} content={content} onState={setState} />
        )}

        {state?.status === 'scoring' && <ScoringScreen content={content} />}

        {state && (state.provisional || state.status === 'failed' || state.status === 'abandoned') && state.status !== 'scoring' && !(section === 'oral' && sectionStatus === 'active') && (
          <PhaseOneResult state={state} content={content} busy={busy} onStartOral={openSection} onRestart={() => setState(null)} />
        )}

        {state && error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}
      </main>
    </div>
  );
}
