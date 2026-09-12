'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useHomeContent } from '@/lib/useLocalizedContent';
import { STATS } from '@/lib/socialProofData';
import { Reveal } from './Reveal';

/**
 * Chiffres réels de la plateforme. N'affiche rien tant que `STATS` est vide —
 * un objectif commercial (« 300 profils visés ») n'est pas un résultat et ne
 * doit jamais apparaître ici (plan §14, home.fr.json `_note`). Ajouter une
 * entrée réelle et mesurée dans `socialProofData.ts` suffit à faire
 * apparaître la section.
 */
export function StatsSection() {
  const content = useHomeContent();
  const { language } = useLanguage();

  if (STATS.length === 0) return null;

  return (
    <section className="border-y border-outline-variant/50 bg-surface-container/40 py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-primary-dark sm:text-3xl">
            {content.stats.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-onSurface-variant sm:text-base">
            {content.stats.subtitle}
          </p>
        </Reveal>

        <dl className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <Reveal key={stat.id} delay={index * 60} className="text-center">
              <dd className="text-4xl font-bold text-primary-dark sm:text-5xl">{stat.value}</dd>
              <dt className="mt-2 text-sm font-medium text-onSurface-variant">{stat.label[language] ?? stat.label.fr}</dt>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
