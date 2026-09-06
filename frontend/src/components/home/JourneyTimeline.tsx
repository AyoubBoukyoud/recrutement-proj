'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { Reveal } from './Reveal';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

/**
 * Le parcours complet, du Maroc à l'Allemagne.
 *
 * Neuf étapes présentées comme une grille éditoriale : un filet en haut de
 * chaque étape, un numéro, une ligne de texte. La version précédente dessinait
 * un serpentin en SVG avec neuf teintes différentes et trois rendus séparés
 * (desktop / tablette / mobile) — spectaculaire au premier coup d'œil, mais
 * c'était le bloc le plus long de la page pour l'information la moins dense.
 */
export function JourneyTimeline() {
  const { journey } = useHomeContent();

  return (
    <section className="border-y border-outline-variant/50 bg-surface-container/40 py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <span>{journey.startLabel}</span>
            <Icon name="trending_flat" className="text-base rtl:rotate-180" />
            <span>{journey.endLabel}</span>
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-primary-dark sm:text-4xl">
            {journey.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-onSurface-variant sm:text-lg">
            {journey.subtitle}
          </p>
        </Reveal>

        <ol className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {journey.items.map((step, index) => (
            <li key={step.title} className="h-full">
              <Reveal delay={(index % 3) * 70} className="h-full border-t border-outline-variant/70 pt-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={step.icon} className="text-xl" />
                  </span>
                  <span className="text-xs font-semibold tracking-[0.2em] text-outline">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold leading-snug text-primary-dark">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{step.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
