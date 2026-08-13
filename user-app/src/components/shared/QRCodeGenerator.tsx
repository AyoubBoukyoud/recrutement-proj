'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export function QRCodeGenerator({ value, size = 160 }: QRCodeGeneratorProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Le vert de marque vient des tokens partagés, exposés par next.config.mjs :
    // un canvas ne peut pas porter de classe Tailwind.
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: process.env.NEXT_PUBLIC_BRAND_PRIMARY, light: '#FFFFFF' },
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch(() => setDataUrl(null));
    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div className="animate-pulse rounded-xl bg-surface-container" style={{ width: size, height: size }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR code"
      width={size}
      height={size}
      className="rounded-xl border-2 border-dashed border-primary bg-white p-2 shadow-soft"
    />
  );
}
