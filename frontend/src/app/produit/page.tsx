import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/home/SiteFooter';
import { Reveal, RevealNoScriptFallback } from '@/components/home/Reveal';

export const metadata: Metadata = {
  title: 'Matching en temps réel — Amud Skills',
  description:
    "Une expérience de mise en relation fluide entre professionnels marocains et opportunités allemandes. Mobile d'abord, gratuit pour les candidats.",
};

/**
 * `/produit` — vitrine produit, matching en temps réel.
 *
 * Contenu porté depuis la maquette "Impactful & Modern" (voir
 * `/amud/marketing/product` pour la version isolée d'origine). Page
 * entièrement statique : `SiteHeader` / `SiteFooter` réels, aucun état côté
 * client requis ici.
 */
export default function ProduitPage() {
  return (
    <>
      <SiteHeader />

      <main className="overflow-x-hidden bg-amud-background text-amud-on-background selection:bg-amud-primary-container/30 selection:text-amud-inverse-surface">
        <RevealNoScriptFallback />
        {/* Hero */}
        <section className="relative overflow-hidden pb-32 pt-20 sm:pt-28 lg:pt-36">
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-amud-inverse-surface/5"
            style={{
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23263143\\' fill-opacity=\\'0.05\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
            }}
          />
          <div className="relative z-10 mx-auto max-w-container-max px-margin-mobile md:px-gutter">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-amud-primary-container/20 bg-amud-primary-container/10 px-4 py-2">
                  <span className="material-symbols-outlined fill text-sm text-amud-primary-container">bolt</span>
                  <span className="text-label-md font-semibold text-amud-inverse-surface">Real-Time Marketplace</span>
                </div>
                <h1 className="text-headline-lg-mobile leading-tight text-amud-inverse-surface md:text-display-lg">
                  Matching en temps réel :{' '}
                  <span className="text-amud-primary-container">Vos futurs talents sont déjà sur Amud Skills.</span>
                </h1>
                <p className="max-w-xl text-body-lg text-amud-on-surface-variant">
                  Une expérience de mise en relation fluide, façon Tinder, connectant les professionnels marocains
                  aux opportunités allemandes. Mobile d&apos;abord, gratuit pour les candidats, et ultra-rapide.
                </p>
                <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                  <Link
                    href="/employeurs"
                    className="rounded bg-amud-primary-container px-8 py-4 text-label-md font-bold text-white shadow-[0_4px_14px_0_rgba(27,94,55,0.39)] transition-all hover:bg-amud-primary"
                  >
                    Find Talent Now
                  </Link>
                  <Link
                    href="/"
                    className="rounded bg-amud-inverse-surface px-8 py-4 text-label-md font-bold text-white shadow-[0_4px_14px_0_rgba(38,49,67,0.39)] transition-all hover:bg-amud-inverse-surface/90"
                  >
                    Join as Candidate
                  </Link>
                </div>
              </div>

              <div className="relative flex h-[600px] items-center justify-center">
                <div className="relative h-full w-full max-w-md">
                  <div className="absolute right-0 top-10 h-[500px] w-64 scale-95 rotate-6 overflow-hidden rounded-3xl border-4 border-amud-surface-container-high bg-white opacity-80 shadow-2xl blur-[1px] transition-transform duration-500 hover:z-30 hover:rotate-0 hover:scale-100 hover:opacity-100 hover:blur-none">
                    <img
                      className="h-full w-full object-cover"
                      alt="Profil vidéo d'un candidat marocain sur l'application mobile."
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTuzd2xcPzcITWWKi3oqP-8_NiY7Dz4E0ZpqCZS4KyoYmMLDEhSC9TaXJBCw3fUjkfZRq_OL_St5cp5rz1h1WvcsPvuzi4CPlO7LBa3bsPoiKQNN-dOb5jC6bE2_GTjuxW__kPwf-lpd0fZvmmA39VMVVG91acZoEWNrr3aIXxjyJlBs_qg_9j1ejTgAL1R1Ti5ki1ery8sCDl5m10wBbTcXsp6NBG9hvbX2IXMqFN9p3QlDBJZSLR"
                    />
                  </div>
                  <div className="absolute left-10 top-0 z-20 h-[550px] w-72 -rotate-2 overflow-hidden rounded-3xl border-4 border-amud-inverse-surface bg-white shadow-2xl transition-transform duration-500 hover:rotate-0 hover:scale-105">
                    <div className="absolute top-0 z-10 h-12 w-full bg-gradient-to-b from-black/50 to-transparent" />
                    <img
                      className="h-full w-full object-cover"
                      alt="Interface de matching façon Tinder entre un candidat et une offre allemande."
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCakwtRBAhssQOk-eMEyJ69WjXminzNylTAez8IlVCkkI1U3u4tiJi9EpTpotXtkDw1zNig1E5N9t2wRVwReSPtbSzgbm_NYHGlNIGk6xPfmKPqga33Y2knPCQrwVxQTXe2aamnfyCohufCEV4IuiBvPhHh6eb6iGJfVSPzJMCQlfAb8ehhjOCEGDW9JPiraHPeZUWbpQ3Jq_lLYxubPfWsagH61d2sPgIqxPNbA0O5Dx2qZEn-CgBZ"
                    />
                    <div className="absolute bottom-10 left-1/2 w-11/12 -translate-x-1/2 rounded-xl border border-amud-surface-container-high bg-white/90 p-4 shadow-lg backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amud-primary-container/20">
                          <span className="material-symbols-outlined fill text-amud-primary-container">check_circle</span>
                        </div>
                        <div>
                          <div className="text-label-sm font-bold text-amud-inverse-surface">Match Found!</div>
                          <div className="text-xs text-amud-on-surface-variant">Senior Developer, Berlin</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-amud-surface-container-low py-section-gap">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
            <Reveal className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-headline-lg text-amud-inverse-surface">Streamlined Pipeline</h2>
              <p className="text-body-md text-amud-on-surface-variant">
                Notre technologie absorbe la friction pour que vous puissiez vous concentrer sur la connexion.
                Entièrement automatisé, mobile d&apos;abord, et pensé pour la vitesse.
              </p>
            </Reveal>
            <div className="grid auto-rows-[minmax(300px,auto)] grid-cols-1 gap-6 md:grid-cols-3">
              <Reveal className="h-full md:col-span-2">
                <div className="group relative h-full overflow-hidden rounded-xl border border-amud-inverse-surface/10 bg-white p-8 shadow-[0_8px_30px_rgb(38,49,67,0.05)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="relative z-10 flex h-full w-2/3 flex-col justify-center">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-amud-secondary/10">
                      <span className="material-symbols-outlined fill text-2xl text-amud-secondary">videocam</span>
                    </div>
                    <h3 className="mb-3 text-headline-md text-amud-inverse-surface">The 45-Second Pitch</h3>
                    <p className="text-body-md text-amud-on-surface-variant">
                      Fini la lettre de motivation. Les candidats se présentent via de courts profils vidéo structurés.
                      Authenticité et compétences de communication d&apos;emblée.
                    </p>
                  </div>
                  <div className="absolute bottom-0 right-0 top-0 w-1/2 bg-gradient-to-l from-amud-surface-container-high/50 to-transparent">
                    <img
                      className="h-full w-full object-cover opacity-80 mix-blend-multiply"
                      alt="Représentation abstraite d'un enregistrement vidéo sur mobile."
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwWjUI29GwCuRoJESpLhrR8BfSoC6fOs4USoNJC5Hw4ZrKvz_4IFDb06oL3SbZgJ4Hwf7BKv_jI8q1B2AObbkuC5todINdNJm0UUXhGGikSNoxgL_00yrUZfuJK2Nh1JbJtXYcwurHBmm_-_pXhj8vRmloy8HCs0_D986WnjS0-ti3FsiKn3qUw9tXQHvNSSgB-40E5_PzQLjK1twOPW6lQEmymuOOSBqZpfLyT7yLAYHrhddusotL"
                    />
                  </div>
                </div>
              </Reveal>

              <Reveal className="h-full" delay={80}>
                <div className="group relative flex h-full flex-col justify-center overflow-hidden rounded-xl bg-amud-inverse-surface p-8 shadow-[0_8px_30px_rgb(38,49,67,0.15)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-amud-inverse-surface/5 opacity-20" />
                  <div className="relative z-10">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-amud-primary-container/20">
                      <span className="material-symbols-outlined fill text-2xl text-amud-primary-container">money_off</span>
                    </div>
                    <h3 className="mb-3 text-headline-md text-white">Zero Cost for Candidates</h3>
                    <p className="text-body-md text-amud-surface-variant/80">
                      Démocratiser l&apos;opportunité. Nous supprimons les barrières financières pour garantir l&apos;accès
                      aux meilleurs talents, quel que soit leur parcours.
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal className="h-full" delay={160}>
                <div className="group flex h-full flex-col justify-between rounded-xl border border-amud-inverse-surface/10 bg-white p-8 shadow-[0_8px_30px_rgb(38,49,67,0.05)] transition-transform duration-300 hover:-translate-y-1">
                  <div>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-amud-inverse-surface/10">
                      <span className="material-symbols-outlined fill text-2xl text-amud-inverse-surface">document_scanner</span>
                    </div>
                    <h3 className="mb-3 text-headline-md text-amud-inverse-surface">Intelligent OCR</h3>
                  </div>
                  <p className="text-body-md text-amud-on-surface-variant">
                    Vérification instantanée des documents et extraction de données. Des cartes d&apos;identité aux
                    certifications, traités en millisecondes avec la précision allemande.
                  </p>
                </div>
              </Reveal>

              <Reveal className="h-full md:col-span-2" delay={240}>
                <div className="group relative flex h-full items-center overflow-hidden rounded-xl border border-amud-inverse-surface/10 bg-white p-8 shadow-[0_8px_30px_rgb(38,49,67,0.05)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="z-10 w-1/2 pr-8">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-amud-primary-container/20">
                      <span className="material-symbols-outlined fill text-2xl text-amud-primary-container">track_changes</span>
                    </div>
                    <h3 className="mb-3 text-headline-md text-amud-inverse-surface">Real-Time Tracking</h3>
                    <p className="text-body-md text-amud-on-surface-variant">
                      Candidats et employeurs savent exactement où ils en sont. Progression transparente de la
                      candidature à l&apos;intégration via notre système de pont visuel.
                    </p>
                  </div>
                  <div className="absolute right-0 top-0 flex h-full w-1/2 flex-col justify-center gap-4 pl-12">
                    <div className="flex items-center gap-4 opacity-50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amud-surface-container-high text-xs text-amud-inverse-surface">
                        1
                      </div>
                      <div className="h-1 flex-1 bg-amud-surface-container-high" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amud-primary-container text-xs font-bold text-white shadow-[0_0_10px_rgba(27,94,55,0.5)]">
                        2
                      </div>
                      <div className="h-1 flex-1 bg-amud-primary-container" />
                    </div>
                    <div className="flex items-center gap-4 opacity-50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amud-surface-container-high text-xs text-amud-inverse-surface">
                        3
                      </div>
                      <div className="h-1 flex-1 bg-amud-surface-container-high/50" />
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
