'use client';

import { Button } from '@/components/shared/Button';

// Page affichée par le service worker (next-pwa `fallbacks.document`) quand une navigation
// échoue hors-ligne et que la route demandée n'a pas été mise en cache au préalable.

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 bg-surface px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 40 }}>
          cloud_off
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-onSurface">Vous êtes hors-ligne</h1>
        <p className="max-w-xs text-sm text-onSurface-variant">
          Cette page n&apos;est pas disponible sans connexion. Vérifiez votre réseau puis réessayez.
        </p>
      </div>

      <Button onClick={() => window.location.reload()} className="px-6 shadow-soft">
        Réessayer
      </Button>
    </main>
  );
}
