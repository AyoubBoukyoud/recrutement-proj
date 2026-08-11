'use client';

import { useState } from 'react';
import { useHomeContent } from '@/lib/useLocalizedContent';

/**
 * Ces questions se posent de toute façon. Non traitées ici, elles se traitent
 * dans la tête du visiteur, contre nous — en particulier « est-ce payant » et
 * « garantissez-vous un emploi », dont la réponse honnête est *non*.
 *
 * Un seul panneau ouvert à la fois, le premier ouvert par défaut : une FAQ
 * entièrement repliée se lit comme une page vide.
 */
export function AccordionFAQ() {
  const { faq } = useHomeContent();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="questions" className="scroll-mt-24 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[820px] px-6 lg:px-12">
        <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-tight text-onSurface">{faq.title}</h2>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-onSurface-variant">{faq.subtitle}</p>

        <dl className="mt-8 divide-y divide-outline-variant/60 border-y border-outline-variant/60">
          {faq.items.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={item.question}>
                <dt>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    id={`faq-button-${index}`}
                    className="flex w-full items-center justify-between gap-4 py-5 text-start text-base font-bold text-onSurface hover:text-primary"
                  >
                    {item.question}
                    <span
                      className={`material-symbols-outlined shrink-0 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      style={{ fontSize: 22 }}
                      aria-hidden="true"
                    >
                      expand_more
                    </span>
                  </button>
                </dt>
                <dd
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-button-${index}`}
                  hidden={!isOpen}
                  className="pb-5 text-[0.9375rem] leading-relaxed text-onSurface-variant"
                >
                  {item.answer}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      {/* Balisage FAQPage : ces questions sont exactement ce que les candidats
          tapent dans un moteur de recherche. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.items.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }),
        }}
      />
    </section>
  );
}
