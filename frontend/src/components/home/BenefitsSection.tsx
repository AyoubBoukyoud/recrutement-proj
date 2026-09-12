'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { Reveal } from './Reveal';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

/**
 * Pourquoi créer son dossier — quatre bénéfices candidat, sans photo (l'accent
 * visuel du parcours vient de la section métiers juste après).
 */
export function BenefitsSection() {
  const { benefits } = useHomeContent();

  return (
    <section className="border-t border-outline-variant/50 py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-primary-dark sm:text-4xl">
            {benefits.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-onSurface-variant sm:text-lg">{benefits.subtitle}</p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.items.map((item, index) => (
            <Reveal key={item.title} delay={index * 60}>
              <article className="h-full rounded-2xl border border-outline-variant/60 bg-surface-lowest p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={item.icon} className="text-2xl" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-primary-dark">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
