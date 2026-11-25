'use client';

// Phase 2 — l'oral face caméra.
//
// La caméra s'allume, puis chaque situation apparaît après un délai aléatoire
// (le candidat ne choisit pas le moment). Préparation, puis l'enregistrement
// démarre tout seul et s'arrête à la limite. Une seule vidéo est envoyée :
// le serveur en extrait le son pour l'IA et conserve la même prise pour AMUD.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/shared/Button';
import { languageTestApi, type ExamEntry, type ExamState, type OralTask } from '@/lib/languageTest';
import { fill, type LanguageExamContent } from '@/lib/candidateLanguageExamContent';

type Stage = 'intro' | 'camera' | 'waiting' | 'prepare' | 'record' | 'upload' | 'sent' | 'failed' | 'expired';

const REVEAL_DELAY_MS: [number, number] = [5000, 20000];
const VIDEO_TYPES = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

function supported(types: string[]): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return types.find((t) => MediaRecorder.isTypeSupported(t));
}

export function OralRunner({
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
  const c = content.oral;
  const entries = state.items;
  const firstOpen = entries.findIndex((e) => !e.has_recording);
  const [index, setIndex] = useState(firstOpen === -1 ? entries.length : firstOpen);
  const [stage, setStage] = useState<Stage>('intro');
  const [task, setTask] = useState<OralTask | null>(null);
  const [left, setLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const video = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingUpload = useRef<Blob | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offset = useMemo(() => new Date(state.server_time).getTime() - Date.now(), [state.server_time]);

  const entry: ExamEntry | undefined = entries[index];
  const done = index >= entries.length;

  const stopClock = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(
    () => () => {
      stopClock();
      if (revealTimer.current) clearTimeout(revealTimer.current);
      if (recorder.current?.state === 'recording') { recorder.current.onstop = null; recorder.current.stop(); }
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && void languageTestApi.integrity(token, state.id, 'tab_hidden', 'oral');
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [token, state.id]);

  // Attach the live camera to the preview whenever the element is (re)mounted.
  useEffect(() => {
    if (video.current && stream.current && video.current.srcObject !== stream.current) {
      video.current.srcObject = stream.current;
      void video.current.play().catch(() => undefined);
    }
  });

  const countdown = (seconds: number, onEnd: () => void) => {
    stopClock();
    setLeft(seconds);
    const endAt = Date.now() + seconds * 1000;
    timer.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0) {
        stopClock();
        onEnd();
      }
    }, 250);
  };

  const upload = useCallback(
    async (videoBlob: Blob) => {
      if (!entry) return;
      pendingUpload.current = videoBlob;
      setStage('upload');
      try {
        await languageTestApi.oralRecording(token, state.id, entry.response_id, videoBlob);
        pendingUpload.current = null;
        setStage('sent');
      } catch {
        setStage('failed');
      }
    },
    [entry, token, state.id]
  );

  const stopRecording = useCallback(() => {
    stopClock();
    const r = recorder.current;
    if (!r || r.state === 'inactive') return;
    r.onstop = () => void upload(new Blob(chunks.current, { type: r.mimeType || 'video/webm' }));
    r.stop();
  }, [upload]);

  const startRecording = useCallback(
    (answerSeconds: number) => {
      if (!stream.current) return;
      stopClock();
      chunks.current = [];
      try {
        const videoType = supported(VIDEO_TYPES);
        const r = new MediaRecorder(stream.current, videoType ? { mimeType: videoType, videoBitsPerSecond: 800000 } : { videoBitsPerSecond: 800000 });
        r.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
        recorder.current = r;
        r.start(1000);
      } catch {
        setError(content.errors.generic);
        setStage('camera');
        return;
      }
      setStage('record');
      countdown(answerSeconds, stopRecording);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopRecording, content.errors.generic]
  );

  /** Start (or resume) a revealed task from the time already elapsed since the reveal. */
  const runTask = useCallback(
    (t: OralTask) => {
      setTask(t);
      const elapsed = t.revealed_at ? Math.max(0, (Date.now() + offset - new Date(t.revealed_at).getTime()) / 1000) : 0;
      const prepLeft = Math.round(t.prep_seconds - elapsed);
      const answerLeft = Math.round(t.prep_seconds + t.answer_seconds - elapsed);
      if (prepLeft > 0) {
        setStage('prepare');
        countdown(prepLeft, () => startRecording(t.answer_seconds));
      } else if (answerLeft > 5) {
        startRecording(answerLeft);
      } else {
        setStage('expired');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offset, startRecording]
  );

  const waitAndReveal = useCallback(() => {
    if (!entry) return;
    // Resuming after a reload: the situation was already shown.
    if (entry.oral?.revealed_at) {
      runTask(entry.oral);
      return;
    }
    setStage('waiting');
    const [min, max] = REVEAL_DELAY_MS;
    const delay = min + Math.random() * (max - min);
    revealTimer.current = setTimeout(async () => {
      try {
        runTask(await languageTestApi.reveal(token, state.id, entry.response_id));
      } catch {
        setError(content.errors.generic);
        setStage('camera');
      }
    }, delay);
  }, [entry, runTask, token, state.id, content.errors.generic]);

  const openCamera = async () => {
    setError(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      setStage('camera');
    } catch {
      setError(c.cameraDenied);
    }
  };

  // Once the camera is live, the first open situation is on its way.
  useEffect(() => {
    if (stage === 'camera' && !done && !error) waitAndReveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, index, error, done, waitAndReveal]);

  const next = () => {
    setTask(null);
    setIndex((i) => i + 1);
    setStage('camera');
  };

  const finish = async () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    try {
      onState(await languageTestApi.completeSection(token, state.id, 'oral'));
    } catch {
      onState(await languageTestApi.get(token, state.id));
    }
  };

  const clock = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  const prep = entries[0]?.oral?.prep_seconds ?? 30;

  if (stage === 'intro') {
    return (
      <section className="grid gap-5">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
          <h2 className="text-xl font-bold text-primary-dark">{c.introHeading}</h2>
          <p className="mt-2 text-onSurface">
            {fill(c.introBody, { n: entries.length, level: state.oral_level ?? state.exam_level, prep })}
          </p>
          <ul className="mt-3 grid gap-1.5 text-sm text-onSurface">
            {c.checklist.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 18 }}>
                  check_circle
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
        {error && <p className="text-sm font-medium text-error">{error}</p>}
        {done ? (
          <Button size="lg" pill onClick={() => void finish()}>
            {c.finish}
          </Button>
        ) : (
          <Button size="lg" pill onClick={() => void openCamera()}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              videocam
            </span>
            {c.start}
          </Button>
        )}
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video ref={video} muted playsInline className="aspect-[4/3] w-full -scale-x-100 object-cover" />
        {stage === 'record' && (
          <span className="absolute start-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" />
            REC {clock}
          </span>
        )}
        {!done && (
          <span className="absolute end-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
            {fill(c.taskOf, { n: Math.min(index + 1, entries.length), total: entries.length })}
          </span>
        )}
      </div>

      {stage === 'waiting' && (
        <p className="flex items-center gap-2 rounded-xl bg-surface-container p-4 text-sm text-onSurface">
          <span className="material-symbols-outlined animate-pulse text-primary-dark" style={{ fontSize: 20 }}>
            hourglass_top
          </span>
          {c.waiting}
        </p>
      )}

      {task?.content && ['prepare', 'record'].includes(stage) && (
        <div className="grid gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
          <div className="flex items-center justify-between gap-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${stage === 'record' ? 'text-error' : 'text-primary-dark'}`}>
              {stage === 'record' ? c.speakNow : c.prepare}
            </span>
            <span className="text-2xl font-bold tabular-nums text-primary-dark" aria-live="polite">
              {clock}
            </span>
          </div>
          <div dir="ltr" lang="de" className="text-[15px] leading-7 text-onSurface">
            <p>{task.content.situation}</p>
            {task.content.instructions && <p className="mt-1 font-semibold">{task.content.instructions}</p>}
            {task.content.points.length > 0 && (
              <ul className="mt-1 list-disc ps-5">
                {task.content.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </div>
          {stage === 'prepare' && (
            <Button pill variant="outline" onClick={() => startRecording(task.answer_seconds)}>
              {c.startNow}
            </Button>
          )}
          {stage === 'record' && (
            <Button pill variant="destructive" onClick={stopRecording}>
              {c.stop}
            </Button>
          )}
        </div>
      )}

      {stage === 'upload' && <p className="text-sm text-onSurface-variant">{c.uploading}</p>}

      {stage === 'failed' && (
        <div className="grid gap-2">
          <p className="text-sm text-error">{c.uploadFailed}</p>
          <Button
            pill
            onClick={() => pendingUpload.current && void upload(pendingUpload.current)}
          >
            {c.retry}
          </Button>
        </div>
      )}

      {(stage === 'sent' || stage === 'expired') && (
        <div className="grid gap-3">
          <p className={`text-sm font-semibold ${stage === 'sent' ? 'text-primary-dark' : 'text-error'}`}>
            {stage === 'sent' ? c.sent : c.expired}
          </p>
          {index + 1 < entries.length ? (
            <Button pill onClick={next}>
              {c.next}
            </Button>
          ) : (
            <Button pill onClick={() => void finish()}>
              {c.finish}
            </Button>
          )}
        </div>
      )}

      {done && stage === 'camera' && (
        <Button pill onClick={() => void finish()}>
          {c.finish}
        </Button>
      )}

      {error && <div className="grid gap-2"><p className="text-sm font-medium text-error">{error}</p><Button onClick={() => setError(null)}>{c.retry}</Button></div>}
    </section>
  );
}
