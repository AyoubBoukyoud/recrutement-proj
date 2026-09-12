'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { CoralButton, Icon, OutlineButton, SectionHeading } from './ui';
import { Reveal } from './Reveal';

export function BorderlessSection() {
  const { borderless } = useHomeContent();

  return (
    <section id="candidats" className="scroll-mt-20 bg-home-surface py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal>
          <SectionHeading eyebrow={borderless.eyebrow} title={borderless.title} subtitle={borderless.subtitle} align="center" className="mx-auto" />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-3xl border border-home-line bg-home-sand p-8 sm:p-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-home-surface text-home-coral shadow-sm">
                <Icon name="person" className="text-2xl" />
              </span>
              <h3 className="mt-6 text-2xl font-bold leading-snug text-home-ink">{borderless.candidate.title}</h3>
              <ul className="mt-6 flex-1 space-y-3.5">
                {borderless.candidate.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-home-slate">
                    <Icon name="check_circle" className="mt-0.5 shrink-0 text-base text-home-coral" />
                    {item}
                  </li>
                ))}
              </ul>
              <CoralButton href="/auth-phone" size="md" className="mt-8 self-start">
                {borderless.candidate.cta}
              </CoralButton>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex h-full flex-col rounded-3xl bg-home-strong p-8 text-white sm:p-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Icon name="corporate_fare" className="text-2xl" />
              </span>
              <h3 className="mt-6 text-2xl font-bold leading-snug">{borderless.recruiter.title}</h3>
              <ul className="mt-6 flex-1 space-y-3.5">
                {borderless.recruiter.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/75">
                    <Icon name="check_circle" className="mt-0.5 shrink-0 text-base text-white" />
                    {item}
                  </li>
                ))}
              </ul>
              <OutlineButton href="/employeurs" size="md" onDark className="mt-8 self-start">
                {borderless.recruiter.cta}
              </OutlineButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
