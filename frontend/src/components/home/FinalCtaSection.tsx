'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { CoralButton, OutlineButton } from './ui';
import { Reveal } from './Reveal';

export function FinalCtaSection() {
  const { finalCta } = useHomeContent();

  return (
    <section className="relative overflow-hidden bg-home-strong py-20 text-white lg:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_50%_0%,rgba(241,105,63,0.16),transparent_65%)]" />

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-12">
        <Reveal>
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{finalCta.title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{finalCta.subtitle}</p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <CoralButton href="/auth-phone" size="lg">
              {finalCta.candidateCta}
            </CoralButton>
            <OutlineButton href="/auth-phone?intent=recruiter" size="lg" onDark>
              {finalCta.recruiterCta}
            </OutlineButton>
            <OutlineButton href="/accueil-public#centres" size="lg" onDark>
              {finalCta.centerCta}
            </OutlineButton>
          </div>

          <p className="mt-6 text-sm text-white/60">{finalCta.microcopy}</p>
        </Reveal>
      </div>
    </section>
  );
}
