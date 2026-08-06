'use client';

// Interface 1 — Splash Screen : logo + slogan, redirection automatique après 2,5s vers /language.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function SplashPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/language');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md md:max-w-2xl flex-col items-center justify-between overflow-hidden bg-surface px-6 py-12 text-center shadow-subtle">
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-40" />

      <div className="h-12 w-full" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center w-full max-w-sm">
        <div className="fade-in-entry opacity-0 mb-8">
          <div className="animate-logo-bounce flex h-32 w-32 items-center justify-center rounded-2xl border border-surface-container-low bg-surface-container-lowest p-4 shadow-subtle md:h-40 md:w-40">
            <img
              src="/assets/images/Logo.jpg"
              alt="Amud Skills"
              className="h-full w-full rounded-xl object-contain"
            />
          </div>
        </div>

        <div className="fade-in-entry stagger-2 opacity-0 flex flex-col items-center gap-2">
          <p className="max-w-[280px] text-sm font-medium text-tertiary">
            {t('common:brand.tagline')}
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

