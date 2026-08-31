'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useHomeContent } from '@/lib/useLocalizedContent';

export function MobileActionBar() {
  const content = useHomeContent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Afficher la barre dès qu'on a dépassé le hero vidéo (scroll > 450px)
      const isPastHero = window.scrollY > 450;
      
      // Masquer si on est tout en bas (près du footer)
      const isNearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;

      setVisible(isPastHero && !isNearBottom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <aside
      aria-label="Action rapide mobile"
      className="fixed bottom-0 inset-x-0 z-40 sm:hidden transition-all duration-300 animate-in slide-in-from-bottom-5 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-3 mb-3 rounded-2xl border border-white/30 dark:border-white/10 bg-surface/90 dark:bg-surface/95 p-3 shadow-[0_10px_35px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0 ps-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Gratuit
            </span>
            <span className="text-xs font-bold text-onSurface truncate">
              {content.hero.eyebrow}
            </span>
          </div>

          <Link
            href="/auth-phone"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-md active:scale-95 transition-transform"
          >
            <span>{content.hero.cta}</span>
            <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
