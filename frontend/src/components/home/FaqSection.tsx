'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { Icon, SectionHeading } from './ui';
import { Reveal } from './Reveal';

export function FaqSection() {
  const { faq } = useHomeContent();

  return (
    <section id="faq" className="scroll-mt-20 bg-home-sand py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <SectionHeading eyebrow={faq.eyebrow} title={faq.title} subtitle={faq.subtitle} align="center" className="mx-auto" />
        </Reveal>

        <div className="mt-12 space-y-3">
          {faq.items.map((item, index) => (
            <Reveal key={item.question} delay={index * 40}>
              <details
                name="home-faq"
                open={index === 0}
                className="group rounded-2xl border border-home-line bg-home-surface px-5 py-4 transition-colors open:border-home-coral/40 sm:px-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-home-ink">
                  <span>{item.question}</span>
                  <Icon
                    name="expand_more"
                    className="shrink-0 text-2xl text-home-coral transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 border-t border-home-line pt-3 text-sm leading-relaxed text-home-slate sm:text-base">
                  {item.answer}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
