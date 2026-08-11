'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { PrimaryCta } from './Cta';

/**
 * Bloc mono-action : aucun lien concurrent. Tout lien secondaire placé ici
 * réduit mécaniquement le taux de clic de la seule action qui compte.
 *
 * L'identifiant est lu par la barre d'action mobile, qui se masque quand ce
 * bloc est visible pour ne pas afficher deux fois le même bouton.
 */
export function FinalCta() {
  const { finalCta } = useHomeContent();
  return (
    <section id="cta-final" className="px-6 pb-20 lg:px-12">
      <div className="mx-auto w-full max-w-[1280px] overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-on-primary lg:py-20">
        <h2 className="mx-auto max-w-[18ch] text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold leading-tight">
          {finalCta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-[1.0625rem] leading-relaxed text-on-primary/85">
          {finalCta.subtitle}
        </p>

        <PrimaryCta href="/auth-phone" size="lg" onDark className="mt-8">
          {finalCta.cta}
        </PrimaryCta>

        <p className="mt-4 text-sm text-on-primary/70">{finalCta.microcopy}</p>
      </div>
    </section>
  );
}
