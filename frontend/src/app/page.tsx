import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/home/SiteFooter';
import { Reveal, RevealNoScriptFallback } from '@/components/home/Reveal';

export const metadata: Metadata = {
  title: 'Travailler en Allemagne — Amud Skills',
  description:
    "Un pipeline de talents vérifié par IA, connectant les professionnels marocains aux entreprises allemandes. Conforme RGPD, transparent, pensé pour la croissance mutuelle.",
};

/**
 * Page d'accueil publique.
 *
 * Contenu porté depuis la maquette "The Professional Bridge" (voir
 * `/amud/marketing/home` pour la version isolée d'origine). `SiteHeader` /
 * `SiteFooter` restent les composants réels — partagés avec `/metiers/[slug]`
 * — le reste de la page est le contenu de la maquette.
 */
const SECTORS = [
  {
    key: 'btp',
    span: true,
    icon: 'construction',
    title: 'BTP & Engineering',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAw4vlnE3XDHPJrp9WNEeysG38OPgcDkyc3wfzraMK-Z4OYKHdLmlQSnlClka3sVxzQBi1Q42BuMHEGHDpnu1n5Wvbqv2LNUyUs1P9sQ6KY4B1psOcGdA70ja-RDetIxhNwsUcSRp1ngkT16u1eth8WUN7Ujgl5ZhCO_C1iv1V6jdkNOPcpgpp87e1PVZLeqYLfmSQGZd0bDjy7sUu-4u9ZknCGduirn-PrEb7zGQFQyI9HAOMWsPAn',
    alt: 'Chantier de construction moderne en Allemagne, grues et structures métalliques.',
  },
  { key: 'sante', span: false, icon: 'local_hospital', title: 'Santé', subtitle: 'Healthcare Professionals' },
  { key: 'logistique', span: false, icon: 'local_shipping', title: 'Logistique', subtitle: 'Supply Chain Experts' },
  {
    key: 'gastro',
    span: true,
    icon: 'restaurant',
    title: 'Gastronomie',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD3GYSnVz36JrmTvbc2AAIvo7ajMZm8l9t114RQ_1adRua64ugXRDYfatxORztuLMhDwtM70hDFSC6RBSmLouATITmLqPUEkIUIjW-8LTb5lfdiYLmDVfKPzbh2GccVBO0PSKtbD2MOAw4SHfu9WrKcdrTOqCUtjHxGgON59YewGOrz7rvdlH5o8-o9aW06od04Em6OhejNrS12iD7y8tDj2b-kXILQl0tEDAFHlEOjAwmeWa3X3sBz',
    alt: 'Cuisine professionnelle allemande haut de gamme, chefs au travail.',
  },
];

const METHODOLOGY = [
  { step: 1, title: 'Sourcing & Pre-screening', desc: 'Targeted outreach within the Moroccan talent pool.' },
  { step: 2, title: 'AI Verification', desc: 'Automated skills assessment and language proficiency checks.', raised: true },
  { step: 3, title: 'Cultural Alignment', desc: 'German workplace integration training.' },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="overflow-x-hidden bg-amud-background text-amud-on-background">
        <RevealNoScriptFallback />
        {/* Hero */}
        <header className="relative overflow-hidden bg-amud-surface-container-low pb-24 pt-20 sm:pt-28 md:pb-32 lg:pt-36">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(27, 94, 55, 0.1) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative z-10 mx-auto max-w-container-max px-margin-mobile md:px-gutter">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="flex flex-col items-start space-y-6">
                <h1 className="max-w-2xl text-headline-lg-mobile leading-tight text-amud-on-surface md:text-display-lg">
                  Le pont entre le talent marocain et les besoins allemands.
                </h1>
                <p className="max-w-xl text-body-lg text-amud-on-surface-variant">
                  Un pipeline de talents rigoureux et vérifié par IA, connectant des professionnels marocains hautement
                  qualifiés aux plus grandes industries allemandes. Conforme, transparent, et construit pour une
                  croissance mutuelle.
                </p>
                <div className="flex w-full flex-col gap-4 pt-4 sm:w-auto sm:flex-row">
                  <Link
                    href="/employeurs"
                    className="flex items-center justify-center gap-2 rounded-lg bg-amud-primary px-8 py-3 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-container"
                  >
                    I am an Employer
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </Link>
                  <Link
                    href="/produit"
                    className="flex items-center justify-center gap-2 rounded-lg border border-amud-outline bg-transparent px-8 py-3 text-label-md font-medium text-amud-primary transition-colors hover:bg-amud-primary/10"
                  >
                    I am a Candidate
                    <span className="material-symbols-outlined text-xl">person_add</span>
                  </Link>
                </div>
              </div>
              <div className="relative h-[400px] w-full overflow-hidden rounded-lg border border-amud-outline-variant shadow-lg">
                <img
                  className="h-full w-full object-cover"
                  alt="Équipe collaborant dans un bureau moderne en Allemagne."
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoWwClZkQ6Mxq08f8pNDrH-gsQ2QajA6R6Dmd3G7ecSHybwxzZRXuxU0e8pvi4dYRUHv8qcZRLHfsPcUqaGYdvtnLO4RAOEN13gDr8nZPmyzhiWqSRnwN6uG8Vq9OxBYpVF4WgmUe3tb6A4LELT2M-TncB4g1Gzr9fESktFxXh8iNjRazpgjSmEcxKlh3OWqhUJKa_1XU7u4vuuDH9Da5nvDkAeMtb26oO2pwZcdXLixJt3E6tfzu0"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Trust banner */}
        <div className="border-b border-amud-surface-dim bg-amud-surface-container-highest py-6">
          <div className="mx-auto flex max-w-container-max flex-wrap items-center justify-center gap-8 px-margin-mobile md:justify-between md:px-gutter">
            {[
              { icon: 'verified_user', title: '300+ Profiles', sub: 'Vetted & Ready' },
              { icon: 'shield', title: '100% GDPR Compliant', sub: 'Data Security Guaranteed' },
              { icon: 'smartphone', title: 'Mobile-First Approach', sub: 'Accessible Everywhere' },
            ].map((i, idx) => (
              <Reveal key={i.title} delay={idx * 80}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined fill text-2xl text-amud-primary">{i.icon}</span>
                  <div>
                    <p className="text-body-md font-bold text-amud-on-surface">{i.title}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">{i.sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="space-y-section-gap bg-amud-background py-section-gap">
          {/* Problem / Solution */}
          <section className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm md:grid-cols-2">
              <Reveal className="h-full">
                <div className="h-full border-b border-amud-outline-variant bg-amud-surface-container-low/50 p-12 md:border-b-0 md:border-r">
                  <span className="material-symbols-outlined mb-6 text-4xl text-amud-error">trending_down</span>
                  <h2 className="mb-4 text-headline-lg text-amud-on-surface">The Challenge</h2>
                  <p className="text-body-md text-amud-on-surface-variant">
                    L&apos;Allemagne fait face à une pénurie de main-d&apos;œuvre qualifiée sans précédent. Des secteurs
                    critiques sont freinés par un manque de personnel qualifié, ralentissant l&apos;élan économique et
                    mettant les équipes existantes sous tension.
                  </p>
                </div>
              </Reveal>
              <Reveal className="h-full" delay={120}>
                <div className="relative h-full overflow-hidden bg-amud-primary-container/20 p-12">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(27, 94, 55, 0.1) 1px, transparent 0)',
                      backgroundSize: '24px 24px',
                    }}
                  />
                  <div className="relative z-10">
                    <span className="material-symbols-outlined fill mb-6 text-4xl text-amud-primary">handshake</span>
                    <h2 className="mb-4 text-headline-lg text-amud-on-surface">The Solution</h2>
                    <p className="text-body-md text-amud-on-surface-variant">
                      Le Maroc offre un vivier de talents profond, jeune et motivé. Amud Skills comble cet écart avec la
                      précision structurelle allemande, garantissant un alignement culturel et professionnel dès le
                      premier jour.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* Sectors */}
          <section id="sectors" className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
            <Reveal className="mb-12 text-center">
              <h2 className="text-headline-lg text-amud-on-surface">4 Strategic Sectors</h2>
              <p className="mt-2 text-body-md text-amud-on-surface-variant">Focused recruitment for critical German industries.</p>
            </Reveal>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {SECTORS.map((s, idx) =>
                s.image ? (
                  <Reveal key={s.key} className={s.span ? 'md:col-span-2' : ''} delay={idx * 80}>
                    <div className="group relative h-64 cursor-pointer overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest transition-all hover:shadow-md">
                      <div className="absolute inset-0 z-10 bg-gradient-to-r from-amud-surface-tint/90 to-transparent" />
                      <img className="absolute inset-0 h-full w-full object-cover" alt={s.alt} src={s.image} />
                      <div className="relative z-20 flex h-full flex-col justify-end p-8">
                        <span className="material-symbols-outlined mb-2 text-3xl text-white">{s.icon}</span>
                        <h3 className="text-headline-md text-white">{s.title}</h3>
                      </div>
                    </div>
                  </Reveal>
                ) : (
                  <Reveal key={s.key} delay={idx * 80}>
                    <div className="group flex h-64 cursor-pointer flex-col justify-between rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-8 transition-all hover:shadow-md">
                      <span className="material-symbols-outlined text-4xl text-amud-primary">{s.icon}</span>
                      <div>
                        <h3 className="text-headline-md text-amud-on-surface">{s.title}</h3>
                        <p className="mt-1 text-label-sm text-amud-on-surface-variant">{s.subtitle}</p>
                      </div>
                    </div>
                  </Reveal>
                )
              )}
            </div>
          </section>

          {/* Methodology */}
          <section id="methodology" className="relative overflow-hidden border-y border-amud-surface-dim bg-amud-surface-container-low py-20">
            <div className="relative z-10 mx-auto max-w-container-max px-margin-mobile md:px-gutter">
              <Reveal className="mb-12 max-w-2xl">
                <h2 className="text-headline-lg text-amud-on-surface">AI-Verified Precision Pipeline</h2>
                <p className="mt-4 text-body-md text-amud-on-surface-variant">
                  Notre méthodologie propriétaire &laquo;&nbsp;Bridge&nbsp;&raquo; garantit que chaque candidat répond
                  aux standards allemands stricts avant présentation.
                </p>
              </Reveal>
              <div className="relative flex flex-col justify-between gap-8 md:flex-row">
                <div className="absolute left-0 top-1/2 z-0 hidden h-1 w-full -translate-y-1/2 bg-amud-surface-dim md:block" />
                {METHODOLOGY.map((m, idx) => (
                  <Reveal key={m.step} className="relative z-10 h-full flex-1" delay={idx * 100}>
                    <div
                      className={`h-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-6 ${
                        m.raised ? 'shadow-md md:-translate-y-4' : 'shadow-sm'
                      }`}
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amud-primary text-headline-md text-white">
                        {m.step}
                      </div>
                      <h4 className="mb-2 font-bold text-amud-on-surface">{m.title}</h4>
                      <p className="text-label-sm text-amud-on-surface-variant">{m.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
