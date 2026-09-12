'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { PARTNERS } from '@/lib/socialProofData';
import { Reveal } from './Reveal';

/**
 * Logos des partenaires (centres, entreprises, institutions). N'affiche rien
 * tant que `PARTNERS` est vide — la page interdit les logos non vérifiés
 * (plan §13, home.fr.json `_note`). Ajouter une entrée réelle dans
 * `socialProofData.ts` suffit à faire apparaître la section.
 */
export function SocialProofSection() {
  const content = useHomeContent();

  if (PARTNERS.length === 0) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-primary-dark sm:text-3xl">
            {content.socialProof.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-onSurface-variant sm:text-base">
            {content.socialProof.subtitle}
          </p>
        </Reveal>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {PARTNERS.map((partner, index) => (
            <li key={partner.id}>
              <Reveal delay={index * 40}>
                {partner.href ? (
                  <a href={partner.href} className="block grayscale transition-all hover:grayscale-0" target="_blank" rel="noreferrer">
                    <img
                      src={partner.logo}
                      alt={partner.logoAlt}
                      loading="lazy"
                      className="h-10 w-auto object-contain sm:h-12"
                    />
                  </a>
                ) : (
                  <img
                    src={partner.logo}
                    alt={partner.logoAlt}
                    loading="lazy"
                    className="h-10 w-auto object-contain grayscale sm:h-12"
                  />
                )}
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
