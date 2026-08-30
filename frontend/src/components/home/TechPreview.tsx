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
    <section className="mx-auto max-w-[1280px] px-6 py-20 lg:px-12 lg:py-28">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <Reveal>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-primary">{techPreview.eyebrow}</p>
          <h2 className="text-3xl font-black text-primary-dark sm:text-4xl">{techPreview.title}</h2>
          <p className="mt-4 text-lg text-onSurface-variant">{techPreview.subtitle}</p>
        </Reveal>
        <Reveal delay={100}>
          <img
            src="/assets/images/landing/ai-matching-1440.webp"
            srcSet="/assets/images/landing/ai-matching-720.webp 720w, /assets/images/landing/ai-matching-1440.webp 1440w"
            sizes="(min-width: 1024px) 480px, 100vw"
            alt={techPreview.imageAlt}
            loading="lazy"
            className="w-full rounded-3xl shadow-floating"
          />
        </Reveal>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {CARDS.map(({ key, icon }, index) => {
          const item = items[key];
          return (
            <Reveal key={key} delay={index * 70}>
              <article className="h-full rounded-2xl border border-outline-variant bg-surface-lowest p-6 shadow-soft transition-colors hover:border-primary">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={icon} />
                </div>
                <h3 className="mt-5 font-black text-primary-dark">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-onSurface-variant">{item.body}</p>
              </article>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="mt-10" delay={210}>
        <GhostCta href="/produit">
          {techPreview.cta}
          <Icon name="arrow_forward" className="text-base rtl:rotate-180" />
        </GhostCta>
      </Reveal>
    </section>
  );
}
