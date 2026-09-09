'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console -- seul filet de sécurité côté client pour ces erreurs non gérées.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-6 py-16 text-center text-onSurface">
      <span className="text-sm font-bold uppercase tracking-widest text-error">Une erreur est survenue</span>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Quelque chose s&apos;est mal passé</h1>
      <p className="max-w-md text-sm leading-relaxed text-onSurface-variant">
        La page n&apos;a pas pu s&apos;afficher correctement. Vous pouvez réessayer, ou revenir à l&apos;accueil si le
        problème persiste.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-soft transition-colors hover:bg-primary-dark active:scale-[0.99]"
        >
          Réessayer
        </button>
        <a
          href="/accueil-public"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant px-6 py-3 text-sm font-semibold text-onSurface transition-colors hover:bg-surface-container"
        >
          Retour à l&apos;accueil
        </a>
      </div>
    </main>
  );
}
