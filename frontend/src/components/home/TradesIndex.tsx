'use client';

import Link from 'next/link';
import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';

/**
 * Corps de `/metiers` : tous les métiers, groupés par secteur. La fiche d'un
 * métier ne propose que quatre autres métiers ; sans cet index, les autres
 * n'étaient joignables que par le sitemap.
 */
export function TradesIndex() {
  const { trades, sectors } = useTrades();
  const copy = useHomeContent().trades;

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-20 pt-8 lg:px-12">
      <p className="text-xs font-black uppercase tracking-wider text-home-coral-dark">{copy.eyebrow}</p>
      <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight text-onSurface">{copy.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-onSurface-variant">{copy.subtitle}</p>

      {sectors.map((sector) => {
        const inSector = trades.filter((trade) => trade.sector === sector);
        if (inSector.length === 0) return null;

        return (
          <section key={sector} className="mt-10" aria-labelledby={`sector-${sector}`}>
            <h2 id={`sector-${sector}`} className="text-xl font-black text-onSurface">{sector}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {inSector.map((trade) => (
                <li key={trade.slug}>
                  <Link
                    href={`/metiers/${trade.slug}`}
                    className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-lowest p-4 text-sm font-bold text-onSurface transition-all hover:border-home-coral/50 hover:shadow-soft"
                  >
                    <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">
                      {trade.icon}
                    </span>
                    <span className="flex-1">
                      {trade.label}
                      <span className="block text-xs font-medium text-onSurface-variant">
                        {copy.levelPrefix} {trade.germanLevel}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-base text-onSurface-variant rtl:rotate-180" aria-hidden="true">
                      arrow_forward
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
