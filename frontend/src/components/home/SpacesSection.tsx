'use client';

import { useState } from 'react';
import { useHomeContent } from '@/lib/useLocalizedContent';
import { Icon, SectionHeading } from './ui';
import { Reveal } from './Reveal';

const TAB_ICONS = ['person', 'corporate_fare', 'school'];

/**
 * « À chacun son espace » : un sélecteur d'onglet (candidat / employeur /
 * centre) au-dessus d'un aperçu stylisé d'écran mobile. Construit en
 * HTML/CSS plutôt qu'à partir de vraies captures d'écran des espaces
 * internes — ceux-ci ont leur propre charte (`/amud/*`) et ne sont pas
 * destinés à être montrés tels quels sur la page publique.
 */
export function SpacesSection() {
  const { spaces } = useHomeContent();
  const [active, setActive] = useState(0);
  const tab = spaces.tabs[active];

  return (
    <section className="bg-home-teal py-20 text-white lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal>
          <SectionHeading eyebrow={spaces.eyebrow} title={spaces.title} subtitle={spaces.subtitle} align="center" tone="white" className="mx-auto" />
        </Reveal>

        <Reveal delay={80} className="mt-10 flex justify-center">
          <div role="tablist" className="inline-flex flex-wrap justify-center gap-2 rounded-2xl bg-white/10 p-1.5">
            {spaces.tabs.map((item, index) => (
              <button
                key={item.label}
                type="button"
                role="tab"
                aria-selected={index === active}
                onClick={() => setActive(index)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                  index === active ? 'bg-white text-home-teal shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                <Icon name={TAB_ICONS[index] ?? 'star'} className="text-base" />
                {item.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={140} className="mx-auto mt-12 max-w-sm">
          <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.06] p-2 shadow-[0_30px_70px_rgba(0,0,0,0.25)] backdrop-blur">
            <div className="rounded-[1.6rem] bg-home-surface p-6 text-home-ink">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-home-slate">{tab.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-home-coral-soft text-home-coral-dark">
                  <Icon name={TAB_ICONS[active] ?? 'star'} className="text-base" />
                </span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-home-ink">{tab.screenTitle}</h3>

              <ul className="mt-5 space-y-2.5">
                {tab.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-home-line bg-home-sand px-4 py-3 text-sm font-semibold text-home-ink"
                  >
                    <Icon name="check_circle" className="shrink-0 text-lg text-home-coral" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
