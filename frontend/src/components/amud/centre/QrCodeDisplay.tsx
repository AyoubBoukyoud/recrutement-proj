'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * Générateur QR (même appel `qrcode.toDataURL()` que `QRCodeGenerator.tsx`,
 * restylé aux tokens `amud-*`), utilisé pour les QR d'entrée/sortie de
 * présence et le QR "rejoindre le quiz". Reste volontairement minimal — les
 * en-têtes (formation/groupe/salle/date, compteur de participants en
 * direct…) sont composés par la page appelante, pas par ce composant.
 */
export function QrCodeDisplay({ value, label, size = 260 }: { value: string; label?: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: '#1b1b1b', light: '#FFFFFF' } })
      .then((url) => {
        if (mounted) setDataUrl(url);
      })
      .catch(() => setDataUrl(null));
    return () => {
      mounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div className="animate-pulse rounded-2xl bg-amud-surface-container-high" style={{ width: size, height: size }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={label ?? 'QR code'}
      width={size}
      height={size}
      className="rounded-2xl border border-amud-outline-variant bg-white p-3 shadow-md"
    />
  );
}
