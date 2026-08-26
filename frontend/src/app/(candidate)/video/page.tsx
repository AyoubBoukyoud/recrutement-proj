'use client';

// Interface 12 — Enregistrement vidéo de présentation.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Video, Square, RotateCcw, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { useCandidateProfile, useInvalidateCandidateProfile } from '@/lib/useCandidateProfile';
import { candidateProfileRepository } from '@/data/candidateProfile';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { Button } from '@/components/shared/Button';
import { ApiError } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { candidateVideoContentFor } from '@/lib/candidateVideoContent';

function messageOf(error: unknown, fallback: string, networkMessage: string): string {
  if (error instanceof ApiError) {
    if (error.isNetworkFailure) return networkMessage;
    return error.message || fallback;
  }
  return fallback;
}

export default function VideoRecordingPage() {
  const { token } = useAuth();
  const { data: profile } = useCandidateProfile();
  const invalidateProfile = useInvalidateCandidateProfile();
  const { isOnline } = useNetwork();
  const { language } = useLanguage();
  const content = candidateVideoContentFor(language);

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.video_url && !recordedUrl) setRecordedUrl(profile.video_url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

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
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError(content.errors.cameraUnavailable);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleSave = async () => {
    if (!recordedBlob || !token) return;
    setError(null);
    setIsSaving(true);

    try {
      const file = new File([recordedBlob], 'presentation.webm', { type: 'video/webm' });
      const updated = await candidateProfileRepository.uploadVideo(file, token);
      setRecordedUrl(updated.video_url);
      setRecordedBlob(null);
      await invalidateProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (cause) {
      setError(messageOf(cause, content.errors.uploadFailed, content.errors.networkUnreachable));
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div>
      <header className="flex items-center gap-3 bg-primary p-2.5 pb-3 lg:px-4">
        <Link href="/dashboard" className="text-onPrimary">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold text-onPrimary">{content.header.title}</h1>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 p-6 lg:max-w-3xl lg:px-10 lg:py-8">
        <p className="text-sm text-onSurface-variant">
          {content.instructions}
        </p>

        {recordedUrl ? (
          <VideoPlayer src={recordedUrl} />
        ) : (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
            <video ref={liveVideoRef} muted playsInline className="h-full w-full object-cover" />
            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white/70">
                {content.cameraPreview}
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
        {saved && <p className="text-xs font-medium text-green-600">{content.saved}</p>}

        <div className="flex justify-center gap-3">
          {!recordedUrl && (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex h-16 w-16 items-center justify-center rounded-full shadow-floating ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary'
              }`}
            >
              {isRecording ? <Square size={22} className="text-white" /> : <Video size={22} className="text-white" />}
            </button>
          )}
        </div>

        {recordedUrl && !isRecording && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setRecordedUrl(null);
                setRecordedBlob(null);
              }}
              className="flex-1 gap-1.5 text-onSurface-variant"
            >
              <RotateCcw size={16} /> {content.restart}
            </Button>
            {recordedBlob && (
              <Button
                variant="secondary"
                onClick={() => void handleSave()}
                disabled={isSaving || !isOnline}
                isLoading={isSaving}
                loadingLabel={content.sending}
                className="flex-1 gap-1.5"
              >
                <Check size={16} /> {content.validate}
              </Button>
            )}
          </div>
        )}
        {!isOnline && recordedBlob && (
          <p className="text-xs font-medium text-tertiary">
            {content.offlineNotice}
          </p>
        )}
      </main>
    </div>
  );
}
