'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { Icon, SectionHeading } from './ui';
import { Reveal } from './Reveal';

export function GermanLevelsSection() {
  const { germanLevels } = useHomeContent();

  return (
    <section className="bg-home-coral-soft py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal>
          <SectionHeading
            eyebrow={germanLevels.eyebrow}
            title={germanLevels.title}
            subtitle={germanLevels.subtitle}
            align="center"
            className="mx-auto"
          />
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {germanLevels.items.map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <article className="flex h-full flex-col rounded-2xl bg-home-surface p-7 shadow-[0_10px_30px_rgba(16,35,58,0.06)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-home-coral-soft text-home-coral-dark">
                  <Icon name={item.icon} className="text-2xl" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-home-ink">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-home-slate">{item.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-home-coral">
                  {item.linkLabel}
                  <Icon name="arrow_forward" className="text-base rtl:rotate-180" />
                </span>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
