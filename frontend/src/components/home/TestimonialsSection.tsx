'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { useLanguage } from '@/context/LanguageContext';
import { TESTIMONIALS } from '@/lib/socialProofData';
import { Reveal } from './Reveal';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

/**
 * Témoignages de candidats. N'affiche rien tant que `TESTIMONIALS` est vide —
 * la page interdit les témoignages non vérifiés (plan §15, home.fr.json
 * `_note`). Ajouter une entrée réelle dans `socialProofData.ts` suffit à
 * faire apparaître la section.
 */
export function TestimonialsSection() {
  const content = useHomeContent();
  const { language } = useLanguage();

  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="border-y border-outline-variant/50 bg-surface-container/40 py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {content.testimonials.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-primary-dark sm:text-4xl">
            {content.testimonials.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-onSurface-variant sm:text-lg">
            {content.testimonials.subtitle}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal key={testimonial.id} delay={index * 70}>
              <figure className="flex h-full flex-col rounded-2xl border border-outline-variant/60 bg-surface-lowest p-6 shadow-soft">
                <Icon name="format_quote" className="text-3xl text-primary/30" />
                <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-onSurface">
                  {testimonial.quote[language] ?? testimonial.quote.fr}
                </blockquote>

                <figcaption className="mt-5 flex items-center gap-3 border-t border-outline-variant/50 pt-4">
                  {testimonial.photo ? (
                    <img
                      src={testimonial.photo}
                      alt={testimonial.photoAlt ?? ''}
                      loading="lazy"
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                    >
                      {testimonial.firstName.slice(0, 1)}
                      {testimonial.lastNameInitial}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-primary-dark">
                      {testimonial.firstName} {testimonial.lastNameInitial}.
                    </p>
                    <p className="truncate text-xs text-onSurface-variant">
                      {testimonial.trade} · {testimonial.city}
                    </p>
                  </div>
                </figcaption>

                {testimonial.milestones.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                    {testimonial.milestones.map((milestone) => (
                      <li key={milestone} className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Icon name="check_circle" className="text-sm" />
                        {content.testimonials.milestones[milestone]}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
