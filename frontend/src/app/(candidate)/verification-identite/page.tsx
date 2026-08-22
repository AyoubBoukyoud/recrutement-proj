'use client';

// Page : Vérification d'identité — capture, envoi, puis suivi de l'approbation.
//
// Réutilise le pipeline document existant (`POST /candidate/documents`,
// type=identity) plutôt qu'un système parallèle : la vérification, c'est
// l'approbation admin du document, comme pour un diplôme.

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IconButton, Button } from '@/components/shared/Button';
import { ApiError } from '@/lib/api';
import { documentsRepository } from '@/data/documents';
import type { CandidateDocument } from '@/lib/documents';

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.isNetworkFailure) return "L'API est injoignable. Vérifiez votre connexion.";
    return error.message || fallback;
  }
  return fallback;
}

const STATUS_COPY: Record<'pending' | 'approved' | 'rejected', { label: string; icon: string }> = {
  pending: { label: 'En attente de vérification par un administrateur.', icon: 'hourglass_top' },
  approved: { label: 'Identité vérifiée.', icon: 'verified_user' },
  rejected: { label: 'Vérification refusée — reprenez une photo.', icon: 'error' },
};

export default function VerificationIdentitePage() {
  const { token } = useAuth();
  const [existing, setExisting] = useState<CandidateDocument | null | undefined>(undefined);
  const [flashOn, setFlashOn] = useState(true);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showFlashEffect, setShowFlashEffect] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const documents = await documentsRepository.list(token);
      const latest = documents.filter((d) => d.type === 'identity').sort((a, b) => b.id - a.id)[0];
      setExisting(latest ?? null);
    } catch {
      setExisting(null);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // La caméra ne démarre que quand il n'y a rien de vérifié/en attente à montrer.
  const needsCapture = existing === null || existing?.approval_status === 'rejected';

  useEffect(() => {
    if (!needsCapture || capturedUrl) return;

    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      })
      .catch(() => setError("Impossible d'accéder à la caméra. Vérifiez les autorisations."));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [needsCapture, capturedUrl]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setShowFlashEffect(true);
    setTimeout(() => setShowFlashEffect(false), 150);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setCapturedBlob(blob);
      setCapturedUrl(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }, 'image/jpeg', 0.9);
  };

  const retake = () => {
    setCapturedBlob(null);
    setCapturedUrl(null);
    setError(null);
  };

  const confirmUpload = async () => {
    if (!capturedBlob || !token) return;
    setIsUploading(true);
    setError(null);

    try {
      const file = new File([capturedBlob], 'identite.jpg', { type: 'image/jpeg' });
      await documentsRepository.upload(file, 'identity', token);
      setCapturedBlob(null);
      setCapturedUrl(null);
      await refresh();
    } catch (cause) {
      setError(messageOf(cause, "L'envoi a échoué. Réessayez."));
    } finally {
      setIsUploading(false);
    }
  };

  const statusCopy = existing?.approval_status ? STATUS_COPY[existing.approval_status] : null;

  return (
    <div className="min-h-screen bg-background text-onSurface pb-24 flex flex-col font-sans">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-surface-container-high bg-background px-4 lg:px-10">
        <Link
          href="/profil"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-opacity hover:opacity-80 active:scale-95"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Link>
        <h1 className="flex-1 pr-10 text-center text-lg font-extrabold text-primary">Vérification d&apos;identité</h1>
      </header>

      <main className="mx-auto flex flex-1 w-full max-w-md flex-col items-center px-4 pb-12 lg:max-w-lg lg:pb-16 lg:pt-6">
        {existing === undefined ? (
          <p className="helper-text py-8">Chargement…</p>
        ) : existing && existing.approval_status !== 'rejected' ? (
          <section className="w-full space-y-4 py-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>
                {statusCopy?.icon}
              </span>
            </div>
            <p className="text-base font-semibold text-onSurface">{statusCopy?.label}</p>
            {existing.rejection_reason && (
              <p className="text-sm text-onSurface-variant">{existing.rejection_reason}</p>
            )}
          </section>
        ) : (
          <>
            <section className="w-full py-4 text-center">
              <p className="text-base font-semibold leading-relaxed text-onSurface-variant">
                Prenez une photo de vous tenant votre pièce d&apos;identité à côté de votre visage.
              </p>
              {existing?.approval_status === 'rejected' && (
                <p className="mt-2 text-sm font-medium text-error">
                  Photo précédente refusée{existing.rejection_reason ? ` : ${existing.rejection_reason}` : '.'}
                </p>
              )}
            </section>

            <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-3xl bg-black shadow-2xl flex flex-col justify-center items-center lg:max-w-lg">
              {capturedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={capturedUrl} alt="Photo capturée" className="h-full w-full object-cover" />
              ) : (
                <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
              )}
              <canvas ref={canvasRef} className="hidden" />

              {showFlashEffect && <div className="absolute inset-0 z-50 bg-white transition-opacity duration-100" />}

              {!capturedUrl && (
                <div className="pointer-events-none absolute inset-0 z-10 flex">
                  <div
                    className="absolute left-[15%] top-[10%] h-[65%] w-[70%] rounded-[100%] border-2 border-dashed border-white/70 shadow-2xl"
                    style={{ clipPath: 'ellipse(40% 45% at 50% 50%)', background: 'transparent' }}
                  />
                </div>
              )}

              {!capturedUrl && (
                <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center px-8">
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="group flex h-20 w-20 items-center justify-center rounded-full bg-white transition-all duration-300 active:scale-90 hover:scale-105"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-secondary/30 group-active:bg-surface-container">
                      <div className="h-14 w-14 rounded-full border-[3px] border-secondary" />
                    </div>
                  </button>
                </div>
              )}

              {!capturedUrl && (
                <div className="absolute right-5 top-5 z-30 flex flex-col gap-3">
                  <IconButton
                    variant="ghost"
                    onClick={() => setFlashOn(!flashOn)}
                    aria-pressed={flashOn}
                    aria-label="Activer ou couper le flash"
                    className="bg-black/50 text-white backdrop-blur-md hover:enabled:bg-black/70"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {flashOn ? 'flash_on' : 'flash_off'}
                    </span>
                  </IconButton>
                </div>
              )}
            </div>

            {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

            {capturedUrl && (
              <div className="mt-6 flex w-full gap-3">
                <Button variant="outline" onClick={retake} className="flex-1" disabled={isUploading}>
                  Reprendre
                </Button>
                <Button
                  onClick={() => void confirmUpload()}
                  className="flex-1"
                  disabled={isUploading}
                  isLoading={isUploading}
                  loadingLabel="Envoi…"
                >
                  Envoyer
                </Button>
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex w-full max-w-md flex-col gap-4 lg:max-w-lg">
          <Link
            href="/profil"
            className="flex w-full items-center justify-center gap-2 rounded-pillar border border-outline-variant py-4 text-xs font-bold text-primary transition-all hover:bg-surface-container-low active:scale-[0.98]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              person
            </span>
            Retour au Profil
          </Link>
          <p className="px-6 text-center text-[11px] leading-relaxed text-onSurface-variant opacity-80 font-medium">
            Vos données sont chiffrées et traitées conformément à la réglementation européenne sur la protection des données (RGPD).
          </p>
        </div>
      </main>
    </div>
  );
}
