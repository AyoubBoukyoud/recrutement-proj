'use client';

import { useEffect, useRef, useState } from 'react';

interface AudioRecorderProps {
  onRecordingComplete?: (blobUrl: string) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("L'enregistrement audio n'est pas disponible sur cet appareil.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete?.(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Impossible d'accéder au microphone. Vérifiez les autorisations.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`flex h-20 w-20 items-center justify-center rounded-full shadow-floating transition ${
          isRecording ? 'animate-pulse bg-error' : 'bg-primary-container hover:opacity-90'
        }`}
        aria-label={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
      >
        <span
          className={`material-symbols-outlined fill ${isRecording ? 'text-onError' : 'text-on-primary'}`}
          style={{ fontSize: 30 }}
        >
          {isRecording ? 'stop' : 'mic'}
        </span>
      </button>
      <span className="text-sm font-semibold text-primary-dark">{isRecording ? formatTime(seconds) : 'Appuyer pour enregistrer'}</span>
      {error && <span className="text-center text-xs font-medium text-error">{error}</span>}
    </div>
  );
}
