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
 * présentation, l'OCR et le suivi en temps réel.
 */
export function TechPreview() {
  const content = useHomeContent();
  const { techPreview } = content;
  const items = content.product.features.items;

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20 lg:px-12 lg:py-28">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-300">
            ⚡ Plateforme Intelligente
          </span>
          <h2 className="mt-3 text-3xl font-black text-emerald-950 dark:text-white sm:text-4xl lg:text-5xl">{techPreview.title}</h2>
          <p className="mt-4 text-lg text-onSurface-variant dark:text-zinc-300">{techPreview.subtitle}</p>
        </Reveal>
        <Reveal delay={100}>
          <img
            src="/assets/images/landing/ai-matching-1440.webp"
            srcSet="/assets/images/landing/ai-matching-720.webp 720w, /assets/images/landing/ai-matching-1440.webp 1440w"
            sizes="(min-width: 1024px) 480px, 100vw"
            alt={techPreview.imageAlt}
            loading="lazy"
            className="w-full rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-floating"
          />
        </Reveal>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {CARDS.map(({ key, icon }, index) => {
          const item = items[key];
          return (
            <Reveal key={key} delay={index * 70}>
              <article className="h-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c1815] p-6 shadow-soft transition-all duration-300 hover:border-emerald-500/50 hover:shadow-floating dark:hover:bg-[#231f1c]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  <Icon name={icon} className="text-2xl" />
                </div>
                <h3 className="mt-5 text-lg font-black text-emerald-950 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-onSurface-variant dark:text-zinc-300">{item.body}</p>
              </article>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="mt-10" delay={210}>
        <GhostCta href="/produit">
          <span>{techPreview.cta}</span>
          <Icon name="arrow_forward" className="text-base rtl:rotate-180" />
        </GhostCta>
      </Reveal>
    </section>
  );
}
