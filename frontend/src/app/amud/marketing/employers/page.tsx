'use client';

import { MarketingFooter, MarketingNav, MarketingToast, useMarketingToast } from '@/components/amud/MarketingShell';

/** `/amud/marketing/employers` — page employeurs, confiance & conformité (doc: "Trust & Compliance"). */
const STATS = [
  { icon: 'timer', value: '136 Days', label: 'National Average Vacancy', iconClass: 'text-amud-error' },
  { icon: 'medical_services', value: '212 Days', label: 'Healthcare Vacancy', iconClass: 'text-amud-primary-fixed', raised: true },
  { icon: 'trending_down', value: '-40%', label: 'Time-to-Hire Reduction', iconClass: 'text-amud-secondary' },
];

const STANDARDS = [
  {
    icon: 'gpp_good',
    title: 'GDPR / DSGVO Compliant',
    desc: "L'ensemble de notre processus de sourcing, de vérification et de transmission de données respecte strictement les réglementations allemandes et européennes en matière de protection des données.",
  },
  {
    icon: 'school',
    title: 'Verified CEFR German Levels',
    desc: "Nous garantissons que tous les candidats atteignent le niveau d'allemand B1/B2 requis, authentifié par des centres de test accrédités avant le placement.",
  },
];

export default function AmudMarketingEmployersPage() {
  const { notice, notify } = useMarketingToast();

  return (
    <div className="min-h-screen overflow-x-hidden bg-amud-background text-amud-on-background">
      <MarketingNav active="employers" onDeadAction={notify} />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-gutter">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h1 className="mb-6 text-headline-lg-mobile text-amud-primary md:text-display-lg">
                Recrutez au Maroc avec les standards de confiance allemands.
              </h1>
              <p className="mb-8 text-body-lg text-amud-on-surface-variant">
                Réduisez vos délais de vacance de poste grâce à des professionnels marocains vérifiés, hautement
                qualifiés, formés aux standards CECR allemands stricts et entièrement conformes au RGPD.
              </p>
              <div className="flex gap-4">
                <a
                  href="#roi"
                  className="rounded bg-amud-primary-container px-6 py-3 text-label-md font-semibold text-white shadow-sm transition-colors hover:bg-amud-primary"
                >
                  Calculate ROI
                </a>
                <a
                  href="#standards"
                  className="rounded border border-amud-inverse-surface px-6 py-3 text-label-md font-semibold text-amud-inverse-surface transition-colors hover:bg-amud-surface-container-low"
                >
                  View Standards
                </a>
              </div>
            </div>
            <div className="relative h-[400px] overflow-hidden rounded-xl border border-amud-primary/10 shadow-sm">
              <img
                alt="Professionnelle de santé marocaine dans un établissement médical allemand moderne."
                className="absolute inset-0 h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCD0ddlmdhHojXFTkDT0rDqJP0G3eDihGx90p5l_mEy0HNv0qWzAHHXml0p_4vGSFpZdAvawH1xTQOMjQLBBzDGA7VlzD51Jo6UrXjnZzu6dcCRPxpokHME41cDPWBynEQNckNFWVzxFlH4QX_T3rz2fQ9FOdlIv6ja8veuviAU9eC0t-cntXnUAB9m04c4QfAkQRs-uoH-nglNvd9fcfFkxavKirYXguaCNBnsXmVciu5_E1waW-gw"
              />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section id="statistics" className="relative border-y border-amud-primary/10 bg-amud-surface-container-lowest py-section-gap">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNDYsIDQ1LCA5OCwgMC4wNSkiLz48L3N2Zz4=')",
            }}
          />
          <div className="relative z-10 mx-auto max-w-container-max px-margin-mobile md:px-gutter">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-headline-lg text-amud-primary">The Cost of Vacancy</h2>
              <p className="mx-auto max-w-2xl text-body-md text-amud-on-surface-variant">
                Le Mittelstand allemand fait face à des délais sans précédent pour ses recrutements critiques. Amud
                Skills comble cet écart grâce à un sourcing rigoureux et vérifié.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {STATS.map((s) =>
                s.raised ? (
                  <div
                    key={s.label}
                    className="flex flex-col items-center rounded-lg bg-amud-primary p-6 text-center text-amud-on-primary shadow-[0_4px_24px_-8px_rgba(46,45,98,0.15)] md:-translate-y-4"
                  >
                    <span className="material-symbols-outlined fill mb-4 text-4xl text-amud-primary-fixed">{s.icon}</span>
                    <h3 className="mb-2 text-headline-lg text-amud-on-primary">{s.value}</h3>
                    <p className="text-label-md uppercase tracking-wider text-amud-primary-fixed-dim">{s.label}</p>
                  </div>
                ) : (
                  <div
                    key={s.label}
                    className="flex flex-col items-center rounded-lg border border-amud-primary/10 bg-amud-surface p-6 text-center shadow-[0_4px_24px_-8px_rgba(46,45,98,0.05)]"
                  >
                    <span className={`material-symbols-outlined fill mb-4 text-4xl ${s.iconClass}`}>{s.icon}</span>
                    <h3 className="mb-2 text-headline-lg text-amud-primary">{s.value}</h3>
                    <p className="text-label-md uppercase tracking-wider text-amud-on-surface-variant">{s.label}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Compliance & ROI */}
        <section id="standards" className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-gutter">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-headline-lg text-amud-primary">Uncompromising Standards</h2>
              <div className="space-y-6">
                {STANDARDS.map((s) => (
                  <div key={s.title} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amud-surface-container-high">
                      <span className="material-symbols-outlined text-amud-primary">{s.icon}</span>
                    </div>
                    <div>
                      <h3 className="mb-2 text-headline-md text-amud-primary">{s.title}</h3>
                      <p className="text-body-md text-amud-on-surface-variant">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="roi" className="rounded-xl border border-amud-primary/10 bg-amud-surface-container-low p-8">
              <h3 className="mb-6 text-center text-headline-md text-amud-primary">ROI Calculator</h3>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  notify('Estimation calculée — maquette, aucune donnée envoyée.');
                }}
              >
                <div>
                  <label htmlFor="roi-open-positions" className="mb-1 block text-label-md text-amud-on-surface-variant">Open Positions</label>
                  <input
                    id="roi-open-positions"
                    className="w-full rounded border-amud-outline-variant bg-amud-surface-container-lowest focus:border-amud-primary focus:ring-1 focus:ring-amud-primary"
                    placeholder="e.g., 3"
                    type="number"
                    min={0}
                  />
                </div>
                <div>
                  <label htmlFor="roi-industry" className="mb-1 block text-label-md text-amud-on-surface-variant">Industry</label>
                  <select id="roi-industry" className="w-full rounded border-amud-outline-variant bg-amud-surface-container-lowest focus:border-amud-primary focus:ring-1 focus:ring-amud-primary">
                    <option>Healthcare (Avg 212 days)</option>
                    <option>Logistics (Avg 145 days)</option>
                    <option>IT (Avg 160 days)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="mt-4 w-full rounded bg-amud-inverse-surface py-3 text-label-md text-white transition-colors hover:bg-amud-primary"
                >
                  Calculate Savings
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <MarketingToast notice={notice} />
    </div>
  );
}
