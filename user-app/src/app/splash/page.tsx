'use client';

// Interface 1 — Splash Screen : logo + slogan, redirection automatique après 2,5s vers /language.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/language');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-between overflow-hidden bg-surface px-6 py-12 text-center shadow-subtle">
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-40" />

      <div className="h-12 w-full" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center w-full max-w-sm">
        <div className="fade-in-entry opacity-0 mb-8">
          <div className="animate-logo-bounce flex h-32 w-32 items-center justify-center rounded-2xl border border-surface-container-low bg-surface-container-lowest p-4 shadow-subtle md:h-40 md:w-40">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-primary text-4xl font-black tracking-wider text-onPrimary shadow-inner">
              AS
            </div>
          </div>
        </div>

        <div className="fade-in-entry stagger-1 opacity-0 mb-3 flex items-baseline gap-1.5">
          <span className="text-[40px] font-bold tracking-tight text-primary">Amud</span>
          <span className="text-[28px] font-light tracking-wide text-primary">Skills</span>
        </div>

        <div className="fade-in-entry stagger-2 opacity-0 flex flex-col items-center gap-2">
          <p className="max-w-[280px] text-sm font-medium text-tertiary">
            Ton chemin direct vers un emploi en Allemagne
          </p>
        </div>
      </div>

      <footer className="fade-in-entry stagger-3 opacity-0 relative z-10 flex w-full flex-col items-center gap-8">
        <div className="h-0.5 w-48 overflow-hidden rounded-full bg-surface-container-high">
          <div className="animate-fill-bar h-full w-full rounded-full bg-primary" />
        </div>
        <div className="flex items-center gap-2 text-outline">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            verified_user
          </span>
          <span className="text-[12px] font-bold uppercase tracking-widest text-outline">Bridging Talent</span>
        </div>
      </footer>
    </main>
  );
}

