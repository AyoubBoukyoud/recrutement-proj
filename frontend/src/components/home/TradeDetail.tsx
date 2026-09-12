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
      <Link href="/accueil-public#sectors" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
        <span className="material-symbols-outlined text-base rtl:rotate-180" aria-hidden="true">
          arrow_back
        </span>
        {content.trades.title}
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shadow-sm">
          <span className="material-symbols-outlined text-[30px]" aria-hidden="true">
            {trade.icon}
          </span>
        </span>
        <div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 px-3 py-0.5 text-xs font-black uppercase text-emerald-800 dark:text-emerald-300">
            {trade.sector}
          </span>
          <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight text-emerald-950 dark:text-white">
            {copy.titlePattern.replace('{trade}', trade.label)}
          </h1>
        </div>
      </div>

      <p className="mt-6 text-lg leading-relaxed text-onSurface-variant dark:text-zinc-300">{trade.summary}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c1815] p-5 shadow-soft">
          <dt className="text-xs font-black uppercase tracking-wider text-outline dark:text-zinc-400">{copy.levelLabel}</dt>
          <dd className="mt-2 inline-flex items-center rounded-xl bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 px-3.5 py-1 text-lg font-black text-emerald-800 dark:text-emerald-300">
            {trade.germanLevel}
          </dd>
        </div>
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c1815] p-5 shadow-soft">
          <dt className="text-xs font-black uppercase tracking-wider text-outline dark:text-zinc-400">{copy.diplomaLabel}</dt>
          <dd className="mt-2 text-base font-bold text-onSurface dark:text-white">{content.trades.recognition[trade.recognition]}</dd>
        </div>
        {trade.salaryBand && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c1815] p-5 shadow-soft sm:col-span-2">
            <dt className="text-xs font-black uppercase tracking-wider text-outline dark:text-zinc-400">{copy.salaryLabel}</dt>
            <dd className="mt-2 text-base font-bold text-onSurface dark:text-white">{trade.salaryBand}</dd>
          </div>
        )}
      </dl>

      <section className="mt-10">
        <h2 className="text-xl font-black text-emerald-950 dark:text-white">{copy.requirementsTitle}</h2>
        <ul className="mt-4 space-y-3">
          {trade.requirements.map((requirement) => (
            <li key={requirement} className="flex gap-3 text-base leading-relaxed text-onSurface-variant dark:text-zinc-300">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400 text-lg" aria-hidden="true">
                check_circle
              </span>
              {requirement}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black text-emerald-950 dark:text-white">{copy.dossierTitle}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {trade.dossier.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c1815] p-4 text-sm font-bold text-onSurface dark:text-zinc-200 shadow-xs"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-[#1f1b18] p-4 text-sm text-onSurface-variant dark:text-zinc-300">{copy.disclaimer}</p>

      <div className="mt-10 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-10 text-center text-white shadow-floating">
        <h2 className="mx-auto max-w-[22ch] text-2xl font-black leading-tight">{copy.ctaTitle}</h2>
        <p className="mx-auto mt-3 max-w-[46ch] text-sm text-emerald-100/90 font-medium">{copy.ctaBody}</p>
        <PrimaryCta href="/auth-phone" size="lg" onDark className="mt-6">
          {content.hero.cta}
        </PrimaryCta>
      </div>

      <section className="mt-14 pb-20">
        <h2 className="text-xl font-black text-emerald-950 dark:text-white">{copy.othersTitle}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/metiers/${other.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c1815] p-4 text-sm font-bold text-onSurface dark:text-white hover:border-emerald-500/50 hover:shadow-soft transition-all"
              >
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl" aria-hidden="true">
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
