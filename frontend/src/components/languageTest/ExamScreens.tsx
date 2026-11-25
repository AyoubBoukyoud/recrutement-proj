'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/shared/Button';
import { CEFR_LEVELS, type CefrLevel } from '@/lib/languageTestBank';
import { PHASE_ONE_SECTIONS, type ExamOverview, type ExamSection, type ExamState } from '@/lib/languageTest';
import { fill, type LanguageExamContent } from '@/lib/candidateLanguageExamContent';

const CARD = 'rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]';

/** Avant l'examen : quel niveau, pourquoi, comment ça se déroule, consentement. */
export function ExamIntro({
  overview,
  content,
  busy,
  error,
  onStart,
  locale,
}: {
  overview: ExamOverview;
  content: LanguageExamContent;
  busy: boolean;
  error: string | null;
  onStart: (level: CefrLevel | null) => void;
  locale: string;
}) {
  const c = content.intro;
  const [chosen, setChosen] = useState<CefrLevel | null>(overview.available_levels[0] ?? null);
  const [consent, setConsent] = useState(false);
  const level = overview.exam_level ?? chosen;
  const outline = level ? overview.exams[level] : null;

  const blocked = overview.cooldown_until
    ? fill(c.cooldown, { date: new Date(overview.cooldown_until).toLocaleDateString(locale) })
    : overview.exam_level && !overview.exam_available
      ? c.unavailable
      : !overview.exam_level && overview.available_levels.length === 0
        ? c.noLevels
        : null;

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-2xl font-bold text-primary-dark">{c.heading}</h2>
        <p className="mt-1 text-onSurface-variant">{c.lead}</p>
      </div>

      <div className={CARD}>
        {overview.exam_level ? (
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-dark text-2xl font-bold text-onPrimary">
              {overview.exam_level}
            </span>
            <p className="text-onSurface">
              {fill(overview.level_source === 'certificate' ? c.levelFromCertificate : c.levelFromDeclared, { level: overview.exam_level })}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="font-semibold text-onSurface">{c.chooseLevel}</p>
            <p className="text-sm text-onSurface-variant">{c.chooseLevelHint}</p>
            <div className="flex flex-wrap gap-2">
              {CEFR_LEVELS.map((l) => {
                const available = overview.available_levels.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    disabled={!available}
                    onClick={() => setChosen(l)}
                    className={`h-12 w-14 rounded-xl border text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      chosen === l ? 'border-primary bg-primary text-onPrimary' : 'border-outline-variant text-primary-dark hover:border-primary'
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {outline && (
        <div className={CARD}>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-onSurface-variant">{c.sectionsHeading}</p>
          <ol className="grid gap-2">
            {PHASE_ONE_SECTIONS.map((s, i) => (
              <li key={s} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-onSurface">
                  {i + 1}. {content.sections[s]}
                </span>
                <span className="text-onSurface-variant">
                  {outline[s]?.minutes ? fill(c.minutes, { n: outline[s].minutes ?? 0 }) : ''} · {fill(c.tasks, { n: outline[s]?.tasks ?? 0 })}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-outline-variant pt-3 text-sm text-onSurface-variant">{c.phaseTwoNote}</p>
        </div>
      )}

      {blocked ? (
        <p className="rounded-xl bg-attention-light p-4 text-sm text-on-attention-container">{blocked}</p>
      ) : (
        <>
          <p className="text-sm text-onSurface-variant">{c.rules}</p>
          <label className="flex items-start gap-3 text-sm text-onSurface">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-primary" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{c.consent}</span>
          </label>
          {error && <p className="text-sm font-medium text-error">{error}</p>}
          <Button size="lg" pill disabled={!consent || !level || busy} onClick={() => onStart(overview.exam_level ? null : chosen)}>
            {c.start}
          </Button>
        </>
      )}
    </section>
  );
}

/** Entre deux sections : ce qui vient, combien de temps, et le bouton qui lance le chrono. */
export function SectionIntro({
  state,
  content,
  busy,
  onStart,
}: {
  state: ExamState;
  content: LanguageExamContent;
  busy: boolean;
  onStart: () => void;
}) {
  const section = state.current_section as ExamSection;
  const index = PHASE_ONE_SECTIONS.indexOf(section);
  const minutes = state.sections[section]?.minutes;
  const c = content.sectionIntro;
  const done = PHASE_ONE_SECTIONS.filter((s) => state.sections[s]?.status === 'done');

  return (
    <section className="grid gap-5">
      <ExamProgress state={state} content={content} />
      <div className={CARD}>
        <p className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">
          {state.exam_level} · {done.length}/4
        </p>
        <h2 className="mt-1 text-xl font-bold text-primary-dark">{fill(c.heading, { n: index + 1, name: content.sections[section] })}</h2>
        <p className="mt-2 text-onSurface">{c[section as 'reading' | 'listening' | 'read_aloud' | 'writing']}</p>
        {minutes && <p className="mt-3 text-sm font-semibold text-primary-dark">{fill(c.duration, { n: minutes })}</p>}
      </div>
      <Button size="lg" pill disabled={busy} onClick={onStart}>
        {c.start}
      </Button>
    </section>
  );
}

export function ExamProgress({ state, content }: { state: ExamState; content: LanguageExamContent }) {
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="progress">
      {PHASE_ONE_SECTIONS.map((s) => {
        const status = state.sections[s]?.status;
        const current = state.current_section === s;
        return (
          <li key={s} className="grid gap-1">
            <span
              className={`h-1.5 rounded-full ${status === 'done' ? 'bg-primary' : current ? 'bg-primary/40' : 'bg-surface-container-high'}`}
            />
            <span className={`truncate text-[11px] ${current ? 'font-bold text-primary-dark' : 'text-onSurface-variant'}`}>
              {content.sections[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ScoringScreen({ content }: { content: LanguageExamContent }) {
  return (
    <section className="flex flex-col items-center py-12 text-center">
      <span className="material-symbols-outlined mb-4 animate-pulse text-primary-dark" style={{ fontSize: 56 }}>
        psychology
      </span>
      <h2 className="text-xl font-bold text-primary-dark">{content.scoring.heading}</h2>
      <p className="mt-2 max-w-md text-onSurface-variant">{content.scoring.body}</p>
    </section>
  );
}

/**
 * Résultats : niveau provisoire après la phase 1 (avec l'accès à l'oral),
 * puis résultat final publié automatiquement.
 */
export function PhaseOneResult({
  state,
  content,
  onStartOral,
  onRestart,
  busy = false,
}: {
  state: ExamState;
  content: LanguageExamContent;
  onStartOral?: () => void;
  onRestart?: () => void;
  busy?: boolean;
}) {
  const r = content.result;
  const p = state.provisional;
  if (state.status === 'failed' || state.status === 'abandoned') {
    const failed = state.status === 'failed';
    return <section className="grid gap-4"><div className={CARD}><h2 className="text-xl font-bold text-primary-dark">{failed ? r.failedHeading : r.annulledHeading}</h2><p className="mt-2 text-onSurface">{failed ? r.failedBody : r.annulledBody}</p></div>{failed && onRestart && <Button onClick={onRestart}>{content.intro.start}</Button>}<Link href="/dashboard" className="text-center text-primary-dark">{r.back}</Link></section>;
  }
  if (!p) return null;

  // B2 and above: an administrator approves the result before it is shown.
  if (state.status === 'awaiting_review') {
    return (
      <section className="grid gap-4">
        <div className={`${CARD} flex items-start gap-4`}>
          <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 32 }}>
            hourglass_top
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{r.awaitingHeading}</p>
            <h2 className="mt-1 text-xl font-bold text-primary-dark">{r.reviewHeadline}</h2>
            <p className="mt-1 text-sm text-onSurface-variant">{r.awaitingReview}</p>
          </div>
        </div>
        <Link href="/dashboard" className="text-center text-primary-dark">{r.back}</Link>
      </section>
    );
  }

  const finished = state.status === 'validated';
  const level = state.status === 'validated' ? state.final_cefr : finished ? state.ai_cefr : p.cefr;
  const results = (state.status === 'validated' && state.final_skill_results ? state.final_skill_results : p.skill_results) ?? {};
  const scores = p.skill_scores ?? {};

  const notDemonstrated = finished && !level;
  const headline = notDemonstrated
    ? fill(r.notDemonstrated, { level: state.exam_level })
    : !finished
      ? r.phaseOneComplete
      : fill(r.validated, { level: level ?? state.exam_level });

  const skills = ['reading', 'listening', 'writing', 'speaking'] as const;

  return (
    <section className="grid gap-5">
      <div className={`${CARD} flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start`}>
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-dark text-4xl font-bold text-onPrimary">
          {level ?? '—'}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">
            {notDemonstrated ? r.notDemonstratedHeading : state.status === 'validated' ? r.validatedHeading : finished ? r.awaitingHeading : r.heading}
          </p>
          <h2 className="mt-1 text-xl font-bold text-primary-dark">{headline}</h2>
          <p className="mt-1 text-sm text-onSurface-variant">{notDemonstrated ? r.notDemonstratedNote : state.status === 'validated' ? r.finalNote : r.provisionalNote}</p>
        </div>
      </div>

      <div className={`${CARD} grid gap-4`}>
        {skills.map((s) => {
          const score = scores[s];
          if (score === null || score === undefined) return null;
          return (
            <div key={s} className="grid gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-onSurface">{s === 'speaking' && finished ? r.speakingLabel : r.skills[s]}</span>
                <span className="font-bold text-primary-dark">
                  {results[s] ?? r.notDemonstratedSkill} · {score}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                <div className="h-full rounded-full bg-primary-dark" style={{ width: `${score}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {scores.read_aloud != null && <p className="text-sm text-onSurface-variant">{fill(r.readAloudDiagnostic, { score: scores.read_aloud })}</p>}

      {p.summary && (p.summary.strengths.length > 0 || p.summary.weaknesses.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {p.summary.strengths.length > 0 && (
            <div className={CARD}>
              <p className="mb-2 text-sm font-bold text-primary-dark">{r.strengths}</p>
              <ul className="list-disc ps-5 text-sm text-onSurface">
                {p.summary.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {p.summary.weaknesses.length > 0 && (
            <div className={CARD}>
              <p className="mb-2 text-sm font-bold text-primary-dark">{r.weaknesses}</p>
              <ul className="list-disc ps-5 text-sm text-onSurface">
                {p.summary.weaknesses.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {state.status === 'in_progress' && state.current_section === 'oral' && (
        <div className={`${CARD} grid gap-3`}>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 28 }}>
              videocam
            </span>
            <div>
              <p className="font-bold text-primary-dark">{r.phaseTwoHeading}</p>
              <p className="text-sm text-onSurface-variant">{content.oral.checklist.join(' · ')}</p>
            </div>
          </div>
          {onStartOral && (
            <Button size="lg" pill disabled={busy} onClick={onStartOral}>
              {content.oral.cta}
            </Button>
          )}
        </div>
      )}

      <Link
        href="/dashboard"
        className="flex items-center justify-center rounded-pillar border border-outline py-3.5 text-sm font-bold text-primary hover:border-primary"
      >
        {r.back}
      </Link>
    </section>
  );
}
