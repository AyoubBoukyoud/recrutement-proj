'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

/**
 * Scanner QR caméra réel : `getUserMedia` + `<video>` + canvas hors-écran +
 * `jsQR` en boucle `requestAnimationFrame`. Pas un widget tiers avec sa
 * propre UI (`html5-qrcode` impose son propre viewfinder) — composé comme
 * `Modal`/`Drawer`/`QRCodeGenerator`, pour rester habillé aux tokens
 * `amud-*` par le composant appelant (`QrScanner.tsx`).
 *
 * Limitation assumée (pas de backend, cf. cahier des charges) : ceci décode
 * réellement n'importe quel QR filmé, mais la démo multi-rôles de ce module
 * se fait dans plusieurs onglets d'un même navigateur (même `localStorage`),
 * pas sur deux appareils physiques distincts.
 */
export type QrScannerError = 'PERMISSION_DENIED' | 'NO_CAMERA' | 'UNSUPPORTED' | 'UNKNOWN';

export function useQrScanner(onDecode: (text: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<QrScannerError | null>(null);
  const [active, setActive] = useState(false);
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code?.data) {
      onDecodeRef.current(code.data);
      return; // le composant appelant décide de stop()/relancer après un résultat exploité
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('UNSUPPORTED');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play();
      }
      setActive(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const name = (err as { name?: string } | null)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') setError('PERMISSION_DENIED');
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setError('NO_CAMERA');
      else setError('UNKNOWN');
    }
  }, [tick]);

  useEffect(() => stop, [stop]);

  return { videoRef, start, stop, error, active } as const;
}
