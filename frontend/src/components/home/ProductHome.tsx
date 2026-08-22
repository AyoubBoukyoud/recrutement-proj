'use client';

import Link from 'next/link';
import { useHomeContent } from '@/lib/useLocalizedContent';
import { Reveal, RevealNoScriptFallback } from './Reveal';

/**
 * Corps de la page d'accueil (ex-`/produit`).
 *
 * Séparé de la route pour la même raison que `TradeDetail` : la page reste un
 * composant serveur pour ses métadonnées, tandis que le texte suit la langue
 * choisie, connue seulement côté client. Icônes, images et proportions des
 * secteurs / de la méthodologie restent codées ici — seul le texte affiché
 * vient de `content.product`.
 */
const SECTOR_LAYOUT = [
  {
    key: 'btp' as const,
    span: true,
    icon: 'construction',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAw4vlnE3XDHPJrp9WNEeysG38OPgcDkyc3wfzraMK-Z4OYKHdLmlQSnlClka3sVxzQBi1Q42BuMHEGHDpnu1n5Wvbqv2LNUyUs1P9sQ6KY4B1psOcGdA70ja-RDetIxhNwsUcSRp1ngkT16u1eth8WUN7Ujgl5ZhCO_C1iv1V6jdkNOPcpgpp87e1PVZLeqYLfmSQGZd0bDjy7sUu-4u9ZknCGduirn-PrEb7zGQFQyI9HAOMWsPAn',
  },
  { key: 'sante' as const, span: false, icon: 'local_hospital' },
  { key: 'logistique' as const, span: false, icon: 'local_shipping' },
  {
    key: 'gastro' as const,
    span: true,
    icon: 'restaurant',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD3GYSnVz36JrmTvbc2AAIvo7ajMZm8l9t114RQ_1adRua64ugXRDYfatxORztuLMhDwtM70hDFSC6RBSmLouATITmLqPUEkIUIjW-8LTb5lfdiYLmDVfKPzbh2GccVBO0PSKtbD2MOAw4SHfu9WrKcdrTOqCUtjHxGgON59YewGOrz7rvdlH5o8-o9aW06od04Em6OhejNrS12iD7y8tDj2b-kXILQl0tEDAFHlEOjAwmeWa3X3sBz',
  },
];

const HERO_IMAGE_1 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTuzd2xcPzcITWWKi3oqP-8_NiY7Dz4E0ZpqCZS4KyoYmMLDEhSC9TaXJBCw3fUjkfZRq_OL_St5cp5rz1h1WvcsPvuzi4CPlO7LBa3bsPoiKQNN-dOb5jC6bE2_GTjuxW__kPwf-lpd0fZvmmA39VMVVG91acZoEWNrr3aIXxjyJlBs_qg_9j1ejTgAL1R1Ti5ki1ery8sCDl5m10wBbTcXsp6NBG9hvbX2IXMqFN9p3QlDBJZSLR';
const HERO_IMAGE_2 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCakwtRBAhssQOk-eMEyJ69WjXminzNylTAez8IlVCkkI1U3u4tiJi9EpTpotXtkDw1zNig1E5N9t2wRVwReSPtbSzgbm_NYHGlNIGk6xPfmKPqga33Y2knPCQrwVxQTXe2aamnfyCohufCEV4IuiBvPhHh6eb6iGJfVSPzJMCQlfAb8ehhjOCEGDW9JPiraHPeZUWbpQ3Jq_lLYxubPfWsagH61d2sPgIqxPNbA0O5Dx2qZEn-CgBZ';
const PITCH_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCwWjUI29GwCuRoJESpLhrR8BfSoC6fOs4USoNJC5Hw4ZrKvz_4IFDb06oL3SbZgJ4Hwf7BKv_jI8q1B2AObbkuC5todINdNJm0UUXhGGikSNoxgL_00yrUZfuJK2Nh1JbJtXYcwurHBmm_-_pXhj8vRmloy8HCs0_D986WnjS0-ti3FsiKn3qUw9tXQHvNSSgB-40E5_PzQLjK1twOPW6lQEmymuOOSBqZpfLyT7yLAYHrhddusotL';

export function ProductHome() {
  const content = useHomeContent();
  const copy = content.product;

  return (
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
                <span className="text-label-md font-semibold text-amud-inverse-surface">{copy.hero.badge}</span>
              </div>
              <h1 className="text-headline-lg-mobile leading-tight text-amud-inverse-surface md:text-display-lg">
                {copy.hero.headline[0]}{' '}
                <span className="text-amud-primary-container">{copy.hero.headline[1]}</span>
              </h1>
              <p className="max-w-xl text-body-lg text-amud-on-surface-variant">{copy.hero.subheadline}</p>
              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <Link
                  href="/employeurs"
                  className="rounded bg-amud-primary-container px-8 py-4 text-label-md font-bold text-white shadow-[0_4px_14px_0_rgba(27,94,55,0.39)] transition-all hover:bg-amud-primary"
                >
                  {copy.hero.ctaPrimary}
                </Link>
                <Link
                  href="/auth-phone"
                  className="rounded bg-amud-inverse-surface px-8 py-4 text-label-md font-bold text-white shadow-[0_4px_14px_0_rgba(38,49,67,0.39)] transition-all hover:bg-amud-inverse-surface/90"
                >
                  {copy.hero.ctaSecondary}
                </Link>
              </div>
            </div>

            <div className="relative flex h-[600px] items-center justify-center">
              <div className="relative h-full w-full max-w-md">
                <div className="absolute right-0 top-10 h-[500px] w-64 scale-95 rotate-6 overflow-hidden rounded-3xl border-4 border-amud-surface-container-high bg-white opacity-80 shadow-2xl blur-[1px] transition-transform duration-500 hover:z-30 hover:rotate-0 hover:scale-100 hover:opacity-100 hover:blur-none">
                  <img className="h-full w-full object-cover" alt={copy.hero.imageAlt1} src={HERO_IMAGE_1} />
                </div>
                <div className="absolute left-10 top-0 z-20 h-[550px] w-72 -rotate-2 overflow-hidden rounded-3xl border-4 border-amud-inverse-surface bg-white shadow-2xl transition-transform duration-500 hover:rotate-0 hover:scale-105">
                  <div className="absolute top-0 z-10 h-12 w-full bg-gradient-to-b from-black/50 to-transparent" />
                  <img className="h-full w-full object-cover" alt={copy.hero.imageAlt2} src={HERO_IMAGE_2} />
                  <div className="absolute bottom-10 left-1/2 w-11/12 -translate-x-1/2 rounded-xl border border-amud-surface-container-high bg-white/90 p-4 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amud-primary-container/20">
                        <span className="material-symbols-outlined fill text-amud-primary-container">check_circle</span>
                      </div>
                      <div>
                        <div className="text-label-sm font-bold text-amud-inverse-surface">{copy.hero.card.matchTitle}</div>
                        <div className="text-xs text-amud-on-surface-variant">{copy.hero.card.matchSubtitle}</div>
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
            <h2 className="mb-4 text-headline-lg text-amud-inverse-surface">{copy.features.title}</h2>
            <p className="text-body-md text-amud-on-surface-variant">{copy.features.subtitle}</p>
          </Reveal>
          <div className="grid auto-rows-[minmax(300px,auto)] grid-cols-1 gap-6 md:grid-cols-3">
            <Reveal className="h-full md:col-span-2">
              <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-amud-inverse-surface/10 bg-white p-8 shadow-[0_8px_30px_rgb(38,49,67,0.05)] transition-transform duration-300 hover:-translate-y-1 md:flex-row md:items-center md:gap-8">
                <div className="flex flex-col justify-center md:w-1/2">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-amud-secondary/10">
                    <span className="material-symbols-outlined fill text-2xl text-amud-secondary">videocam</span>
                  </div>
                  <h3 className="mb-3 text-headline-md text-amud-inverse-surface">{copy.features.items.pitch.title}</h3>
                  <p className="text-body-md text-amud-on-surface-variant">{copy.features.items.pitch.body}</p>
                </div>
                <div className="mt-6 h-48 w-full shrink-0 overflow-hidden rounded-lg md:mt-0 md:h-auto md:w-1/2 md:aspect-[4/3]">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={copy.features.items.pitch.imageAlt}
                    src={PITCH_IMAGE}
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
                  <h3 className="mb-3 text-headline-md text-white">{copy.features.items.zeroCost.title}</h3>
                  <p className="text-body-md text-amud-surface-variant/80">{copy.features.items.zeroCost.body}</p>
                </div>
              </div>
            </Reveal>

            <Reveal className="h-full" delay={160}>
              <div className="group flex h-full flex-col justify-between rounded-xl border border-amud-inverse-surface/10 bg-white p-8 shadow-[0_8px_30px_rgb(38,49,67,0.05)] transition-transform duration-300 hover:-translate-y-1">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-amud-inverse-surface/10">
                    <span className="material-symbols-outlined fill text-2xl text-amud-inverse-surface">document_scanner</span>
                  </div>
                  <h3 className="mb-3 text-headline-md text-amud-inverse-surface">{copy.features.items.ocr.title}</h3>
                </div>
                <p className="text-body-md text-amud-on-surface-variant">{copy.features.items.ocr.body}</p>
              </div>
            </Reveal>

            <Reveal className="h-full md:col-span-2" delay={240}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-amud-inverse-surface/10 bg-white p-8 shadow-[0_8px_30px_rgb(38,49,67,0.05)] transition-transform duration-300 hover:-translate-y-1 md:flex-row md:items-center">
                <div className="z-10 md:w-1/2 md:pr-8">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-amud-primary-container/20">
                    <span className="material-symbols-outlined fill text-2xl text-amud-primary-container">track_changes</span>
                  </div>
                  <h3 className="mb-3 text-headline-md text-amud-inverse-surface">{copy.features.items.tracking.title}</h3>
                  <p className="text-body-md text-amud-on-surface-variant">{copy.features.items.tracking.body}</p>
                </div>
                <div className="mt-8 flex flex-col justify-center gap-4 md:mt-0 md:h-full md:w-1/2 md:pl-12">
                  <div className="flex items-center gap-4 opacity-50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amud-surface-container-high text-xs text-amud-inverse-surface">
                      1
                    </div>
                    <div className="h-1 flex-1 bg-amud-surface-container-high" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-xs font-bold text-white shadow-[0_0_10px_rgba(27,94,55,0.5)]">
                      2
                    </div>
                    <div className="h-1 flex-1 bg-amud-primary-container" />
                  </div>
                  <div className="flex items-center gap-4 opacity-50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-amud-surface-container-high text-xs text-amud-inverse-surface">
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

      {/* Sectors */}
      <section id="sectors" className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-gutter">
        <Reveal className="mb-12 text-center">
          <h2 className="text-headline-lg text-amud-on-surface">{copy.sectors.title}</h2>
          <p className="mt-2 text-body-md text-amud-on-surface-variant">{copy.sectors.subtitle}</p>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {SECTOR_LAYOUT.map((s, idx) => {
            const item = copy.sectors.items[s.key];
            return s.image ? (
              <Reveal key={s.key} className={s.span ? 'md:col-span-2' : ''} delay={idx * 80}>
                <div className="group relative h-64 cursor-pointer overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest transition-all hover:shadow-md">
                  <div className="absolute inset-0 z-10 bg-gradient-to-r from-amud-surface-tint/90 to-transparent" />
                  <img
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={'imageAlt' in item ? item.imageAlt : item.title}
                    src={s.image}
                  />
                  <div className="relative z-20 flex h-full flex-col justify-end p-8 transition-transform duration-300 group-hover:-translate-y-1">
                    <span className="material-symbols-outlined mb-2 text-3xl text-white">{s.icon}</span>
                    <h3 className="text-headline-md text-white">{item.title}</h3>
                  </div>
                </div>
              </Reveal>
            ) : (
              <Reveal key={s.key} delay={idx * 80}>
                <div className="group flex h-64 cursor-pointer flex-col justify-between rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-8 transition-all hover:-translate-y-1 hover:shadow-md">
                  <span className="material-symbols-outlined text-4xl text-amud-primary transition-transform duration-300 group-hover:scale-110">
                    {s.icon}
                  </span>
                  <div>
                    <h3 className="text-headline-md text-amud-on-surface">{item.title}</h3>
                    <p className="mt-1 text-label-sm text-amud-on-surface-variant">{'subtitle' in item ? item.subtitle : ''}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Methodology */}
      <section id="methodology" className="relative overflow-hidden border-y border-amud-surface-dim bg-amud-surface-container-low py-20">
        <div className="relative z-10 mx-auto max-w-container-max px-margin-mobile md:px-gutter">
          <Reveal className="mb-12 max-w-2xl">
            <h2 className="text-headline-lg text-amud-on-surface">{copy.methodology.title}</h2>
            <p className="mt-4 text-body-md text-amud-on-surface-variant">{copy.methodology.subtitle}</p>
          </Reveal>
          <div className="relative flex flex-col justify-between gap-8 md:flex-row">
            <div className="absolute left-0 top-1/2 z-0 hidden h-1 w-full -translate-y-1/2 bg-amud-surface-dim md:block" />
            {copy.methodology.steps.map((m, idx) => (
              <Reveal key={m.title} className="relative z-10 h-full flex-1" delay={idx * 100}>
                <div
                  className={`group h-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    idx === 1 ? 'shadow-md md:-translate-y-4 md:hover:-translate-y-5' : 'shadow-sm'
                  }`}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amud-primary text-headline-md text-white transition-transform duration-300 group-hover:scale-110">
                    {idx + 1}
                  </div>
                  <h4 className="mb-2 font-bold text-amud-on-surface">{m.title}</h4>
                  <p className="text-label-sm text-amud-on-surface-variant">{m.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
