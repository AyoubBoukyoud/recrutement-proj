'use client';

// Page : Score de visibilité - Candidat (Stitch exact template)

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function VisibilitePage() {
  const [dashOffset, setDashOffset] = useState(263.89);

  useEffect(() => {
    // 82% of 263.89 circumference -> offset = 263.89 - (0.82 * 263.89) = 47.5
    const timer = setTimeout(() => {
      setDashOffset(47.5);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-surface pb-24 text-onSurface">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 mx-auto flex w-full max-w-xl items-center justify-between border-b border-surface-container-high bg-surface px-4 py-4">
        <Link
          href="/dashboard"
          aria-label="Retour"
          className="flex items-center text-primary transition-opacity hover:opacity-80 active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            arrow_back
          </span>
        </Link>
        <h1 className="text-xl font-extrabold text-primary">Ma visibilité</h1>
        <div className="text-sm font-extrabold text-primary">FR</div>
      </header>

      <main className="mx-auto mt-6 max-w-xl px-4">
        {/* Score de visibilité - Prominent Gauge */}
        <section className="mb-10 flex flex-col items-center">
          <div className="relative flex h-48 w-48 items-center justify-center">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              <circle
                className="stroke-current text-surface-container-high"
                cx="50"
                cy="50"
                fill="transparent"
                r="42"
                strokeWidth="8"
              />
              <circle
                className="progress-ring__circle stroke-current text-gold transition-all duration-1000 ease-in-out"
                cx="50"
                cy="50"
                fill="transparent"
                r="42"
                strokeLinecap="round"
                strokeWidth="8"
                style={{
                  strokeDasharray: '263.89 263.89',
                  strokeDashoffset: dashOffset,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-onSurface">82</span>
              <span className="text-sm font-semibold text-outline">/ 100</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-full bg-gold/20 px-4 py-1 text-xs font-bold text-tertiary shadow-sm border border-gold/30">
            <span className="material-symbols-outlined fill text-[18px]">workspace_premium</span>
            Niveau : Or
          </div>
        </section>

        {/* Secondary Stats - Progressive Pillars */}
        <section className="mb-10 space-y-4">
          <div className="rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-onSurface">Complétude du profil</span>
              <span className="text-sm font-extrabold text-primary">+80 pts</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-2 rounded-full bg-primary" style={{ width: '80%' }} />
            </div>
          </div>

          <div className="rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-onSurface">Activité mensuelle</span>
              <span className="text-sm font-extrabold text-primary">+60 pts</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-2 rounded-full bg-primary" style={{ width: '60%' }} />
            </div>
          </div>

          <div className="rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-onSurface">Badges obtenus</span>
              <span className="text-sm font-extrabold text-primary">+90 pts</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-2 rounded-full bg-primary" style={{ width: '90%' }} />
            </div>
          </div>
        </section>

        {/* Conseils pour progresser - Task Section */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-onSurface">Conseils pour progresser</h2>
          <div className="space-y-4">
            {/* Task Card 1 */}
            <div className="flex flex-col gap-4 rounded-pillar border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-4 shadow-subtle">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                  <span className="material-symbols-outlined text-[24px]">videocam</span>
                </div>
                <p className="text-sm leading-relaxed text-onSurface font-medium">
                  Ajoutez une vidéo de présentation pour gagner <span className="font-bold text-primary">+15 points.</span>
                </p>
              </div>
              <Link
                href="/video"
                className="block w-full rounded-pillar bg-primary py-3 text-center text-sm font-bold text-onPrimary transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                Filmer
              </Link>
            </div>

            {/* Task Card 2 */}
            <div className="flex flex-col gap-4 rounded-pillar border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-4 shadow-subtle">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-onSurface">
                  <span className="material-symbols-outlined text-[24px]">language</span>
                </div>
                <p className="text-sm leading-relaxed text-onSurface font-medium">
                  Passez le test d&apos;allemand pour débloquer le badge <span className="font-bold text-tertiary">Vérifié.</span>
                </p>
              </div>
              <Link
                href="/test-langue"
                className="block w-full rounded-pillar border border-primary py-3 text-center text-sm font-bold text-primary transition-all hover:bg-surface-container-low active:scale-[0.98]"
              >
                Passer le test
              </Link>
            </div>
          </div>
        </section>

        {/* Derniers badges Section */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-onSurface">Derniers badges</h2>
            <button type="button" className="text-sm font-bold text-primary">
              Voir tout
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            <div className="flex w-32 shrink-0 flex-col items-center rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 text-center shadow-subtle">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
                <span className="material-symbols-outlined fill text-[28px]">verified_user</span>
              </div>
              <span className="text-xs font-bold leading-tight text-onSurface">Identité Vérifiée</span>
            </div>

            <div className="flex w-32 shrink-0 flex-col items-center rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 text-center shadow-subtle">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-tertiary">
                <span className="material-symbols-outlined fill text-[28px]">translate</span>
              </div>
              <span className="text-xs font-bold leading-tight text-onSurface">Test Arabe C2</span>
            </div>

            <div className="flex w-32 shrink-0 flex-col items-center rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 text-center shadow-subtle">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low text-primary">
                <span className="material-symbols-outlined fill text-[28px]">code</span>
              </div>
              <span className="text-xs font-bold leading-tight text-onSurface">Python Pro</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
