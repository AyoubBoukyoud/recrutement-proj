'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';

/**
 * Remplace le « pourquoi nous » générique par quatre **mécanismes** existants
 * dans le produit. Une page d'accueil qui décrit un mécanisme vérifiable
 * survit au premier contact avec l'application ; une page qui vend une
 * sensation ne survit pas.
 *
 * Le brief prévoyait une alternance texte / capture d'écran. Les captures
 * réelles n'existent pas encore et une capture inventée serait un mensonge :
 * la grille tient lieu de mise en page tant que le prop `media` n'est pas
 * alimenté (voir plan §2.6).
 */
export function CredibleSection() {
  const { credible } = useHomeContent();
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-12">
        <div className="max-w-[68ch]">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-tight text-onSurface">
            {credible.title}
          </h2>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-onSurface-variant">{credible.subtitle}</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {credible.items.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-outline-variant bg-surface-lowest p-6 shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden="true">
                  {item.icon}
                </span>
              </span>
              <h3 className="mt-4 text-base font-bold text-onSurface">{item.title}</h3>
              <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-onSurface-variant">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
