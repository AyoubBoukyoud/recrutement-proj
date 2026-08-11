'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useHomeContent } from '@/lib/useLocalizedContent';

/**
 * Barre d'action mobile.
 *
 * Elle n'apparaît qu'une fois le Hero dépassé — au-dessus, elle recouvrirait le
 * CTA du Hero — et disparaît quand le CTA final est à l'écran, pour ne pas
 * afficher deux fois le même bouton à dix pixels d'écart.
 */
export function MobileCtaBar() {
  const { mobileBar } = useHomeContent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const finalCta = document.getElementById('cta-final');

    let finalCtaVisible = false;
    const observer = finalCta
      ? new IntersectionObserver(
          ([entry]) => {
            finalCtaVisible = entry.isIntersecting;
            setVisible(window.scrollY > window.innerHeight * 0.8 && !finalCtaVisible);
          },
          { threshold: 0.2 }
        )
      : null;

    observer?.observe(finalCta as Element);

    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8 && !finalCtaVisible);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      data-mobile-cta
      className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/50 bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden"
    >
      <Link
        href="/auth-phone"
        className="flex h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-on-primary shadow-soft"
      >
        {mobileBar.cta}
      </Link>
    </div>
  );
}
