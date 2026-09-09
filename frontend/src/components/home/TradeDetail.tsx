'use client';

import Link from 'next/link';
import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';
import { PrimaryCta } from './Cta';

/**
 * Corps de la fiche métier.
 *
 * Séparé de la route pour une raison précise : la page reste un composant
 * serveur — elle porte les métadonnées et la génération statique des slugs —
 * tandis que le contenu, lui, doit suivre la langue choisie, qui n'existe que
 * côté client. Le slug est commun aux quatre langues, donc l'URL reste valide
 * quand le visiteur change de langue en cours de lecture.
 */
export function TradeDetail({ slug }: { slug: string }) {
  const content = useHomeContent();
  const { trades } = useTrades();

  const trade = trades.find((item) => item.slug === slug);
  if (!trade) return null;

  const copy = content.tradePage;
  const others = trades.filter((item) => item.slug !== trade.slug).slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 lg:px-12">
      <Link href="/accueil-public#sectors" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
          arrow_back
        </span>
        {content.trades.title}
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }} aria-hidden="true">
            {trade.icon}
          </span>
        </span>
        <div>
          <p className="text-sm font-semibold text-outline">{trade.sector}</p>
          <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight text-primary-dark">
            {copy.titlePattern.replace('{trade}', trade.label)}
          </h1>
        </div>
      </div>

      <p className="mt-6 text-[1.0625rem] leading-relaxed text-onSurface-variant">{trade.summary}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant bg-surface-lowest p-5 shadow-soft">
          <dt className="text-xs font-bold uppercase tracking-wider text-outline">{copy.levelLabel}</dt>
          <dd className="mt-2 inline-flex items-center rounded-lg bg-gold px-3 py-1 text-lg font-extrabold text-onGold">
            {trade.germanLevel}
          </dd>
        </div>
        <div className="rounded-2xl border border-outline-variant bg-surface-lowest p-5 shadow-soft">
          <dt className="text-xs font-bold uppercase tracking-wider text-outline">{copy.diplomaLabel}</dt>
          <dd className="mt-2 text-base font-bold text-onSurface">{content.trades.recognition[trade.recognition]}</dd>
        </div>
        {/* Affiché seulement si une fourchette a été sourcée et validée : un
            salaire inventé est exactement le genre de détail qui se vérifie en
            trente secondes et coûte la confiance du candidat. */}
        {trade.salaryBand && (
          <div className="rounded-2xl border border-outline-variant bg-surface-lowest p-5 shadow-soft sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-wider text-outline">{copy.salaryLabel}</dt>
            <dd className="mt-2 text-base font-bold text-onSurface">{trade.salaryBand}</dd>
          </div>
        )}
      </dl>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-onSurface">{copy.requirementsTitle}</h2>
        <ul className="mt-4 space-y-2.5">
          {trade.requirements.map((requirement) => (
            <li key={requirement} className="flex gap-3 text-[0.9375rem] leading-relaxed text-onSurface-variant">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-primary" style={{ fontSize: 18 }} aria-hidden="true">
                check_circle
              </span>
              {requirement}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-onSurface">{copy.dossierTitle}</h2>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {trade.dossier.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-outline-variant bg-surface-lowest p-4 text-sm font-medium text-onSurface"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 rounded-xl bg-surface-container p-4 text-sm text-onSurface-variant">{copy.disclaimer}</p>

      <div className="mt-10 rounded-[1.75rem] bg-primary px-6 py-10 text-center text-on-primary">
        <h2 className="mx-auto max-w-[22ch] text-2xl font-extrabold leading-tight">{copy.ctaTitle}</h2>
        <p className="mx-auto mt-3 max-w-[46ch] text-sm text-on-primary/85">{copy.ctaBody}</p>
        <PrimaryCta href="/auth-phone" size="lg" onDark className="mt-6">
          {content.hero.cta}
        </PrimaryCta>
      </div>

      <section className="mt-14 pb-20">
        <h2 className="text-xl font-extrabold text-onSurface">{copy.othersTitle}</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/metiers/${other.slug}`}
                className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-lowest p-4 text-sm font-semibold text-onSurface hover:border-primary/40"
              >
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }} aria-hidden="true">
                  {other.icon}
                </span>
                {other.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
