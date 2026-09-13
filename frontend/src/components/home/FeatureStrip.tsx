'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { Icon } from './ui';
import { Reveal } from './Reveal';

/** Bandeau des trois publics de la plateforme, juste sous le hero. */
export function FeatureStrip() {
  const { featureStrip } = useHomeContent();

  return (
    <section className="border-y border-home-line bg-home-surface">
      <div className="mx-auto grid max-w-[1280px] gap-px overflow-hidden px-6 sm:grid-cols-3 lg:px-12">
        {featureStrip.items.map((item, index) => (
          <Reveal key={item.title} delay={index * 60}>
            <div
              className={`flex items-start gap-4 py-8 sm:px-6 ${
                index > 0 ? 'sm:border-s sm:border-home-line' : ''
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-home-coral-soft text-home-coral-dark">
                <Icon name={item.icon} className="text-xl" />
              </span>
              <div>
                <h3 className="text-base font-bold text-home-ink">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-home-slate">{item.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
