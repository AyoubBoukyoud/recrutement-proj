import Link from 'next/link';
import { getSeoPage, type SeoFaq, type SeoPage } from '@/lib/seoPages';
import { SITE_URL } from '@/lib/site';
import { LandingScrollReveal } from '@/components/reference-landing/LandingMotion';

const levelLabels = ['Aucun', 'A1', 'A2', 'B1', 'B2', 'C1+'];

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function faqSchema(faqs: SeoFaq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question', name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

export function SeoLandingPage({ page }: { page: SeoPage }) {
  const sections = [
    ['Opportunités disponibles', page.opportunity],
    ['Profil recherché', page.profile],
    ['Expérience professionnelle', page.experience],
    ['Diplômes, permis et qualifications', page.qualification],
  ];
  const breadcrumbs = [
    { name: 'Accueil', item: SITE_URL },
    { name: 'Emploi en Allemagne', item: `${SITE_URL}/emploi-allemagne-maroc` },
    { name: page.h1, item: `${SITE_URL}/${page.slug}` },
  ];
  const breadcrumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map(({ name, item }, index) => ({
      '@type': 'ListItem', position: index + 1, name, item,
    })),
  };

  return (
    <main id="main-content" className="min-h-screen bg-home-sand text-home-ink" data-landing-motion-scope>
      <LandingScrollReveal/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema(page.faqs)) }} />
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-5 sm:px-8 lg:px-12">
        <nav aria-label="Fil d’Ariane" className="text-sm text-home-slate">
          <ol className="flex flex-wrap gap-2">
            <li><Link href="/" className="underline-offset-4 hover:underline">Accueil</Link></li><li aria-hidden="true">/</li>
            <li><Link href="/emploi-allemagne-maroc" className="underline-offset-4 hover:underline">Emploi en Allemagne</Link></li><li aria-hidden="true">/</li>
            <li aria-current="page">{page.keyword}</li>
          </ol>
        </nav>

        <section className="mt-8 rounded-[2rem] bg-home-strong px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14" aria-labelledby="seo-title">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/70">AMUD SKILLS · TALENTS MAROCAINS & EMPLOYEURS EN ALLEMAGNE</p>
          <h1 id="seo-title" className="mt-5 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{page.h1}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/80 sm:text-lg">{page.intro}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/offres" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-home-coral px-6 py-3 font-bold text-white transition hover:brightness-105">Voir les offres disponibles</Link>
            <Link href="/auth-phone" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 px-6 py-3 font-bold text-white transition hover:bg-white/10">Créer mon profil gratuitement</Link>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Informations sur les opportunités">
          {sections.map(([heading, body]) => (
            <article key={heading} className="rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8">
              <h2 className="text-xl font-bold">{heading}</h2>
              <p className="mt-3 leading-7 text-home-slate">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8" aria-labelledby="german-levels">
          <h2 id="german-levels" className="text-xl font-bold">Niveau d’allemand : une caractéristique de votre profil</h2>
          <p className="mt-2 max-w-3xl leading-7 text-home-slate">Les attentes varient selon le métier, l’employeur, les échanges avec le public et les règles professionnelles. Déclarez votre niveau avec précision.</p>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Niveaux de langue">
            {levelLabels.map((level) => <li key={level}><span className="inline-flex rounded-full border border-home-line bg-home-sand px-4 py-2 text-sm font-bold">{level}</span></li>)}
          </ul>
          <p className="mt-5 leading-7 text-home-slate">Les professions réglementées peuvent prévoir des exigences de qualification ou de langue propres à leur autorité compétente. Consultez les <a className="font-semibold text-home-coral underline underline-offset-4" href="https://www.anerkennung-in-deutschland.de/html/en/pro/professional-recognition.php" target="_blank" rel="noreferrer">informations officielles sur la reconnaissance professionnelle</a>.</p>
        </section>

        <section className="mt-10 rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8" aria-labelledby="conditions">
          <h2 id="conditions" className="text-xl font-bold">Salaire et conditions de travail</h2>
          <p className="mt-3 leading-7 text-home-slate">{page.conditions}</p>
        </section>

        <section className="mt-10 rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8" aria-labelledby="process">
          <h2 id="process" className="text-xl font-bold">Les étapes pour préparer votre candidature</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            <li className="rounded-xl bg-home-sand p-5"><span className="font-bold text-home-coral">01 · Profil</span><p className="mt-2 leading-6 text-home-slate">Renseignez compétences, langues, expériences et qualifications.</p></li>
            <li className="rounded-xl bg-home-sand p-5"><span className="font-bold text-home-coral">02 · CV</span><p className="mt-2 leading-6 text-home-slate">Préparez un CV lisible, chronologique et adapté au poste visé.</p></li>
            <li className="rounded-xl bg-home-sand p-5"><span className="font-bold text-home-coral">03 · Échange</span><p className="mt-2 leading-6 text-home-slate">Vérifiez les missions et conditions avec l’employeur avant tout engagement.</p></li>
          </ol>
          <p className="mt-5 leading-7 text-home-slate">Amud Skills facilite la mise en relation. La plateforme ne garantit ni embauche, ni contrat, ni visa.</p>
        </section>

        <section className="mt-10 rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8" aria-labelledby="german-cv">
          <h2 id="german-cv" className="text-xl font-bold">Préparer un CV adapté à une candidature en Allemagne</h2>
          <ul className="mt-4 list-disc space-y-2 ps-5 leading-7 text-home-slate">
            <li>Présentez vos expériences de la plus récente à la plus ancienne, avec des dates et intitulés cohérents.</li>
            <li>Décrivez les missions, outils et responsabilités avec des exemples concrets plutôt qu’une liste générale de qualités.</li>
            <li>Indiquez distinctement les langues et votre niveau réel; expliquez les diplômes et permis avec leur appellation exacte.</li>
            <li>Adaptez le CV aux critères de l’offre et ne joignez que des documents demandés par un interlocuteur vérifié.</li>
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-2xl font-bold">Questions fréquentes</h2>
          <div className="mt-4 space-y-3">{page.faqs.map(({ question, answer }) => (
            <details key={question} className="group rounded-xl border border-home-line bg-home-surface p-5">
              <summary className="cursor-pointer list-none font-bold marker:hidden">{question}<span className="float-end text-home-coral" aria-hidden="true">＋</span></summary>
              <p className="mt-3 max-w-4xl leading-7 text-home-slate">{answer}</p>
            </details>
          ))}</div>
        </section>

        <nav className="mt-10 rounded-2xl bg-home-coral-soft p-6 sm:p-8" aria-labelledby="related-title">
          <h2 id="related-title" className="text-xl font-bold">Guides et métiers associés</h2>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3">{page.related.map((slug) => (
            <li key={slug}><Link href={`/${slug}`} className="font-semibold text-home-coral-dark underline decoration-home-coral/35 underline-offset-4 hover:decoration-home-coral">{getSeoPage(slug)?.title.replace(/\s\|\sAmud Skills$/, '') ?? slug.replaceAll('-', ' ')}</Link></li>
          ))}</ul>
        </nav>
        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl bg-home-strong p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div><h2 className="text-2xl font-bold">Prêt à valoriser votre parcours ?</h2><p className="mt-2 text-white/75">Créez votre profil et présentez vos compétences aux employeurs.</p></div>
          <Link href="/auth-phone" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-home-coral px-6 py-3 font-bold text-white">Créer mon profil</Link>
        </div>
      </div>
    </main>
  );
}

export function TrustContentPage({ page }: { page: (typeof import('@/lib/seoPages'))['TRUST_PAGES'][number] }) {
  const json = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: page.h1, item: `${SITE_URL}/${page.slug}` },
    ],
  };
  return <main id="main-content" className="min-h-screen bg-home-sand text-home-ink" data-landing-motion-scope>
    <LandingScrollReveal/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(json) }} />
    <article className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:py-20">
      <nav aria-label="Fil d’Ariane" className="text-sm text-home-slate"><Link href="/" className="underline">Accueil</Link> / {page.h1}</nav>
      <h1 className="mt-8 text-3xl font-bold sm:text-4xl">{page.h1}</h1>
      <p className="mt-5 text-lg leading-8 text-home-slate">{page.intro}</p>
      <div className="mt-9 space-y-5">{page.sections.map(([heading, body]) => <section key={heading} className="rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8"><h2 className="text-xl font-bold">{heading}</h2><p className="mt-3 leading-7 text-home-slate">{body}</p></section>)}</div>
      <p className="mt-8 text-sm leading-6 text-home-slate">Amud Skills facilite la mise en relation professionnelle. Les décisions de recrutement et les démarches administratives relèvent des employeurs et autorités compétentes.</p>
      {page.slug === 'contact' && <Link href="/notre-entreprise#demander-un-devis" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-home-coral px-6 py-3 font-bold text-white">{page.title.startsWith('Contacter') ? 'Ouvrir le formulaire de contact' : 'Nous écrire'}</Link>}
    </article>
  </main>;
}
