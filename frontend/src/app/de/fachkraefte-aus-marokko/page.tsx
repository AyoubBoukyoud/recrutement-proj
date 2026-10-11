import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Fachkräfte aus Marokko rekrutieren | Amud Skills',
  description: 'Amud Skills unterstützt deutsche Unternehmen bei der Vorauswahl und Vermittlung marokkanischer Talente für technische, logistische und weitere Berufsfelder.',
  alternates: { canonical: '/de/fachkraefte-aus-marokko' },
  openGraph: { title: 'Qualifizierte Fachkräfte aus Marokko | Amud Skills', description: 'Marokkanische Talente kennenlernen und passende Profile für Ihr Unternehmen anfragen.', url: '/de/fachkraefte-aus-marokko', siteName: 'Amud Skills', locale: 'de_DE', type: 'article' },
  twitter: { card: 'summary', title: 'Fachkräfte aus Marokko | Amud Skills', description: 'Marokkanische Talente für deutsche Unternehmen.' },
};

const sectors = ['Logistik und Transport', 'Hotellerie und Gastronomie', 'Gesundheitswesen und Pflege', 'Bau und Handwerk', 'Industrie und Instandhaltung', 'Technik und IT'];
const steps = [
  ['Bedarf klären', 'Sie beschreiben Aufgaben, Einsatzort, Qualifikation, Sprache und Rahmenbedingungen der Stelle.'],
  ['Profile vorauswählen', 'Amud Skills strukturiert Kandidatenprofile nach den besprochenen Kriterien. Eine Vorauswahl ersetzt nicht Ihre eigene Prüfung.'],
  ['Kennenlernen', 'Sie führen Gespräche und prüfen fachliche Eignung, Motivation und die konkreten Arbeitsbedingungen.'],
  ['Nächste Schritte abstimmen', 'Anerkennung, Beschäftigung und Aufenthalt werden abhängig vom Beruf und Einzelfall mit den zuständigen Stellen geprüft.'],
];

export default function GermanEmployerPage() {
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Startseite', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Fachkräfte aus Marokko', item: `${SITE_URL}/de/fachkraefte-aus-marokko` },
  ] };
  return <main id="main-content" lang="de" className="min-h-screen bg-home-sand text-home-ink">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }} />
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-20">
      <nav aria-label="Brotkrumennavigation" className="text-sm text-home-slate"><Link href="/" className="underline">Startseite</Link> / Fachkräfte aus Marokko</nav>
      <section className="mt-8 rounded-[2rem] bg-home-strong px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
        <p className="text-sm font-bold tracking-wide text-white/70">AMUD SKILLS · INTERNATIONALE PERSONALVERMITTLUNG</p>
        <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Qualifizierte Fachkräfte aus Marokko für deutsche Unternehmen</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-white/80 sm:text-lg">Amud Skills unterstützt Unternehmen dabei, marokkanische Talente kennenzulernen und passende Profile für den eigenen Personalbedarf anzufragen. Auswahl, Gespräche und Einstellungsentscheidungen bleiben transparent beim Arbeitgeber.</p>
        <Link href="/employeurs" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-home-coral px-6 py-3 font-bold text-white">Kandidaten anfragen</Link>
      </section>
      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8"><h2 className="text-xl font-bold">Ein vielfältiger Talentpool</h2><p className="mt-3 leading-7 text-home-slate">Profile können eine Berufsausbildung, technische Spezialisierung, akademische Abschlüsse oder praktische Erfahrung umfassen. Entscheidend sind die Anforderungen Ihrer konkreten Stelle und die nachweisbaren Kompetenzen.</p></article>
        <article className="rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8"><h2 className="text-xl font-bold">Sprachkenntnisse differenziert betrachten</h2><p className="mt-3 leading-7 text-home-slate">Deutschkenntnisse werden im Profil transparent angegeben – von keinen Vorkenntnissen bis C1+. Das passende Niveau hängt von Aufgaben, Sicherheitsanforderungen, Kundenkontakt und möglichen berufsrechtlichen Vorgaben ab.</p></article>
      </section>
      <section className="mt-10 rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8"><h2 className="text-2xl font-bold">Berufsfelder</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sectors.map((sector) => <li key={sector} className="rounded-xl bg-home-sand p-4 font-semibold">{sector}</li>)}</ul><p className="mt-5 leading-7 text-home-slate">Die Verfügbarkeit geeigneter Kandidatinnen und Kandidaten ist abhängig vom konkreten Bedarf und den jeweiligen Profilen.</p></section>
      <section className="mt-10" aria-labelledby="workflow"><h2 id="workflow" className="text-2xl font-bold">So läuft die Zusammenarbeit ab</h2><ol className="mt-5 grid gap-4 sm:grid-cols-2">{steps.map(([title, body], index) => <li key={title} className="rounded-2xl border border-home-line bg-home-surface p-6"><span className="text-sm font-bold text-home-coral">0{index + 1}</span><h3 className="mt-2 text-lg font-bold">{title}</h3><p className="mt-2 leading-7 text-home-slate">{body}</p></li>)}</ol></section>
      <section className="mt-10 rounded-2xl bg-home-coral-soft p-6 sm:p-8"><h2 className="text-xl font-bold">Qualifikationen und Anerkennung</h2><p className="mt-3 max-w-4xl leading-7 text-home-slate">Ob eine berufliche Anerkennung erforderlich ist, richtet sich nach dem Beruf und den einschlägigen Vorschriften. Nutzen Sie das offizielle Portal <a className="font-semibold underline" href="https://www.anerkennung-in-deutschland.de/html/en/pro/professional-recognition.php" target="_blank" rel="noreferrer">Anerkennung in Deutschland</a>, um zuständige Stellen und Verfahren zu recherchieren.</p></section>
      <section className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl bg-home-strong p-6 text-white sm:flex-row sm:items-center sm:p-8"><div><h2 className="text-2xl font-bold">Sie möchten passende Profile kennenlernen?</h2><p className="mt-2 text-white/75">Teilen Sie uns Ihre Anforderungen mit.</p></div><Link href="/employeurs" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-home-coral px-6 py-3 font-bold text-white">Fachkräfte finden</Link></section>
      <p className="mt-8 text-sm leading-6 text-home-slate">Amud Skills unterstützt Matching und Vorauswahl. Eine Einstellung, Anerkennung oder Aufenthaltserlaubnis wird nicht garantiert; Entscheidungen treffen Arbeitgeber und zuständige Behörden.</p>
    </div>
  </main>;
}
