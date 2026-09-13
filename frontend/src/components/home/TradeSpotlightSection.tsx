'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';
import { Icon, SectionHeading } from './ui';
import { Reveal } from './Reveal';

/**
 * « Votre métier, votre prochaine étape » : photo plein cadre + carrousel à
 * puces sur les métiers réels de `useTrades()` (mêmes photos que les fiches
 * `/metiers/[slug]`). Le CTA mène à la fiche du métier affiché — elle liste
 * elle-même d'autres métiers en bas de page, donc le parcours de découverte
 * continue sans qu'une page « tous les métiers » dédiée n'existe.
 */
export function TradeSpotlightSection() {
  const { tradeSpotlight, trades: tradesCopy } = useHomeContent();
  const { trades } = useTrades();
  const withImage = trades.filter((trade) => trade.image);
  const list = withImage.length > 0 ? withImage : trades;
  const [active, setActive] = useState(0);
  const trade = list[active % list.length];

  if (!trade) return null;

  return (
    <section className="bg-home-coral-soft py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal>
          <SectionHeading
            eyebrow={tradeSpotlight.eyebrow}
            title={tradeSpotlight.title}
            subtitle={tradeSpotlight.subtitle}
            align="center"
            className="mx-auto"
          />
        </Reveal>

        <Reveal delay={100} className="mx-auto mt-12 max-w-4xl">
          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(16,35,58,0.18)]">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-home-strong sm:aspect-[16/8]">
              {trade.image ? (
                <img
                  src={trade.image}
                  alt={trade.imageAlt ?? trade.label}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Icon name={trade.icon} className="text-7xl text-white/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-home-strong/85 via-home-strong/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">{trade.sector}</p>
                  <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">{trade.label}</p>
                </div>
                <Link
                  href={`/metiers/${trade.slug}`}
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-home-strong transition-colors hover:bg-white/90 sm:self-auto"
                >
                  {tradesCopy.cardCta}
                  <Icon name="arrow_forward" className="text-base rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {list.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setActive(index)}
                aria-label={item.label}
                aria-current={index === active}
                className={`h-2 rounded-full transition-all ${
                  index === active ? 'w-7 bg-home-coral' : 'w-2 bg-home-ink/20 hover:bg-home-ink/35'
                }`}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
