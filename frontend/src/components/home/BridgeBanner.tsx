'use client';

import Link from 'next/link';
import { useHomeContent } from '@/lib/useLocalizedContent';
import { Icon } from './ui';
import { Reveal } from './Reveal';

/** Bandeau de transition, entre les centres de formation et les principes de clarté. */
export function BridgeBanner() {
  const { bridge } = useHomeContent();

  return (
    <section className="bg-home-surface px-6 py-10 lg:px-12">
      <Reveal className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 rounded-3xl bg-home-coral px-6 py-7 text-center sm:flex-row sm:text-start">
        <p className="flex items-center gap-3 text-lg font-bold text-white">
          <Icon name="handshake" className="text-2xl" />
          {bridge.title}
        </p>
        <Link
          href="/accueil-public#candidats"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-home-coral-hover transition-colors hover:bg-white/90"
        >
          {bridge.cta}
          <Icon name="arrow_forward" className="text-base rtl:rotate-180" />
        </Link>
      </Reveal>
    </section>
  );
}
