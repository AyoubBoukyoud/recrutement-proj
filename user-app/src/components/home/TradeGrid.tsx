'use client';

import Link from 'next/link';
import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';
import type { HomeContent } from '@/lib/homeContent';
import type { Trade } from '@/lib/trades';

const RECOGNITION_TONE: Record<Trade['recognition'], string> = {
  required: 'text-tertiary',
  recommended: 'text-secondary-dark',
  none: 'text-primary',
};

function TradeCard({ trade, copy }: { trade: Trade; copy: HomeContent['trades'] }) {
  return (
    <Link
      href={`/metiers/${trade.slug}`}
      className="group flex flex-col rounded-2xl border border-outline-variant bg-surface-lowest p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-floating focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
        <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden="true">
          {trade.icon}
        </span>
      </span>

      <h3 className="mt-4 text-base font-bold text-onSurface">{trade.label}</h3>
      <p className="mt-1 text-sm text-outline">{trade.sector}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-lg bg-gold px-2 py-0.5 text-xs font-extrabold text-onGold">
          {copy.levelPrefix} {trade.germanLevel}
        </span>
        <span className={`text-xs font-semibold ${RECOGNITION_TONE[trade.recognition]}`}>
          {copy.recognition[trade.recognition]}
        </span>
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
        {copy.cardCta}
        <span
          className="material-symbols-outlined transition-transform group-hover:translate-x-0.5"
          style={{ fontSize: 16 }}
          aria-hidden="true"
        >
          arrow_forward
        </span>
      </span>
    </Link>
  );
}

/**
 * Remplace la section « offres mises en avant » du brief : il n'existe pas
 * d'offres dans ce produit (docs/plan-home-recruitment.md §0). Un candidat qui
 * lit « Infirmier — B2 exigé, diplôme à faire reconnaître » apprend quelque
 * chose de vrai, ce qui construit la confiance mieux qu'une annonce fictive.
 *
 * Pas de carrousel horizontal : le visiteur doit pouvoir balayer la liste
 * entière du regard pour y trouver *son* métier.
 */
export function TradeGrid() {
  const { trades: copy } = useHomeContent();
  const { trades } = useTrades();

  return (
    <section id="metiers" className="scroll-mt-24 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-12">
        <h2 className="max-w-[20ch] text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-tight text-onSurface">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-[68ch] text-[1.0625rem] leading-relaxed text-onSurface-variant">{copy.subtitle}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trades.map((trade) => (
            <TradeCard key={trade.slug} trade={trade} copy={copy} />
          ))}
        </div>
      </div>
    </section>
  );
}
