'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { PrimaryCta } from './Cta';
import { TradeSearch } from './TradeSearch';

/**
 * Hero.
 *
 * Hauteur volontairement inférieure à 100vh : laisser dépasser le bandeau de
 * confiance amorce le défilement, là où un hero pleine hauteur laisse croire
 * que la page s'arrête là.
 *
 * En mobile l'ordre est imposé — titre, sous-titre, recherche, CTA, *puis*
 * visuel : une image en tête repousserait l'action sous la ligne de flottaison.
 */
export function HeroSection() {
  const { hero } = useHomeContent();
  return (
    <section className="relative overflow-hidden pt-20 sm:pt-28 lg:pt-36">
      {/* Fond : dégradé sobre + trame géométrique très discrète évoquant une
          trajectoire. Ni drapeau, ni mappemonde, ni poignée de main — ces trois
          clichés signalent « intermédiaire » et cassent le positionnement. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-lowest via-surface to-primary-light/25" />
        <svg className="absolute inset-0 h-full w-full text-primary opacity-[0.04]" aria-hidden="true">
          <defs>
            <pattern id="hero-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M56 0H0V56" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-12 px-6 pb-16 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pb-24">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-dark">
            {hero.eyebrow}
          </span>

          <h1 className="mt-4 text-[clamp(1.75rem,6.5vw,3.75rem)] font-extrabold leading-[1.08] tracking-tight text-primary-dark">
            {hero.headline[0]}
            <span className="block text-onSurface">{hero.headline[1]}</span>
          </h1>

          <p className="mt-4 max-w-[62ch] text-[0.9375rem] leading-relaxed text-onSurface-variant sm:text-[1.0625rem]">
            {hero.subheadline}
          </p>

          <TradeSearch className="mt-6 sm:mt-8" />

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
            <PrimaryCta href="/auth-phone" size="lg">
              {hero.cta}
            </PrimaryCta>
            <a
              href="#metiers"
              className="inline-flex items-center justify-center gap-1 rounded-xl px-2 py-3 text-sm font-bold text-primary underline-offset-4 hover:underline"
            >
              {hero.secondaryCta}
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                arrow_forward
              </span>
            </a>
          </div>

          <p className="mt-3 text-sm text-outline">{hero.microcopy}</p>
        </div>

        {/* Le visuel démontre le produit au lieu de le décrire : c'est le dossier
            tel qu'un recruteur le reçoit, monté avec les mêmes composants que
            l'application. À remplacer par une photographie en situation de
            travail + cette carte en superposition quand le shooting existera. */}
        <div className="lg:col-span-5 lg:pt-6">
          <div className="relative mx-auto max-w-sm">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/5 blur-2xl" aria-hidden="true" />
            <article className="rounded-[1.75rem] border border-outline-variant/60 bg-surface-lowest/90 p-6 shadow-floating backdrop-blur-sm">
              <header className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-outline">{hero.card.title}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                    verified_user
                  </span>
                </span>
              </header>

              <p className="mt-4 text-lg font-bold text-onSurface">{hero.card.name}</p>

              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-container p-3">
                  <dt className="text-xs font-semibold text-outline">{hero.card.levelLabel}</dt>
                  <dd className="mt-1 inline-flex items-center rounded-lg bg-gold px-2 py-0.5 text-sm font-extrabold text-onGold">
                    {hero.card.level}
                  </dd>
                </div>
                <div className="rounded-xl bg-surface-container p-3">
                  <dt className="text-xs font-semibold text-outline">{hero.card.availabilityLabel}</dt>
                  <dd className="mt-1 text-sm font-bold text-primary">{hero.card.availability}</dd>
                </div>
              </dl>

              <ul className="mt-3 flex flex-wrap gap-2">
                {hero.card.documents.map((document) => (
                  <li
                    key={document}
                    className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1 text-xs font-semibold text-onSurface-variant"
                  >
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 14 }} aria-hidden="true">
                      description
                    </span>
                    {document}
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-outline">{hero.card.footnote}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
