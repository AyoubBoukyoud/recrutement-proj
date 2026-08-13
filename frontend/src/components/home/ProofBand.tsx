'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';

/**
 * Preuve.
 *
 * Tant qu'aucun chiffre n'est vérifiable, cette section affiche des
 * **engagements opposables** plutôt que des statistiques inventées : un chiffre
 * faux découvert coûte plus cher que l'absence de chiffre (plan §7.3).
 * Les trois engagements décrits ici correspondent à des règles réellement
 * implémentées côté serveur.
 */
export function ProofBand() {
  const { proof } = useHomeContent();
  return (
    <section className="bg-surface-container/50 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-12">
        <div className="max-w-[68ch]">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-tight text-onSurface">
            {proof.title}
          </h2>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-onSurface-variant">{proof.subtitle}</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {proof.items.map((item) => (
            <article key={item.title} className="rounded-2xl border-s-4 border-primary bg-surface-lowest p-6 shadow-soft">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }} aria-hidden="true">
                {item.icon}
              </span>
              <h3 className="mt-3 text-base font-bold text-onSurface">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
