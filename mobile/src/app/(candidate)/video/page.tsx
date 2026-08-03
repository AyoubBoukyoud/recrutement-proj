'use client';

// Interface 12 — Enregistrement vidéo de présentation.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Video, Square, RotateCcw, Check } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { useNetwork } from '@/context/NetworkContext';
import { VideoPlayer } from '@/components/shared/VideoPlayer';

export default function VideoRecordingPage() {
  const { profile, updateProfile, markStepComplete } = useProfile();
  const { isOnline, queueAction } = useNetwork();

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(profile.videoUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setRecordedUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError('Impossible d\'accéder à la caméra. Vérifiez les autorisations.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleSave = () => {
    if (!recordedUrl) return;
    updateProfile({ videoUrl: recordedUrl });
    markStepComplete(5);
    if (!isOnline) {
      queueAction('submit_video', { hasVideo: true });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div>
      <header className="flex items-center gap-3 bg-navy-900 p-6 pb-8">
        <Link href="/dashboard" className="text-white">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold text-white">Vidéo de présentation</h1>
      </header>

      <main className="space-y-5 p-6">
        <p className="text-sm text-onSurface-variant">
          Enregistrez une courte vidéo (60 secondes) pour vous présenter aux employeurs.
        </p>

        {recordedUrl ? (
          <VideoPlayer src={recordedUrl} />
        ) : (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
            <video ref={liveVideoRef} muted playsInline className="h-full w-full object-cover" />
            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white/70">
                Aperçu caméra
              </div>
            )}
            {isRecording && (
              <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> {formatTime(seconds)}
              </span>
            )}
          </div>
        )}

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        {saved && <p className="text-xs font-medium text-green-600">Vidéo enregistrée dans votre profil.</p>}

        <div className="flex justify-center gap-3">
          {!recordedUrl && (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex h-16 w-16 items-center justify-center rounded-full shadow-floating ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-navy-900'
              }`}
            >
              {isRecording ? <Square size={22} className="text-white" /> : <Video size={22} className="text-white" />}
            </button>
          )}
        </div>

        {recordedUrl && !isRecording && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRecordedUrl(null)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-3 text-sm font-bold text-onSurface-variant"
            >
              <RotateCcw size={16} /> Recommencer
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white"
            >
              <Check size={16} /> Valider
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
