'use client';

import Link from 'next/link';
import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';
import { PrimaryCta } from './Cta';

/**
 * Corps de la fiche métier.
 */
export function TradeDetail({ slug }: { slug: string }) {
  const content = useHomeContent();
  const { trades } = useTrades();

  const trade = trades.find((item) => item.slug === slug);
  if (!trade) return null;

  const copy = content.tradePage;
  const others = trades.filter((item) => item.slug !== trade.slug).slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 lg:px-12 pt-8">
      <Link href="/#metiers" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
        <span className="material-symbols-outlined text-base rtl:rotate-180" aria-hidden="true">
          arrow_back
        </span>
        {content.trades.title}
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-home-coral-soft text-primary shadow-sm">
          <span className="material-symbols-outlined text-[30px]" aria-hidden="true">
            {trade.icon}
          </span>
        </span>
        <div>
          <span className="rounded-full border border-home-coral/25 bg-home-coral-soft px-3 py-0.5 text-xs font-black uppercase text-home-coral-dark">
            {trade.sector}
          </span>
          <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight text-onSurface">
            {copy.titlePattern.replace('{trade}', trade.label)}
          </h1>
        </div>
      </div>

      <p className="mt-6 text-lg leading-relaxed text-onSurface-variant">{trade.summary}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-outline-variant bg-surface-lowest p-5 shadow-soft">
          <dt className="text-xs font-black uppercase tracking-wider text-onSurface-variant">{copy.levelLabel}</dt>
          <dd className="mt-2 inline-flex items-center rounded-xl border border-home-coral/25 bg-home-coral-soft px-3.5 py-1 text-lg font-black text-home-coral-dark">
            {trade.germanLevel}
          </dd>
        </div>
        <div className="rounded-3xl border border-outline-variant bg-surface-lowest p-5 shadow-soft">
          <dt className="text-xs font-black uppercase tracking-wider text-onSurface-variant">{copy.diplomaLabel}</dt>
          <dd className="mt-2 text-base font-bold text-onSurface">{content.trades.recognition[trade.recognition]}</dd>
        </div>
        {trade.salaryBand && (
          <div className="rounded-3xl border border-outline-variant bg-surface-lowest p-5 shadow-soft sm:col-span-2">
            <dt className="text-xs font-black uppercase tracking-wider text-onSurface-variant">{copy.salaryLabel}</dt>
            <dd className="mt-2 text-base font-bold text-onSurface">{trade.salaryBand}</dd>
          </div>
        )}
      </dl>

      <section className="mt-10">
        <h2 className="text-xl font-black text-onSurface">{copy.requirementsTitle}</h2>
        <ul className="mt-4 space-y-3">
          {trade.requirements.map((requirement) => (
            <li key={requirement} className="flex gap-3 text-base leading-relaxed text-onSurface-variant">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-primary text-lg" aria-hidden="true">
                check_circle
              </span>
              {requirement}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black text-onSurface">{copy.dossierTitle}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {trade.dossier.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-outline-variant bg-surface-lowest p-4 text-sm font-bold text-onSurface shadow-xs"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 rounded-2xl border border-outline-variant bg-surface-low p-4 text-sm text-onSurface-variant">{copy.disclaimer}</p>

      <div className="mt-10 rounded-3xl bg-home-strong px-6 py-10 text-center text-white shadow-floating">
        <h2 className="mx-auto max-w-[22ch] text-2xl font-black leading-tight">{copy.ctaTitle}</h2>
        <p className="mx-auto mt-3 max-w-[46ch] text-sm text-white/80 font-medium">{copy.ctaBody}</p>
        <PrimaryCta href="/auth-phone" size="lg" onDark className="mt-6">
          {content.hero.cta}
        </PrimaryCta>
      </div>

      <section className="mt-14 pb-20">
        <h2 className="text-xl font-black text-onSurface">{copy.othersTitle}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/metiers/${other.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-lowest p-4 text-sm font-bold text-onSurface hover:border-home-coral/50 hover:shadow-soft transition-all"
              >
                <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">
                  {other.icon}
                </span>
                <span>{other.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
