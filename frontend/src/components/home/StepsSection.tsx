'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { CoralButton, Icon, SectionHeading } from './ui';
import { Reveal } from './Reveal';

export function StepsSection() {
  const { steps } = useHomeContent();

  return (
    <section id="methodology" className="scroll-mt-20 bg-home-surface py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal>
          <SectionHeading eyebrow={steps.eyebrow} title={steps.title} subtitle={steps.subtitle} align="center" className="mx-auto" />
        </Reveal>

        <div className="relative mt-14">
          {/* Ligne de connexion entre les étapes — masquée sur mobile où les cartes s'empilent. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[2.75rem] hidden h-px bg-home-line lg:block"
            style={{ marginInline: '12.5%' }}
          />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.items.map((step, index) => (
              <Reveal key={step.title} delay={index * 70}>
                <article className="relative flex flex-col items-start">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-home-strong text-white shadow-[0_10px_24px_rgba(16,35,58,0.18)]">
                    <Icon name={step.icon} className="text-2xl" />
                  </div>
                  <span aria-hidden="true" className="mt-4 text-sm font-bold text-home-coral">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-1.5 text-lg font-bold leading-snug text-home-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-home-slate">{step.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={140} className="mt-14 flex justify-center">
          <CoralButton href="/auth-phone" size="lg">
            <span className="flex items-center gap-2">
              <span>{steps.cta}</span>
              <Icon name="arrow_forward" className="text-lg rtl:rotate-180" />
            </span>
          </CoralButton>
        </Reveal>
      </div>
    </section>
  );
}
