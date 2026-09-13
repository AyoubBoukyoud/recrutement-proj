'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { Icon, SectionHeading } from './ui';
import { Reveal } from './Reveal';

export function FeatureGridSection() {
  const { features } = useHomeContent();

  return (
    <section className="bg-home-sand py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal>
          <SectionHeading eyebrow={features.eyebrow} title={features.title} subtitle={features.subtitle} align="center" className="mx-auto" />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((item, index) => (
            <Reveal key={item.title} delay={index * 50}>
              <article className="flex h-full flex-col rounded-2xl border border-home-line bg-home-surface p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-home-ink/[0.05] text-home-ink">
                  <Icon name={item.icon} className="text-2xl" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-home-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-home-slate">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
