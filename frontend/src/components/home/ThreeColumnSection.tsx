'use client';

import { Icon, SectionHeading } from './ui';
import { Reveal } from './Reveal';

interface ThreeColumnItem {
  icon: string;
  title: string;
  body: string;
}

interface ThreeColumnSectionProps {
  id?: string;
  title: string;
  subtitle: string;
  items: readonly ThreeColumnItem[];
  background?: 'white' | 'sand';
}

/** Section générique à trois colonnes icône + titre + texte, sans bandeau ni CTA — réutilisée par « nextSteps » et « clarity », structurellement identiques dans la maquette. */
export function ThreeColumnSection({ id, title, subtitle, items, background = 'white' }: ThreeColumnSectionProps) {
  return (
    <section id={id} className={`${id ? 'scroll-mt-20' : ''} py-20 lg:py-28 ${background === 'sand' ? 'bg-home-sand' : 'bg-home-surface'}`}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal>
          <SectionHeading title={title} subtitle={subtitle} align="center" className="mx-auto" />
        </Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.title} delay={index * 70} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-home-ink/[0.05] text-home-ink">
                <Icon name={item.icon} className="text-2xl" />
              </span>
              <h3 className="mt-4 text-base font-bold text-home-ink">{item.title}</h3>
              <p className="mx-auto mt-2 max-w-[26ch] text-sm leading-relaxed text-home-slate">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
