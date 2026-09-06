'use client';

import Link from 'next/link';
import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';
import { GhostCta, PrimaryCta } from './Cta';
import { Reveal, RevealNoScriptFallback } from './Reveal';
import { StoryVideo } from './StoryVideo';
import { JourneyTimeline } from './JourneyTimeline';
import { RecruiterPreview } from './RecruiterPreview';
import { TechPreview } from './TechPreview';
import { MobileActionBar } from './MobileActionBar';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

/**
 * En-tête de section : un seul traitement pour toute la page.
 *
 * L'ancienne version donnait à chaque section sa propre pastille colorée, ses
 * emojis et son dégradé — huit accents différents sur une même page se lisent
 * comme huit produits. Ici : une seule couleur d'accent, une seule graisse de
 * titre, un seul rythme vertical.
 */
function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'start',
  className = '',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'start' | 'center';
  className?: string;
}) {
  const centered = align === 'center';

  return (
    <div className={`${centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-primary-dark sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-onSurface-variant sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}

/**
 * Page d'accueil publique.
 *
 * Ordre des blocs repris de `docs/plan-home-recruitment.md` §2 : hero, bandeau
 * de confiance, comment ça marche (qui porte désormais la vidéo, §1.5 : la
 * vidéo est explicitement hors de la ligne de flottaison), ce que fait la
 * plateforme, ce qui rend un dossier crédible, métiers, parcours complet,
 * recruteurs, engagements, FAQ, CTA final.
 */
export function PublicHome() {
  const content = useHomeContent();
  const { trades } = useTrades();

  return (
    <main id="main-content" tabIndex={-1} className="force-light overflow-x-clip bg-surface text-onSurface outline-none">
      <RevealNoScriptFallback />

      {/* ----------------------------------------------------------------- */}
      {/* 1. HERO — l'objectif et la levée d'objection, rien d'autre         */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-outline-variant/50">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,98,102,0.10),transparent_65%)]" />

        <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:pb-28 lg:pt-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {content.hero.eyebrow}
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-primary-dark sm:text-5xl lg:text-[3.5rem]">
              {content.hero.headline[0]}
              <span className="block text-primary">{content.hero.headline[1]}</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-onSurface-variant">
              {content.hero.subheadline}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta href="/auth-phone" size="lg" className="shadow-floating">
                <span className="flex items-center gap-2">
                  <span>{content.hero.cta}</span>
                  <Icon name="arrow_forward" className="text-xl rtl:rotate-180" />
                </span>
              </PrimaryCta>
              <GhostCta href="/accueil-public#sectors" size="lg">
                {content.hero.secondaryCta}
              </GhostCta>
            </div>

            <p className="mt-5 text-sm font-medium text-outline">{content.hero.microcopy}</p>
          </Reveal>

          {/* Visuel + carte « dossier » : ce que le recruteur voit, en un coup d'œil */}
          <Reveal delay={120} className="relative">
            <div className="overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface-lowest shadow-floating">
              <img
                src="/assets/images/landing/candidate-profile-960.webp"
                srcSet="/assets/images/landing/candidate-profile-480.webp 480w, /assets/images/landing/candidate-profile-960.webp 960w"
                sizes="(min-width: 1024px) 560px, 100vw"
                alt={content.steps.imageAlt}
                width={960}
                height={640}
                fetchPriority="high"
                className="h-72 w-full object-cover sm:h-[26rem] lg:h-[30rem]"
              />
            </div>

            <div className="relative z-10 -mt-10 mx-4 rounded-2xl border border-outline-variant/60 bg-surface-lowest p-5 shadow-floating sm:mx-8 lg:absolute lg:-bottom-8 lg:-start-6 lg:mx-0 lg:mt-0 lg:w-72">
              <div className="flex items-start justify-between gap-3 border-b border-outline-variant/60 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {content.hero.card.title}
                  </p>
                  <p className="mt-1 text-lg font-bold text-primary-dark">{content.hero.card.name}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="folder_supervised" className="text-xl" />
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-medium text-outline">{content.hero.card.levelLabel}</dt>
                  <dd className="mt-0.5 text-base font-bold text-primary-dark">{content.hero.card.level}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-outline">{content.hero.card.availabilityLabel}</dt>
                  <dd className="mt-0.5 text-base font-bold text-primary-dark">{content.hero.card.availability}</dd>
                </div>
              </dl>

              <ul className="mt-4 flex flex-wrap gap-1.5">
                {content.hero.card.documents.map((document) => (
                  <li
                    key={document}
                    className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 text-xs font-semibold text-onSurface-variant"
                  >
                    <Icon name="check" className="text-sm text-primary" />
                    {document}
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-outline">{content.hero.card.footnote}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 2. BANDEAU DE CONFIANCE — les trois objections, avant l'argumentaire */}
      {/* ----------------------------------------------------------------- */}
      <section
        aria-label={content.trust.items.map((item) => item.label).join(', ')}
        className="border-b border-outline-variant/50 bg-surface-container/40"
      >
        <ul className="mx-auto grid max-w-[1280px] gap-4 px-6 py-6 sm:grid-cols-3 lg:px-12">
          {content.trust.items.map((item) => (
            <li key={item.label} className="flex items-center gap-3 text-sm font-medium text-onSurface-variant">
              <Icon name={item.icon} className="shrink-0 text-xl text-primary" />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. COMMENT ÇA MARCHE — vidéo de présentation + les quatre étapes    */}
      {/* ----------------------------------------------------------------- */}
      <section id="methodology" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
          <Reveal>
            <SectionHeading
              eyebrow={content.video.eyebrow}
              title={content.steps.title}
              subtitle={content.steps.subtitle}
              align="center"
            />
          </Reveal>

          <Reveal delay={80} className="mx-auto mt-12 max-w-4xl">
            <StoryVideo />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {content.steps.items.map((step, index) => (
              <Reveal key={step.title} delay={index * 70}>
                <article className="group flex h-full flex-col rounded-2xl border border-outline-variant/60 bg-surface-lowest p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={step.icon} className="text-2xl" />
                    </span>
                    <span aria-hidden="true" className="text-4xl font-bold leading-none text-primary/20">
                      {index + 1}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold leading-snug text-primary-dark">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{step.body}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120} className="mt-12 flex justify-center">
            <PrimaryCta href="/auth-phone" size="lg">
              <span className="flex items-center gap-2">
                <span>{content.steps.cta}</span>
                <Icon name="arrow_forward" className="text-lg rtl:rotate-180" />
              </span>
            </PrimaryCta>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 4. CE QUE FAIT LA PLATEFORME (3 fonctions, renvoi vers /produit)    */}
      {/* ----------------------------------------------------------------- */}
      <TechPreview />

      {/* ----------------------------------------------------------------- */}
      {/* 5. CE QUI REND UN DOSSIER CRÉDIBLE                                 */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-y border-outline-variant/50 bg-surface-container/40 py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1280px] items-start gap-12 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-12">
          <Reveal className="lg:sticky lg:top-24">
            <SectionHeading
              eyebrow={content.credible.eyebrow}
              title={content.credible.title}
              subtitle={content.credible.subtitle}
            />
            <img
              src="/assets/images/landing/training-skills-1440.webp"
              srcSet="/assets/images/landing/training-skills-720.webp 720w, /assets/images/landing/training-skills-1440.webp 1440w"
              sizes="(min-width: 1024px) 480px, 100vw"
              alt={content.credible.imageAlt}
              loading="lazy"
              className="mt-10 w-full rounded-2xl border border-outline-variant/60 object-cover shadow-soft"
            />
          </Reveal>

          <ul className="grid gap-4">
            {content.credible.items.map((item, index) => (
              <li key={item.title}>
                <Reveal
                  delay={index * 60}
                  className="flex gap-5 rounded-2xl border border-outline-variant/60 bg-surface-lowest p-6 transition-shadow hover:shadow-soft"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={item.icon} className="text-2xl" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-primary-dark">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{item.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 6. MÉTIERS EN TENSION — le visiteur doit voir *son* métier écrit    */}
      {/* ----------------------------------------------------------------- */}
      <section id="sectors" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
          <Reveal>
            <SectionHeading
              eyebrow={content.trades.eyebrow}
              title={content.trades.title}
              subtitle={content.trades.subtitle}
            />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {trades.map((trade, index) => (
              <Reveal key={trade.slug} delay={index * 50}>
                <Link
                  href={`/metiers/${trade.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-outline-variant/60 bg-surface-lowest p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={trade.icon} className="text-2xl" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-outline">
                      {trade.sector}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold leading-snug text-primary-dark transition-colors group-hover:text-primary">
                    {trade.label}
                  </h3>

                  <dl className="mb-6 mt-4 space-y-1.5 text-sm text-onSurface-variant">
                    <div className="flex items-center gap-2">
                      <dt className="sr-only">{content.trades.levelPrefix}</dt>
                      <Icon name="translate" className="text-base text-outline" />
                      <dd className="font-semibold text-onSurface">
                        {content.trades.levelPrefix} {trade.germanLevel}
                      </dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="verified_user" className="mt-0.5 text-base text-outline" />
                      <dd>
                        {trade.recognition === 'required'
                          ? content.trades.recognition.required
                          : trade.recognition === 'recommended'
                            ? content.trades.recognition.recommended
                            : content.trades.recognition.none}
                      </dd>
                    </div>
                  </dl>

                  <span className="mt-auto inline-flex items-center gap-1.5 border-t border-outline-variant/50 pt-4 text-sm font-semibold text-primary">
                    {content.trades.cardCta}
                    <Icon
                      name="arrow_forward"
                      className="text-base transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 7. LE PARCOURS COMPLET, DU MAROC À L'ALLEMAGNE                     */}
      {/* ----------------------------------------------------------------- */}
      <JourneyTimeline />

      {/* ----------------------------------------------------------------- */}
      {/* 8. SECTION RECRUTEURS — rupture visuelle nette (plan §2.8)         */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-primary-dark py-20 text-surface-lowest lg:py-28">
        <img
          src="/assets/images/landing/recruitment-company-1440.webp"
          srcSet="/assets/images/landing/recruitment-company-720.webp 720w, /assets/images/landing/recruitment-company-1440.webp 1440w"
          sizes="100vw"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[center_25%] opacity-[0.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/95 to-primary-dark/75" />

        <div className="relative mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-12">
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">
                {content.recruiter.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {content.recruiter.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-surface-container-high sm:text-lg">
                {content.recruiter.subtitle}
              </p>

              <ul className="mt-10 grid gap-6">
                {content.recruiter.points.map((point) => (
                  <li key={point.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-lowest/10 text-primary-light">
                      <Icon name={point.icon} className="text-xl" />
                    </span>
                    <div>
                      <h3 className="font-bold text-white">{point.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-surface-container-high">{point.body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <PrimaryCta href="/auth-phone?intent=recruiter" size="lg" onDark>
                  {content.recruiter.cta}
                </PrimaryCta>
                <GhostCta href="/employeurs" size="lg" onDark>
                  {content.recruiter.secondaryCta}
                </GhostCta>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="lg:pt-4">
            <RecruiterPreview />
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 9. ENGAGEMENTS VÉRIFIABLES (à la place de chiffres — plan §7.3)     */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
          <Reveal>
            <SectionHeading
              eyebrow={content.proof.eyebrow}
              title={content.proof.title}
              subtitle={content.proof.subtitle}
              align="center"
            />
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {content.proof.items.map((item, index) => (
              <Reveal key={item.title} delay={index * 70}>
                <article className="h-full rounded-2xl border border-outline-variant/60 bg-surface-lowest p-6 transition-shadow hover:shadow-soft">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={item.icon} className="text-2xl" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-primary-dark">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 10. FAQ — un seul panneau ouvert à la fois (plan §2.9)             */}
      {/* ----------------------------------------------------------------- */}
      <section id="faq" className="scroll-mt-20 border-y border-outline-variant/50 bg-surface-container/40 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <SectionHeading title={content.faq.title} subtitle={content.faq.subtitle} align="center" />
          </Reveal>

          <div className="mt-12 space-y-3">
            {content.faq.items.map((item, index) => (
              <Reveal key={item.question} delay={index * 40}>
                <details
                  name="home-faq"
                  open={index === 0}
                  className="group rounded-2xl border border-outline-variant/60 bg-surface-lowest px-5 py-4 transition-colors open:border-primary/40 sm:px-6"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-primary-dark">
                    <span>{item.question}</span>
                    <Icon
                      name="expand_more"
                      className="shrink-0 text-2xl text-primary transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 border-t border-outline-variant/50 pt-3 text-sm leading-relaxed text-onSurface-variant sm:text-base">
                    {item.answer}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 11. CTA FINAL — bloc mono-action (plan §2.10)                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,98,102,0.10),transparent_70%)]" />

        <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">
          <div className="grid items-center gap-10 overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface-lowest p-8 shadow-soft sm:p-12 lg:grid-cols-2 lg:gap-16">
            <Reveal className="order-last lg:order-first">
              <img
                src="/assets/images/landing/career-success-960.webp"
                srcSet="/assets/images/landing/career-success-480.webp 480w, /assets/images/landing/career-success-960.webp 960w"
                sizes="(min-width: 1024px) 460px, 100vw"
                alt={content.finalCta.imageAlt}
                loading="lazy"
                className="h-64 w-full rounded-2xl object-cover object-top sm:h-80 lg:h-[22rem]"
              />
            </Reveal>

            <Reveal delay={100}>
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-primary-dark sm:text-4xl">
                {content.finalCta.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-onSurface-variant sm:text-lg">
                {content.finalCta.subtitle}
              </p>

              <div className="mt-8">
                <PrimaryCta href="/auth-phone" size="lg" className="shadow-floating">
                  <span className="flex items-center gap-2">
                    <span>{content.finalCta.cta}</span>
                    <Icon name="arrow_forward" className="text-xl rtl:rotate-180" />
                  </span>
                </PrimaryCta>
              </div>

              <p className="mt-5 text-sm text-outline">{content.finalCta.microcopy}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <MobileActionBar />
    </main>
  );
}
