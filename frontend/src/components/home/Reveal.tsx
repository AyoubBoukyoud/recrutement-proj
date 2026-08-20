'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  /** Extra classes for the wrapper — put layout-affecting utilities here (col-span, flex-1, h-full…). */
  className?: string;
  /** Stagger offset in ms, for siblings revealed as a group. */
  delay?: number;
};

/**
 * Reveals its content once it scrolls into view. Fires once (no re-hide on
 * scroll-up) and resolves to visible immediately for reduced-motion users or
 * if IntersectionObserver is unavailable, so motion is additive, never load-bearing.
 */
export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={revealed ? 'visible' : 'pending'}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:!opacity-100 motion-reduce:!translate-y-0 ${
        revealed ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/** No-JS fallback: force full visibility so a blocked/failed script never hides content. */
export function RevealNoScriptFallback() {
  return (
    <noscript>
      <style>{'[data-reveal="pending"]{opacity:1!important;transform:none!important;}'}</style>
    </noscript>
  );
}
