'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/amud/ui';
import { useQrScanner, type QrScannerError } from '@/lib/amud/useQrScanner';

const ERROR_MESSAGES: Record<QrScannerError, { title: string; description: string }> = {
  PERMISSION_DENIED: { title: 'Accès à la caméra refusé', description: 'Autorisez l’accès à la caméra dans les réglages de votre navigateur pour scanner un QR code.' },
  NO_CAMERA: { title: 'Aucune caméra détectée', description: 'Cet appareil ne semble pas avoir de caméra disponible.' },
  UNSUPPORTED: { title: 'Scanner non disponible', description: 'Votre navigateur ne permet pas d’accéder à la caméra ici.' },
  UNKNOWN: { title: 'Impossible d’ouvrir la caméra', description: 'Une erreur inattendue est survenue.' },
};

/**
 * Surface caméra plein écran (à monter dans `Drawer anchor="full"`) :
 * démarre/arrête le flux avec `active`, appelle `onScan(text)` à chaque QR
 * décodé. Le composant appelant décide de la suite (valider le payload,
 * fermer le scanner, relancer pour un prochain scan).
 */
export function QrScanner({ active, onScan }: { active: boolean; onScan: (text: string) => void }) {
  const { videoRef, start, stop, error } = useQrScanner(onScan);

  useEffect(() => {
    if (active) start();
    else stop();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (error) {
    const msg = ERROR_MESSAGES[error];
    return (
      <div className="flex h-full items-center justify-center p-lg">
        <ErrorState title={msg.title} description={msg.description} onRetry={start} />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} className="h-full w-full object-cover" playsInline muted aria-label="Aperçu caméra pour le scan du QR code" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 max-h-[70vw] max-w-[70vw] rounded-2xl border-4 border-white/80" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
      </div>
      <p className="pointer-events-none absolute bottom-10 left-0 right-0 text-center text-label-md font-medium text-white">Visez le QR code pour le scanner</p>
    </div>
  );
}
