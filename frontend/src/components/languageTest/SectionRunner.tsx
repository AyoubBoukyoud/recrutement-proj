'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/shared/Button';
import { languageTestApi, type ExamAnswer, type ExamSection, type ExamState } from '@/lib/languageTest';
import { fill, type LanguageExamContent } from '@/lib/candidateLanguageExamContent';
import { FormTask, QuestionsTask, ReadAloudTask, WritingTask } from './ExamTasks';
import { ExamAnswerSaver } from '@/lib/examAnswerSaver';

const AUTOSAVE_MS = 800;

/**
 * Une section ouverte : chronomètre (aligné sur l'horloge du serveur), tâches,
 * sauvegarde automatique de chaque réponse, et fermeture — par le candidat,
 * ou d'office à l'échéance. Le serveur reste l'arbitre : passé la limite il
 * refuse les réponses et ferme la section lui-même.
 */
export function SectionRunner({
  state,
  token,
  content,
  onState,
}: {
  state: ExamState;
  token: string;
  content: LanguageExamContent;
  onState: (next: ExamState) => void;
}) {
  const section = state.current_section as ExamSection;
  const copy = content.runner;
  const sectionState = state.sections[section];

  const [answers, setAnswers] = useState<Record<number, ExamAnswer>>(() =>
    Object.fromEntries(state.items.map((e) => [e.response_id, e.answer ?? {}]))
  );
  const [saving, setSaving] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const openedAt = useRef(Date.now());
  const finishing = useRef(false);
  const autoFinished = useRef(false);
  const saver = useMemo(
    () => new ExamAnswerSaver((id, answer) => languageTestApi.answer(token, state.id, id, answer, Date.now() - openedAt.current)),
    [token, state.id]
  );

  useEffect(() => () => Object.values(pending.current).forEach(clearTimeout), []);

  // Server clock offset, so a wrong device clock cannot extend the section.
  const offset = useMemo(() => new Date(state.server_time).getTime() - Date.now(), [state.server_time]);
  const deadline = sectionState?.deadline_at ? new Date(sectionState.deadline_at).getTime() : null;
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(id);
  }, [offset]);
  const remaining = deadline ? Math.max(0, Math.round((deadline - now) / 1000)) : null;

  const save = useCallback(
    (responseId: number, answer: ExamAnswer) => {
      saver.set(responseId, answer);
      clearTimeout(pending.current[responseId]);
      pending.current[responseId] = setTimeout(() => {
        setSaving((n) => n + 1);
        saver.save(responseId)
          .then(() => { if (!saver.hasUnsaved) setError(null); })
          .catch(() => setError(copy.saveFailed))
          .finally(() => setSaving((n) => n - 1));
        delete pending.current[responseId];
      }, AUTOSAVE_MS);
    },
    [saver, copy.saveFailed]
  );

  const change = (responseId: number, answer: ExamAnswer) => {
    setAnswers((prev) => ({ ...prev, [responseId]: answer }));
    save(responseId, answer);
  };

  const flush = async () => {
    const ids = Object.keys(pending.current).map(Number);
    ids.forEach((id) => clearTimeout(pending.current[id]));
    pending.current = {};
    // Includes requests that already left the debounce timer and are still pending.
    await saver.flush();
  };

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    setClosing(true);
    try {
      await flush();
      onState(await languageTestApi.completeSection(token, state.id, section));
    } catch {
      setError(copy.saveFailed);
      try {
        const current = await languageTestApi.get(token, state.id);
        if (current.sections[section]?.status === 'done') onState(current);
      } catch {
        // Keep the edits and the error visible until the connection recovers.
      }
    } finally {
      finishing.current = false;
      setClosing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saver, token, state.id, section, onState, copy.saveFailed]);

  // The clock ran out: close with what was saved (the server would anyway).
  useEffect(() => {
    if (remaining === 0 && !autoFinished.current) {
      autoFinished.current = true;
      void finish();
    }
  }, [remaining, finish]);

  // Leaving the tab during a timed section is reported to the reviewer.
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && void languageTestApi.integrity(token, state.id, 'tab_hidden', section);
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [token, state.id, section]);

  const reportPaste = () => void languageTestApi.integrity(token, state.id, 'paste', section);
  const clock = remaining === null ? '--:--' : `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  return (
    <section className="grid gap-5">
      <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-3 border-b border-outline-variant bg-surface/95 px-6 py-3 backdrop-blur lg:-mx-10 lg:px-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{content.sections[section]}</p>
          <p className="text-xs text-onSurface-variant">{error ? copy.saveFailed : saving > 0 || saver.hasUnsaved ? copy.saving : copy.saved}</p>
        </div>
        <div className={`text-end ${remaining !== null && remaining < 60 ? 'text-error' : 'text-primary-dark'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider">{copy.timeLeft}</p>
          <p className="text-2xl font-bold tabular-nums" aria-live="polite">
            {clock}
          </p>
        </div>
      </div>

      <fieldset disabled={closing} className="grid min-w-0 gap-5">
      {state.items.map((entry, index) => (
        <article key={entry.response_id} className="grid gap-3">
          <h3 className="text-sm font-bold text-primary-dark">
            {fill(copy.task, { n: index + 1 })}
            {entry.item.title ? <span className="font-normal text-onSurface-variant"> — {entry.item.title}</span> : null}
          </h3>
          {section === 'read_aloud' ? (
            <ReadAloudTask entry={entry} copy={copy} token={token} testId={state.id} />
          ) : entry.item.task_type === 'form_fill' ? (
            <FormTask entry={entry} answer={answers[entry.response_id] ?? {}} onChange={(a) => change(entry.response_id, a)} copy={copy} onPaste={reportPaste} />
          ) : section === 'writing' ? (
            <WritingTask entry={entry} answer={answers[entry.response_id] ?? {}} onChange={(a) => change(entry.response_id, a)} copy={copy} onPaste={reportPaste} />
          ) : (
            <QuestionsTask
              entry={entry}
              answer={answers[entry.response_id] ?? {}}
              onChange={(a) => change(entry.response_id, a)}
              copy={copy}
              token={token}
              testId={state.id}
            />
          )}
        </article>
      ))}
      </fieldset>

      {error && <p role="alert" className="text-sm text-error">{error}</p>}

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        {confirming ? (
          <div className="grid gap-3">
            <p className="text-sm text-onSurface">{copy.finishConfirm}</p>
            <div className="flex flex-wrap gap-2">
              <Button pill disabled={closing} onClick={() => void finish()}>
                {copy.confirm}
              </Button>
              <Button variant="outline" pill disabled={closing} onClick={() => setConfirming(false)}>
                {copy.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <Button pill className="w-full sm:w-auto" onClick={() => setConfirming(true)}>
            {copy.finish}
          </Button>
        )}
      </div>
    </section>
  );
}
