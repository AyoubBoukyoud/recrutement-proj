'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { GhostCta } from './Cta';
import { Reveal } from './Reveal';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const CARDS = [
  { key: 'pitch' as const, icon: 'videocam' },
  { key: 'ocr' as const, icon: 'document_scanner' },
  { key: 'tracking' as const, icon: 'track_changes' },
];

/**
 * Teaser vers `/produit`, qui documente déjà en détail la vidéo de
 * présentation, l'OCR et le suivi en temps réel — pas de duplication de ces
 * démonstrations ici, seulement trois cartes courtes qui pointent vers la
 * page dédiée. Le texte vient de `content.product.features.items`, déjà
 * traduit en 4 langues pour `/produit`.
 */
export function TechPreview() {
  const content = useHomeContent();
  const { techPreview } = content;
  const items = content.product.features.items;

  return (
    <section className="border-t border-outline-variant/50 py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{techPreview.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-primary-dark sm:text-4xl">
            {techPreview.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-onSurface-variant sm:text-lg">
            {techPreview.subtitle}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {CARDS.map(({ key, icon }, index) => {
            const item = items[key];
            return (
              <Reveal key={key} delay={index * 70}>
                <article className="h-full rounded-2xl border border-outline-variant/60 bg-surface-lowest p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={icon} className="text-2xl" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-primary-dark">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{item.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-10 flex justify-center" delay={210}>
          <GhostCta href="/produit">
            {techPreview.cta}
            <Icon name="arrow_forward" className="text-base rtl:rotate-180" />
          </GhostCta>
        </Reveal>
      </div>
    </section>
  );
}
