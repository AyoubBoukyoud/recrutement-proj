'use client';

// Une seule interface par type de tâche, quel que soit le niveau : le
// gabarit du niveau ne change que le contenu (longueur, nombre de questions).
// Le contenu de l'examen est toujours en allemand, donc toujours en LTR, même
// quand l'interface est en arabe.

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/shared/Button';
import { ApiError } from '@/lib/api';
import { countWords, languageTestApi, type ExamAnswer, type ExamEntry } from '@/lib/languageTest';
import { fill, type LanguageExamContent } from '@/lib/candidateLanguageExamContent';

type Copy = LanguageExamContent['runner'];

interface TaskProps {
  entry: ExamEntry;
  answer: ExamAnswer;
  onChange: (answer: ExamAnswer) => void;
  copy: Copy;
}

const PANEL = 'rounded-xl border border-outline-variant bg-surface-container-lowest p-4';

function Stimulus({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div dir="ltr" lang="de" className="whitespace-pre-line rounded-xl bg-surface-container p-4 text-[15px] leading-7 text-onSurface">
      {text}
    </div>
  );
}

/** Vrai/faux, QCM, association et texte à trous : des questions à choix, avec ou sans liste commune. */
export function QuestionsTask({ entry, answer, onChange, copy, token, testId }: TaskProps & { token: string; testId: number }) {
  const { content } = entry.item;
  const shared = content.options && content.options.length > 0 ? content.options : null;
  const chosen = answer.answers ?? {};
  const set = (qid: string, value: string) => onChange({ answers: { ...chosen, [qid]: value } });

  return (
    <div className="grid gap-4">
      {entry.item.skill === 'listening' ? (
        <ListeningPlayer entry={entry} copy={copy} token={token} testId={testId} />
      ) : (
        <Stimulus text={content.stimulus} />
      )}

      {shared && (
        <div className={PANEL} dir="ltr" lang="de">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-onSurface-variant">{copy.sharedOptions}</p>
          <ul className="grid gap-1.5 text-sm">
            {shared.map((o) => (
              <li key={o.id}>
                <strong>{o.id})</strong> {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className="grid gap-3" dir="ltr" lang="de">
        {(content.questions ?? []).map((q, index) => (
          <li key={q.id} className={PANEL}>
            <p className="mb-2 font-semibold text-onSurface">
              {index + 1}. {q.prompt}
            </p>
            {shared ? (
              <select
                aria-label={q.prompt}
                className="h-12 w-full rounded-lg border border-outline bg-surface-container-lowest px-3 text-sm"
                value={chosen[q.id] ?? ''}
                onChange={(e) => set(q.id, e.target.value)}
              >
                <option value="">{copy.chooseOption}</option>
                {shared.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id}) {o.label.length > 60 ? `${o.label.slice(0, 60)}…` : o.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className={entry.item.task_type === 'true_false' ? 'flex flex-wrap gap-2' : 'grid gap-2'}>
                {(q.options ?? []).map((o) => {
                  const selected = chosen[q.id] === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        selected ? 'border-primary bg-primary/5 font-semibold text-primary-dark' : 'border-outline-variant hover:border-outline'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${entry.response_id}-${q.id}`}
                        className="accent-primary"
                        checked={selected}
                        onChange={() => set(q.id, o.id)}
                      />
                      {entry.item.task_type !== 'true_false' && <span className="text-onSurface-variant">{o.id})</span>}
                      <span>{o.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Le clip est obtenu du serveur à chaque écoute, qui décompte les écoutes autorisées. */
function ListeningPlayer({ entry, copy, token, testId }: { entry: ExamEntry; copy: Copy; token: string; testId: number }) {
  const [left, setLeft] = useState(entry.plays_left ?? 0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audio.current?.pause(), []);

  const play = async () => {
    setError(null);
    try {
      const res = await languageTestApi.play(token, testId, entry.response_id);
      setLeft(res.plays_left);
      const el = new Audio(res.url);
      audio.current = el;
      el.onended = () => setPlaying(false);
      el.onerror = () => setPlaying(false);
      setPlaying(true);
      await el.play();
    } catch (e) {
      setPlaying(false);
      if (e instanceof ApiError && e.payload.reason === 'no_plays_left') setLeft(0);
      else setError(copy.uploadFailed);
    }
  };

  return (
    <div className={`${PANEL} flex flex-wrap items-center justify-between gap-3`}>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 28 }}>
          headphones
        </span>
        <span className="text-sm text-onSurface-variant">
          {playing ? copy.playing : left > 0 ? fill(copy.playsLeft, { n: left }) : copy.noPlays}
        </span>
      </div>
      <Button size="sm" pill disabled={playing || left <= 0} onClick={() => void play()}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          play_arrow
        </span>
        {copy.play}
      </Button>
      {error && <p className="w-full text-sm text-error">{error}</p>}
    </div>
  );
}

/** Formulaire A1 : remplir des champs à partir d'un court texte. */
export function FormTask({ entry, answer, onChange, onPaste }: TaskProps & { onPaste: () => void }) {
  const fields = answer.fields ?? {};
  return (
    <div className="grid gap-4">
      <Stimulus text={entry.item.content.stimulus} />
      <div className={`${PANEL} grid gap-3`} dir="ltr" lang="de">
        {(entry.item.content.fields ?? []).map((f) => (
          <label key={f.id} className="grid gap-1 text-sm">
            <span className="font-semibold text-onSurface">{f.label}</span>
            <input
              className="h-11 rounded-lg border border-outline bg-surface-container-lowest px-3"
              value={fields[f.id] ?? ''}
              autoComplete="off"
              spellCheck={false}
              onPaste={(e) => {
                e.preventDefault();
                onPaste();
              }}
              onChange={(e) => onChange({ fields: { ...fields, [f.id]: e.target.value } })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/** Tâche d'écriture : situation, consignes, points à traiter, texte libre sans collage. */
export function WritingTask({ entry, answer, onChange, copy, onPaste }: TaskProps & { onPaste: () => void }) {
  const { content } = entry.item;
  const text = answer.text ?? '';
  const words = countWords(text);
  const [pasteWarning, setPasteWarning] = useState(false);
  const inRange = (!content.min_words || words >= content.min_words) && (!content.max_words || words <= content.max_words * 1.2);

  return (
    <div className="grid gap-3">
      <div className="rounded-xl bg-surface-container p-4 text-[15px] leading-7" dir="ltr" lang="de">
        <p>{content.situation}</p>
        {content.instructions && <p className="mt-2 font-semibold">{content.instructions}</p>}
        {content.points && (
          <ul className="mt-2 list-disc ps-5">
            {content.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </div>
      <textarea
        dir="ltr"
        lang="de"
        rows={10}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="sentences"
        className="w-full resize-y rounded-xl border border-outline bg-surface-container-lowest p-3 text-[15px] leading-7 focus:border-primary focus:outline-none"
        value={text}
        onChange={(e) => onChange({ text: e.target.value })}
        onPaste={(e) => {
          e.preventDefault();
          setPasteWarning(true);
          onPaste();
        }}
        onDrop={(e) => e.preventDefault()}
      />
      <div className="flex flex-wrap justify-between gap-2 text-xs">
        <span className={inRange ? 'text-onSurface-variant' : 'font-semibold text-error'}>
          {fill(copy.words, { n: words, min: content.min_words ?? '?', max: content.max_words ?? '?' })}
        </span>
        {pasteWarning && <span className="text-error">{copy.pasteBlocked}</span>}
      </div>
    </div>
  );
}

/** Lecture à voix haute : une seule prise, envoyée dès l'arrêt. */
export function ReadAloudTask({ entry, copy, token, testId }: { entry: ExamEntry; copy: Copy; token: string; testId: number }) {
  const text = entry.item.content.text ?? '';
  const maxSeconds = Math.max(30, Math.round(countWords(text) * 1.2) + 20);
  const [stage, setStage] = useState<'idle' | 'recording' | 'uploading' | 'done'>(entry.has_recording ? 'done' : 'idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  const upload = async (blob: Blob) => {
    setStage('uploading');
    try {
      await languageTestApi.recording(token, testId, entry.response_id, blob);
      setStage('done');
    } catch {
      setError(copy.uploadFailed);
      setStage('idle');
    }
  };

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    recorder.current?.stop();
  };

  const start = async () => {
    setError(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(copy.micDenied);
      return;
    }
    const rec = new MediaRecorder(stream.current);
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
    rec.onstop = () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      void upload(new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' }));
    };
    recorder.current = rec;
    rec.start();
    setSeconds(0);
    setStage('recording');
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= maxSeconds) stop();
        return s + 1;
      });
    }, 1000);
  };

  return (
    <div className="grid gap-4">
      <div dir="ltr" lang="de" className="rounded-xl bg-surface-container p-5 text-lg leading-8 text-onSurface">
        {text}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {stage === 'idle' && (
          <Button pill onClick={() => void start()}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              mic
            </span>
            {copy.recordStart}
          </Button>
        )}
        {stage === 'recording' && (
          <>
            <span className="flex items-center gap-2 text-sm font-bold text-error">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" />
              {copy.recording} {seconds}s / {maxSeconds}s
            </span>
            <Button variant="destructive" pill onClick={stop}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                stop
              </span>
              {copy.recordStop}
            </Button>
          </>
        )}
        {stage === 'uploading' && <span className="text-sm text-onSurface-variant">{copy.saving}</span>}
        {stage === 'done' && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-primary-dark">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              check_circle
            </span>
            {copy.recorded}
          </span>
        )}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
