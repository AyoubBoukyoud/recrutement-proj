'use client';

import { useEffect, useState } from 'react';
import { useHomeContent } from '@/lib/useLocalizedContent';
import { CoralButton } from './ui';

/**
 * Barre d'action mobile persistante (plan §2.12) : apparaît une fois le hero
 * sorti du viewport, disparaît près du CTA final pour ne pas le doubler.
 */
export function MobileActionBar() {
  const content = useHomeContent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isPastHero = window.scrollY > window.innerHeight * 0.6;
      const isNearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400;

      setVisible(isPastHero && !isNearBottom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <aside
      aria-label={content.mobileBar.cta}
      aria-hidden={!visible}
      className={`fixed bottom-0 inset-x-0 z-40 sm:hidden pb-[env(safe-area-inset-bottom)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
    >
      <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-home-line bg-home-surface/95 p-3 shadow-[0_10px_35px_rgba(16,35,58,0.15)] backdrop-blur-xl">
        <p className="line-clamp-2 min-w-0 flex-1 ps-1 text-[11px] font-medium leading-snug text-home-slate">
          {content.hero.microcopy}
        </p>
        <CoralButton href="/auth-phone" size="sm" className="shrink-0">
          {content.mobileBar.cta}
        </CoralButton>
      </div>
    </aside>
  );
}
