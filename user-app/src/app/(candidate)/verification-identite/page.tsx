'use client';

// Page : Vérification d'identité - Capture (Stitch exact template)

import Link from 'next/link';
import { useState } from 'react';
import { IconButton } from '@/components/shared/Button';

export default function VerificationIdentitePage() {
  const [flashOn, setFlashOn] = useState(true);
  const [captured, setCaptured] = useState(false);
  const [showFlashEffect, setShowFlashEffect] = useState(false);

  const handleCapture = () => {
    setShowFlashEffect(true);
    setTimeout(() => {
      setShowFlashEffect(false);
      setCaptured(true);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-background text-onSurface pb-24 flex flex-col font-sans">
      {/* Top Navigation Bar */}
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
        {/* Instructions Section */}
        <section className="w-full py-4 text-center">
          <p className="text-base font-semibold leading-relaxed text-onSurface-variant">
            Prenez un selfie en tenant votre passeport ouvert à côté de votre visage.
          </p>
        </section>

        {/* Camera Interface */}
        <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-3xl bg-black shadow-2xl flex flex-col justify-center items-center lg:max-w-lg">
          {/* Mock Camera Feed Background */}
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover opacity-60"
              alt="Aperçu caméra selfie et passeport"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0J62yrUrgNKW6qRo4MTSKpR9xZDqjtmuXqCzQYX241WJSfaD4RHB4Qqa7n3MJ_-sLQVFElrtZSz5KZYMTKTtNcYZcEOserq0PjmI2gGW_WMaJVkcdcA2tPYG7lyxFus273OQiMXUXe2K20CdLg5L4eFRb5CG9dIikTYHi8HMFIRLH4gbxdBt0ESv_xZsNB6uG23Q3kSZNZmBM251MXQOF9rKrnDtsVuduDWu42iyj-QR5uMAQJjCG"
            />
          </div>

          {/* Flash shutter overlay effect */}
          {showFlashEffect && <div className="absolute inset-0 z-50 bg-white transition-opacity duration-100" />}

          {/* Overlay Guides */}
          <div className="pointer-events-none absolute inset-0 z-10 flex">
            {/* Semi-transparent dark mask */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Face Guide (Left Side) */}
            <div
              className="absolute left-[5%] top-[15%] h-[60%] w-[50%] rounded-[100%] border-2 border-dashed border-white/70 shadow-2xl"
              style={{ clipPath: 'ellipse(40% 45% at 50% 50%)', background: 'transparent' }}
            />

            {/* Passport Guide (Right Side) */}
            <div
              className="absolute bottom-[10%] right-[5%] h-[30%] w-[40%] rounded-xl border-2 border-dashed border-white/70 shadow-2xl"
              style={{ clipPath: 'inset(0 round 12px)', background: 'transparent' }}
            />

            {/* Labels for guides */}
            <div className="absolute left-[10%] top-[10%] rounded bg-primary/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Visage
            </div>
            <div className="absolute bottom-[42%] right-[10%] rounded bg-primary/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Passeport
            </div>
          </div>

          {/* Focus Corners UI */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/20" />

          {/* Bottom Controls within Camera Frame */}
          <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center px-8">
            <button
              type="button"
              id="capture-btn"
              onClick={handleCapture}
              className="group flex h-20 w-20 items-center justify-center rounded-full bg-white transition-all duration-300 active:scale-90 hover:scale-105"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-secondary/30 group-active:bg-surface-container">
                <div className="h-14 w-14 rounded-full border-[3px] border-secondary" />
              </div>
            </button>
          </div>

          {/* Flash & Switch Toggle */}
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
            <IconButton variant="ghost" aria-label="Changer de caméra" className="bg-black/50 text-white backdrop-blur-md hover:enabled:bg-black/70">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                flip_camera_ios
              </span>
            </IconButton>
          </div>
        </div>

        {captured && (
          <div className="mt-4 flex w-full max-w-md items-center gap-2 rounded-pillar bg-surface-container-low p-3 text-xs font-bold text-primary animate-pulse lg:max-w-lg">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              check_circle
            </span>
            Capture effectuée avec succès ! En cours d&apos;analyse…
          </div>
        )}

        {/* Secondary Action */}
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
